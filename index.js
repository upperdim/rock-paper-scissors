var canv = document.getElementById("canv")
var ctx  = canv.getContext("2d")
let intervalId = 0

var canvGraph = document.getElementById("canv_graph")
var ctxGraph  = canvGraph.getContext("2d")

const CANVAS_WIDTH     = canv.width
const CANVAS_HEIGHT    = canv.height
const PI2              = 2 * Math.PI
const BACKGROUND_COLOR = '#000000'
const AGENT_COUNT      = 20
const MOVEMENT_SPEED   = 0.1
const COLLUSION_RADIUS = 20
const IMAGE_DIM        = 32
const HALF_IMAGE_DIM   = IMAGE_DIM / 2

const TYPE_ROCK        = 1001
const TYPE_PAPER       = 1002
const TYPE_SCISSORS    = 1003

const images = {};

function preloadImages() {
	images[TYPE_ROCK] = new Image();
	images[TYPE_ROCK].src = "rsc/rock.png";

	images[TYPE_PAPER] = new Image();
	images[TYPE_PAPER].src = "rsc/paper.png";

	images[TYPE_SCISSORS] = new Image();
	images[TYPE_SCISSORS].src = "rsc/scissors.png";
}

class Graph {
	constructor(sx, sy, rx, ry, px, py) {
		this.rx = rx
		this.ry = ry

		this.sx = sx
		this.sy = sy

		this.px = px
		this.py = py

		let a = ry - sy
		let b = px - rx
		let c = Math.sqrt(a * a + b * b)
		let d = Math.sqrt((b * b) / 2)

		this.dSx = 0               // x component of pixel decrease per agent decrease
		this.dSy = a / AGENT_COUNT // y component of pixel decrease per agent decrease

		this.dPx = b / AGENT_COUNT
		this.dPy = 0

		this.dRx = (Math.sqrt((b * b) / 2) / AGENT_COUNT) * Math.cos(45)
		this.dRy = (Math.sqrt((b * b) / 2) / AGENT_COUNT) * Math.sin(45)
	}

	// Draws initial structure of the graph
	init() {
		paintCanvas(ctxGraph, 'BACKGROUND_COLOR')
		drawLine(ctxGraph, this.sx, this.sy, this.rx, this.ry)
		drawLine(ctxGraph, this.rx, this.ry, this.px, this.py)
		drawLine(ctxGraph, this.px, this.py, this.sx, this.sy)
		if (images[TYPE_SCISSORS]) ctxGraph.drawImage(images[TYPE_SCISSORS], this.sx, this.sy)
		if (images[TYPE_ROCK])     ctxGraph.drawImage(images[TYPE_ROCK],     this.rx, this.ry)
		if (images[TYPE_PAPER])    ctxGraph.drawImage(images[TYPE_PAPER],    this.px, this.py)
	}

	// Draws data dots of the graph
	update(agents) {
		let rock_count = 0
		let paper_count = 0
		let scissors_count = 0

		for (let agent of agents) {
			if (agent.type === TYPE_ROCK)     rock_count++
			if (agent.type === TYPE_PAPER)    paper_count++
			if (agent.type === TYPE_SCISSORS) scissors_count++
		}

		let rock_point_x = this.rx + this.dRx * (AGENT_COUNT - rock_count)
		let rock_point_y = this.ry - this.dRy * (AGENT_COUNT - rock_count)

		let paper_point_x = this.px - this.dPx * (AGENT_COUNT - paper_count)
		let paper_point_y = this.py - this.dPy * (AGENT_COUNT - paper_count)

		let scissors_point_x = this.sx - this.dSx * (AGENT_COUNT - scissors_count)
		let scissors_point_y = this.sy + this.dSy * (AGENT_COUNT - scissors_count)

		const radius = 3

		drawCircle(ctxGraph, paper_point_x,       paper_point_y, 6, '#ffffff')
		drawCircle(ctxGraph, scissors_point_x, scissors_point_y, 4, '#ff0000')
		drawCircle(ctxGraph, rock_point_x,         rock_point_y, 2, '#00ff00')
	}
}

class Agent {
	constructor(type, posX, posY) {
		this.type = type
		this.posX = posX
		this.posY = posY
	}

	draw() {
		let img = images[this.type];
		if (img) {
			ctx.drawImage(
				img, 
				this.posX - HALF_IMAGE_DIM, 
				this.posY - HALF_IMAGE_DIM)
		}
		// this.drawCircleAround(COLLUSION_RADIUS) // debug
	}

	drawCircleAround(radius) {
		drawCircle(ctx, this.posX, this.posY, radius, '#888888')
	}

	// Check if this instance was captured by another agent and change type accordingly
	updateType(agents, ownIndex) {
		for (let i = ownIndex + 1; i < agents.length; ++i) {
			if (this.type === agents[i].type)
				continue

			if (distAgent(this, agents[i]) < COLLUSION_RADIUS) {
				const threatOrTarget = isThreatOrTarget(this.type, agents[i].type)

				if (threatOrTarget === -1) {
					agents[i].type = this.type // target
				} else if (threatOrTarget === 1) {
					this.type = agents[i].type // threat
				}
			}
		}
	}

	move(agents, ownIndex, deltaTimeMs) {
		let closestTarget = null
		let closestThreat = null
		let closestTargetDist = null
		let closestThreatDist = null

		for (let i = 0; i < agents.length; ++ i) {
			if (i == ownIndex || this.type === agents[i].type)
				continue

			const threatOrTarget = isThreatOrTarget(this.type, agents[i].type)
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
				this.moveTowards(closestTarget.posX, closestTarget.posY, deltaTimeMs)
			} else {
				this.moveAwayFrom(closestThreat.posX, closestThreat.posY, deltaTimeMs)
			}
		} else if (closestTarget != null) {
			this.moveTowards(closestTarget.posX, closestTarget.posY, deltaTimeMs)
		} else if (closestThreat != null) {
			this.moveAwayFrom(closestThreat.posX, closestThreat.posY, deltaTimeMs)
		}
	}

	moveTowards(x, y, deltaTimeMs) {
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
		const newX = this.posX + dx * MOVEMENT_SPEED * deltaTimeMs
		const newY = this.posY + dy * MOVEMENT_SPEED * deltaTimeMs

		// Boundary check before moving
		if (newX > 0 && newX < CANVAS_WIDTH)
			this.posX = newX
		if (newY > 0 && newY < CANVAS_HEIGHT)
			this.posY = newY
	}

	moveAwayFrom(x, y, deltaTimeMs) {
		const oppositeX = this.posX - (x - this.posX)
		const oppositeY = this.posY - (y - this.posY)
		this.moveTowards(oppositeX, oppositeY, deltaTimeMs)
	}
}

// Return  1 if `compareWith` is THREAT to `type`
// Return  0 if they are the same
// Return -1 if `compareWith` is TARGET of `type`
function isThreatOrTarget(type, compareWith) {
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
		agents.push(new Agent(
			types[randInt(0, 2)], 
			randInt(0, CANVAS_WIDTH), 
			randInt(0, CANVAS_HEIGHT)))
	}
	return agents
}

function drawCircle(context, x, y, r, color) {
	context.beginPath();
	context.arc(x, y, r, 0, PI2);
	context.closePath();
	context.strokeStyle = color;
	context.lineWidth = 2;
	context.stroke();
}

function drawLine(context, x1, y1, x2, y2) {
	context.beginPath();
	context.lineWidth = 3;
	context.strokeStyle = '#ffffff'
	context.moveTo(x2, y2);
	context.lineTo(x1, y1);
	context.stroke();
}

function paintCanvas(context, colorString) {
	context.beginPath()
	context.fillStyle = colorString
	context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
	context.closePath()
	context.fill()
}
	
function clearScreen(context) {
	paintCanvas(context, BACKGROUND_COLOR)
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
	preloadImages()
	let agents = createRandomAgents(AGENT_COUNT)
	let graph = new Graph(50, 50, 50, 670, 670, 670)
	graph.init()

	let previousTimeMs = performance.now(); // gives a timestamp in milliseconds with fractions eg. 1234.56

	// When RequestAnimationFrame calls this, its first parameter is the current time
	function gameTick(currentTimeMs) {
		const deltaTimeMs = currentTimeMs - previousTimeMs;
		previousTimeMs = currentTimeMs;

		if (!isAllSameType(agents)) {
			for (let i = 0; i < AGENT_COUNT; ++i) {
				agents[i].updateType(agents, i)
				agents[i].move(agents, i, deltaTimeMs)
			}
			clearScreen(ctx)
			agents.forEach((agent) => { agent.draw() })
			clearScreen(ctxGraph) // temp, it will be a continuous line
			graph.init()          // temp, it will be a continuous line
			graph.update(agents)

			requestAnimationFrame(gameTick); // setup for next frame
		}
	}

	requestAnimationFrame(gameTick);
}

main()

document.getElementById("restartButton").addEventListener("click", function() {
    clearInterval(intervalId) // stop current simulation loop
    main()                    // restart the simulation
})
