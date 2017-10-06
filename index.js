var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var engine = require('./public/game')

var gameInterval, updateInterval, tick

function gameLoop() {
  // increment tick
  tick++
  if (tick % 1 == 0) {
    engine.circleRadius--
  }
  // move everyone around
  Object.keys(engine.players).forEach((playerId) => {
    let player = engine.players[playerId]
    engine.movePlayer(playerId)
    engine.checkCircle(player, tick) // this is only done server-side
  })

  if (engine.gameHasEnded()) {
    endGame()
    setTimeout(startGame, 5000)
  }
}

// ----------------------------------------
// Main server code
// ----------------------------------------

// serve css and js
app.use(express.static('public'))

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});



function emitUpdates() {
  // tell everyone what's up
  io.emit('gameStateUpdate', engine.gameState());
}

function startGame() {
  console.log("STARTING NEW GAME")
  io.emit('gameStart');
  gameInterval = setInterval(gameLoop, 25)
  updateInterval = setInterval(emitUpdates, 40)
  engine.circleRadius = engine.initialRadius
  tick = 0

  // set all players to active players with 50 hp in new positions
  engine.getPlayerList().forEach(function(player) {
    var openPosition = engine.getOpenPosition(player.id)
    player.hp = 50
    player.ghost = false
    player.colour = '#aa00ff'
    player.x = openPosition.x
    player.y = openPosition.y
  })

  // place healing entities and harming entities
  engine.placeStaticEntities()
}

function endGame() {
  console.log("GAME ENDING")
  io.emit('gameEnd');
  clearInterval(gameInterval)
  clearInterval(updateInterval)
}

io.on('connection', function(socket){
  console.log('User connected: ', socket.id)

  var openPosition = engine.getOpenPosition(socket.id)

  // start game if this is the first player
  if (Object.keys(engine.players).length == 0) {
    startGame()
    // add player to engine.players obj at random position
    engine.players[socket.id] = {
    	accel: {
    		x: 0,
    		y: 0
    	},
      x: openPosition.x,
      y: openPosition.y,
    	colour: '#aa00ff',
      ghost: false, // if true, player floats around hurting folk
      type: 'player',
      hp: 50, // start player at 50% of max HP
    	score: 0,
      id: socket.id
    }
  } else {
    // add a ghost
    engine.players[socket.id] = {
      accel: {
        x: 0,
        y: 0
      },
      x: openPosition.x,
      y: openPosition.y,
      colour: 'red',
      ghost: true, // if true, player floats around hurting folk
      type: 'player',
      hp: 0, // start player at 50% of max HP
      score: 0,
      id: socket.id
    }
  }



  // set socket listeners

  socket.on('disconnect', function() {
  	delete engine.players[socket.id]
  	// end game if there are no engine.players left
  	if (Object.keys(engine.players).length > 0) {
    	io.emit('gameStateUpdate', engine.gameState());
  	} else {
  		endGame()
  	}
  })

  // handle player action events

  socket.on('up', function(msg){
    engine.accelPlayer(socket.id, 0, -1)
  });

  socket.on('down', function(msg) {
    engine.accelPlayer(socket.id, 0, 1)
  })

  socket.on('left', function(msg){
    engine.accelPlayer(socket.id, -1, 0)
  });

  socket.on('right', function(msg) {
    engine.accelPlayer(socket.id, 1, 0)
  })
});

http.listen(process.env.PORT || 8080, function(){
  console.log('listening on *:8080', process.env.PORT);
});
