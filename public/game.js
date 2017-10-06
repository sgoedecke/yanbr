var players = {}

var healEntities = []
var harmEntities = []

var INITIAL_CIRCLE_RADIUS = 2000
var circleRadius = 2000

const gameSize = 2500; // will be downscaled 5x to 500x500 when we draw

const playerSize = 100; // (downscaled to 20x20)
const maxAccel = 10

function getPlayerList() {
  return Object.keys(players).map(function(key) { return players[key] })
}

function allEntities() {
  var playerList = getPlayerList()
  return playerList.concat(healEntities).concat(harmEntities)
}

function gameState() {
  return {
    players: players,
    healEntities: healEntities,
    harmEntities: harmEntities,
    circleRadius: this.circleRadius
  }
}

function activePlayers() {
  return getPlayerList().filter(function(p) { return p.hp > 0 }).length
}

function gameHasEnded() {
  return activePlayers() == 0
}

// checks for collision of two square entities with x/y properties
function checkCollision(obj1, obj2) {
  return(Math.abs(obj1.x - obj2.x) <= playerSize && Math.abs(obj1.y - obj2.y) <= playerSize)
}

function isValidPosition(newPosition, player) {
  // bounds check
  if (newPosition.x < 0 || newPosition.x + playerSize > gameSize) {
    return false
  }
  if (newPosition.y < 0 || newPosition.y + playerSize > gameSize) {
    return false
  }
  // collision check
  var hasCollided = false


  allEntities().forEach((entity) => {
    if (entity.id == player.id) { return } // ignore current player in collision check
    // if the players overlap. hope this works
    if (checkCollision(entity, newPosition)) {
      if (entity.type == 'player') {
        // knock the player away
        entity.accel.x = Math.min((player.accel.x * 2) + entity.accel.x, maxAccel)
        entity.accel.y = Math.min((player.accel.y * 2) + entity.accel.y, maxAccel)

        if (entity.ghost) {
          // player has rammed into a ghost. decrease that player's hp
          player.hp -= 10
          handleDeath(player)
        }
        if (player.ghost) {
          // ghost has rammed into an active player. decrease that player's hp
          entity.hp -= 10
          handleDeath(entity)
        }
      }

      if (entity.type == 'heal' && !player.ghost) {
        player.hp += 10
        healEntities.splice(healEntities.indexOf(entity), 1)
      }

      if (entity.type == 'harm' && !player.ghost) {
        player.hp -= 40
        handleDeath(player)
        harmEntities.splice(harmEntities.indexOf(entity), 1)
      }
      hasCollided = true

      return // don't bother checking other stuff
    }
  })
  if (hasCollided) {
    return false
  }

  return true
}

// move a player based on their accel. pass a tick in to handle not-every-tick events
function movePlayer(id) {
  var player = players[id]

  var newPosition = {
    x: player.x + player.accel.x,
    y: player.y + player.accel.y
  }

  if (isValidPosition(newPosition, player)) {
    // move the player and increment score
    player.x = newPosition.x
    player.y = newPosition.y
  } else {
    // handle player running into something
      player.accel.x = 0
      player.accel.y = 0
    // Math.min(player.accel.x * -1.5, maxAccel)
    // Math.min(player.accel.y * -1.5, maxAccel)
  }
}

function checkCircle(player, tick) {
  // why this.circleRadius? otherwise it locks on 2000. no idea why :(
  if (!isInCircle(player, this.circleRadius) && tick % 10 == 0) {
    player.hp--
    handleDeath(player)
  }
}

function isInCircle(player, radius) {
  return Math.sqrt(Math.pow((player.x-gameSize/2), 2) + Math.pow((player.y-gameSize/2), 2)) < radius
}

function accelPlayer(id, x, y) {
  var player = players[id]
  var currentX = player.accel.x
  var currentY = player.accel.y

  // set direction stuff - only used for UI
  if (x > 0) {
    player.direction = 'right'
  } else if (x < 0) {
    player.direction = 'left'
  } else if (y > 0) {
    player.direction = 'down'
  } else if (y < 0) {
    player.direction = 'up'
  }

  if (Math.abs(currentX + x) < maxAccel) {
    player.accel.x += x
  }
  if (Math.abs(currentY + y) < maxAccel) {
    player.accel.y += y
  }
}

// gets an open position for a new entity in the game world
function getOpenPosition(id) {
  var posX = 0
  var posY = 0
  while (!isValidPosition({ x: posX, y: posY }, {id: id, accel: {x:0,y:0}})) {
    posX = Math.floor(Math.random() * Number(gameSize) - 100) + 10
    posY = Math.floor(Math.random() * Number(gameSize) - 100) + 10
  }
  return { x: posX, y: posY}
}

function placeStaticEntities() {
  // clear current entities
  healEntities = []
  harmEntities = []

  // place new ones
  var numHealEntities = 10
  var numHarmEntities = 10
  var openPosition
  for (var i = 0; i < numHealEntities; i++) {
    openPosition = getOpenPosition('heal')
    healEntities.push({x: openPosition.x, y: openPosition.y, type: 'heal', colour: '#146b01'})
  }
  for (var i = 0; i < numHarmEntities; i++) {
    openPosition = getOpenPosition('harm')
    harmEntities.push({x: openPosition.x, y: openPosition.y, type: 'harm', colour: '#8e0c05'})
  }
}

function handleDeath(player) {
  if (player.hp <= 0) {
    player.hp = 0
    player.ghost = true
    player.colour = 'red'
  }
}

if (!this.navigator) { // super hacky thing to determine whether this is a node module or inlined via script tag
  module.exports = {
    circleRadius: this.circleRadius,
    activePlayers: activePlayers,
    checkCircle: checkCircle,
    initialRadius: INITIAL_CIRCLE_RADIUS,
    players: players,
    allEntities: allEntities,
    gameState: gameState,
    healEntities: healEntities,
    harmEntities: harmEntities,
    accelPlayer: accelPlayer,
    movePlayer: movePlayer,
    playerSize: playerSize,
    gameSize: gameSize,
    isValidPosition: isValidPosition,
    getOpenPosition: getOpenPosition,
    placeStaticEntities: placeStaticEntities,
    gameHasEnded: gameHasEnded
  }
}
