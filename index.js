var canv = document.getElementById("canv")
var ctx  = canv.getContext("2d")

const CANVAS_WIDTH     = canv.width
const CANVAS_HEIGHT    = canv.height
const PI2              = 2 * Math.PI
const BACKGROUND_COLOR = '#000000'
const AGENT_COUNT      = 6

imagePaths = {
	"rock": "rsc/rock.png",
	"paper": "rsc/paper.png",
	"scissors": "rsc/scissors.png"
}

class Agent {
	constructor(type, posX, posY) {
		this.type = type
		this.posX = posX
		this.posY = posY
	}

	draw() {
		let img = new Image()
		img.src = imagePaths[this.type]
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
			
			if (dist(this.posX, this.posY, agents[i].posX, agents[i].posY) < 32) {
				if (this.type === "rock") {
					if (agents[i].type === "paper") {
						this.type = "paper"
					} else if (agents[i].type === "scissors") {
						agents[i].type = "rock"
					}
				} else if (this.type === "paper") {
					if (agents[i].type === "rock") {
						this.type = "paper"
					} else if (agents[i].type === "scissors") {
						agents[i].type = "paper"
					}
				} else if (this.type === "scissors") {
					if (agents[i].type === "rock") {
						this.type = "rock"
					} else if (agents[i].type === "paper") {
						agents[i].type = "paper"
					}
				}
			}
		}
	}

	move(agents, ownIndex) {
		// TODO: boundary limits
		this.posX += randInt(-5, 5)
		this.posY += randInt(-5, 5)
	}
}

// Return the distance between points P1(x1, y1) and P2(x2, y2)
function dist(x1, y1, x2, y2) {
	return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1))
}

// Return a random int from `min` to `max interval both inclusive
function randInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

// Return a list of random agents with `count` number of agents
function createRandomAgents(count) {
	let agents = []
	const types = ["rock", "paper", "scissors"]
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
