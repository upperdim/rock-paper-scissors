var canv = document.getElementById("canv")
var ctx  = canv.getContext("2d")
let intervalId = 0

const CANVAS_WIDTH     = canv.width
const CANVAS_HEIGHT    = canv.height
const PI2              = 2 * Math.PI
const BACKGROUND_COLOR = '#000000'
const AGENT_COUNT      = 100
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
	preloadImages()
	let agents = createRandomAgents(AGENT_COUNT)

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
			clearScreen()
			agents.forEach((agent) => { agent.draw() })
		}

		requestAnimationFrame(gameTick);
	}

	requestAnimationFrame(gameTick);
}

main()

document.getElementById("restartButton").addEventListener("click", function() {
    clearInterval(intervalId) // stop current simulation loop
    main()                    // restart the simulation
})
