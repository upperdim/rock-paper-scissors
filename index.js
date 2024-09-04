var canv = document.getElementById("canv")
var ctx  = canv.getContext("2d")

const CANVAS_WIDTH     = canv.width
const CANVAS_HEIGHT    = canv.height
const PI2              = 2 * Math.PI
const BACKGROUND_COLOR = '#000000'
const AGENT_COUNT      = 6

const TYPE_ROCK        = 1001
const TYPE_PAPER       = 1002
const TYPE_SCISSORS    = 1003

class Agent {
	constructor(type, posX, posY) {
		this.type = type
		this.posX = posX
		this.posY = posY
	}

	draw() {
		let img = new Image()
		if (this.type === TYPE_ROCK)
			img.src = "rsc/rock.png"
		else if (this.type === TYPE_PAPER)
			img.src = "rsc/paper.png"
		else if (this.type === TYPE_SCISSORS)
			img.src = "rsc/scissors.png"
		let agentInstance = this
		img.onload = function() {
			ctx.drawImage(
				img, 
				agentInstance.posX, 
				agentInstance.posY)
		}
	}

	// Check if this instance was captured by another agent and change type accordingly
	changeType(agents, ownIndex) {
		for (let i = ownIndex + 1; i < agents.length; ++i) {
			if (this.type === agents[i].type)
				continue
			
			if (distAgent(this, agents[i]) < 32) {
				const threatOrTarget = isThreatorTarget(this.type, agents[i].type)

				if (threatOrTarget === -1) {
					agents[i].type = this.type // target
				} else if (threatOrTarget === 1) {
					this.type = agents[i].type // threat
				}
			}
		}
	}

	move(agents, ownIndex) {
		// TODO: boundary limits
		this.posX += randInt(-5, 5) // temp
		this.posY += randInt(-5, 5) // temp

		let closestTarget = null
		let closestThreat = null
		let closestTargetDist = null
		let closestThreatDist = null

		for (let i = 0; i < agents.length; ++ i) {
			if (i == ownIndex || this.type === agents[i].type)
				continue

			const threatOrTarget = isThreatorTarget(this.type, agents[i].type)
			const distance = distAgent(this, agents[i])

			if (threatOrTarget === -1) {
				if (closestTarget === null || distance < closestTargetDist) {
					closestTarget = agents[i]
					closestTargetDist = distance
				}
			} else if (threatOrTarget === 1) {
				if (closestThreat === null || distance < closestThreatDist) {
					closestThreat = agents[i]
					closestThreatDist = distance
				}
			}
		}

		// TODO: if both exist:
		// TODO: if target is closer than threat, run towards it
		// TODO: if threat is closer than target, run from it
		// TODO: if one exist:
		// TODO: run towards if target, run from if threat
	}
}

// Return  1 if `compareWith` is THREAT to `type`
// Return  0 if they are the same
// Return -1 if `compareWith` is TARGET of `type`
function isThreatorTarget(type, compareWith) {
	if (type === compareWith)
		return 0

	if (type === TYPE_ROCK) {
		if (compareWith === TYPE_PAPER) {
			return 1
		} else if (compareWith === TYPE_SCISSORS) {
			return -1
		}
	} else if (type === TYPE_PAPER) {
		if (compareWith === TYPE_ROCK) {
			return 1
		} else if (compareWith === TYPE_SCISSORS) {
			return -1
		}
	} else if (type === TYPE_SCISSORS) {
		if (compareWith === TYPE_ROCK) {
			return 1
		} else if (compareWith === TYPE_PAPER) {
			return -1
		}
	}
}

// Return the distance between points P1(x1, y1) and P2(x2, y2)
function dist(x1, y1, x2, y2) {
	return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1))
}

// TODO: move this into the class for OOP
// Return the distance between agents `a1` and `a2`
function distAgent(a1, a2) {
	return Math.sqrt((a2.posX - a1.posX) * (a2.posX - a2.posX) + (a2.posY - a1.posY) * (a2.posY - a1.posY))
}

// Return a random int from `min` to `max interval both inclusive
function randInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

// Return a list of random agents with `count` number of agents
function createRandomAgents(count) {
	let agents = []
	const types = [TYPE_ROCK, TYPE_PAPER, TYPE_SCISSORS]
	for (let i = 0; i < count; ++i) {
		agents.push(new Agent(types[randInt(0, 2)], randInt(0, CANVAS_WIDTH), randInt(0, CANVAS_HEIGHT)))
	}
	return agents
}

// Paint whole canvas to a color
function paintCanvas(colorString) {
	ctx.beginPath()
	ctx.fillStyle = colorString
	ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
	ctx.closePath()
	ctx.fill()
}
	
function clearScreen() {
	paintCanvas(BACKGROUND_COLOR)
}

// Return whether all agents are the same type
function isAllSameType(agents) {
	if (agents.length === 0) {
		return true
	}

	const firstType = agents[0].type

	for (let agent of agents) {
		if (agent.type != firstType) {
			return false
		}
	}

	return true
}

function main() {
	let agents = createRandomAgents(AGENT_COUNT)

	function gameTick() {
		if (isAllSameType(agents) === false) {
			for (let i = 0; i < AGENT_COUNT; ++i) {
				agents[i].changeType(agents, i)
				agents[i].move(agents, i)
			}
			clearScreen()
			agents.forEach((agent) => { agent.draw() })
		}
	}

	setInterval(function() {gameTick()}, 14) // call every 14 milliseconds
}

main()
