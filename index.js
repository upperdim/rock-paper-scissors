var canv = document.getElementById("canv")
var ctx  = canv.getContext("2d")

const CANVAS_WIDTH     = canv.width
const CANVAS_HEIGHT    = canv.height
const PI2              = 2 * Math.PI
const BACKGROUND_COLOR = '#000000'
const AGENT_COUNT      = 20
const MOVEMENT_SPEED   = 2
const COLLUSION_RADIUS = 20
const IMAGE_DIM        = 32
const HALF_IMAGE_DIM   = IMAGE_DIM / 2

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
		if (this.type === TYPE_ROCK)          img.src = "rsc/rock.png"
		else if (this.type === TYPE_PAPER)    img.src = "rsc/paper.png"
		else if (this.type === TYPE_SCISSORS) img.src = "rsc/scissors.png"
		let agentInstance = this
		img.onload = function() {
			ctx.drawImage(
				img, 
				agentInstance.posX - HALF_IMAGE_DIM, 
				agentInstance.posY - HALF_IMAGE_DIM)
		}
		// this.drawCircleAround(COLLUSION_RADIUS) // debug
	}

	drawCircleAround(radius) {
		ctx.beginPath();
        ctx.arc(this.posX, this.posY, radius, 0, PI2);
        ctx.closePath();
		ctx.strokeStyle = '#888888';
        ctx.lineWidth = 2;
        ctx.stroke();
	}

	// Check if this instance was captured by another agent and change type accordingly
	updateType(agents, ownIndex) {
		for (let i = ownIndex + 1; i < agents.length; ++i) {
			if (this.type === agents[i].type)
				continue

			if (distAgent(this, agents[i]) < COLLUSION_RADIUS) {
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

		if (closestTarget != null && closestThreat != null) {
			if (closestTargetDist < closestThreatDist) {
				this.moveTowards(closestTarget.posX, closestTarget.posY)
			} else {
				this.moveTowards(-closestThreatDist.posX, -closestThreatDist.posY)
			}
		} else if (closestTarget != null) {
			this.moveTowards(closestTarget.posX, closestTarget.posY)
		} else if (closestThreat != null) {
			this.moveTowards(-closestThreatDist.posX, -closestThreatDist.posY)
		}
	}

	moveTowards(x, y) {
		// Get the vector from one agent to another
		let dx = x - this.posX
		let dy = y - this.posY

		// Normalize it
		const magnitude = Math.sqrt(dx * dx + dy * dy)
		const inverseSqrt = 1 / magnitude

		if (magnitude > 0) {
			dx *= inverseSqrt
			dy *= inverseSqrt
		}

		// Multiply it with movement speed
		const newX = this.posX + dx * MOVEMENT_SPEED
		const newY = this.posY + dy * MOVEMENT_SPEED

		// Boundary check before moving
		if (newX > 0 && newX < CANVAS_WIDTH)
			this.posX = newX
		if (newY > 0 && newY < CANVAS_HEIGHT)
			this.posY = newY
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
		if (compareWith === TYPE_SCISSORS) {
			return 1
		} else if (compareWith === TYPE_ROCK) {
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

function dist(x1, y1, x2, y2) {
	return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1))
}

// TODO: move this into the class for OOP
function distAgent(a1, a2) {
	return Math.sqrt((a2.posX - a1.posX) * (a2.posX - a1.posX) + (a2.posY - a1.posY) * (a2.posY - a1.posY))
}

// Return a random int from `min` to `max interval both inclusive
function randInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function createRandomAgents(count) {
	let agents = []
	const types = [TYPE_ROCK, TYPE_PAPER, TYPE_SCISSORS]
	for (let i = 0; i < count; ++i) {
		agents.push(new Agent(types[randInt(0, 2)], randInt(0, CANVAS_WIDTH), randInt(0, CANVAS_HEIGHT)))
	}
	return agents
}

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
				agents[i].updateType(agents, i)
				agents[i].move(agents, i)
				}
			clearScreen()
			agents.forEach((agent) => { agent.draw() })
		}
	}

	setInterval(function() {gameTick()}, 14) // call every 14 milliseconds
}

main()
