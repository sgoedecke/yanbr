  $(function () {
    var socket = io();
    var canvas = document.getElementById('game');
    var ctx = canvas.getContext('2d');
    // var players = {}; // this is magically defined in game.js

    var VIEW_SIZE = 2500 // the view size around the player. Same as the canvas size when downscaled 5x

    var gameInterval // the gameLoop setTimeout interval
    var localDirection // used to display accel direction
    var tick = 0
    var gameActive = true

    socket.on('gameStateUpdate', updateGameState);

    socket.on('gameEnd', function() {
      clearInterval(gameInterval)
      gameActive = false
      document.getElementById('playerCount').innerHTML = 'GAME OVER'

    })

    socket.on('gameStart', function() {
      gameActive = true
      gameInterval = setInterval(gameLoop, 25)
    })

    function drawEntities() {

      if (!gameActive) {
        // draw waiting screen
        return
      }

      // NB the game world is 500x500, but we're downscaling 5x to smooth accel out
      const downscaling = 5

      entities = allEntities()

      // draw the current player dead centre

      // returns x,y relative to the player's coords (since the player's in the center, we need to scale)
      function relXY(entity) {
        const currentPlayer = players[socket.id]
        return {
          x: (entity.x - currentPlayer.x) + VIEW_SIZE/2,
          y: (entity.y - currentPlayer.y) + VIEW_SIZE/2
        }
      }

      // draw world background

      const worldBg = { x: 0, y: 0 }
      ctx.fillStyle = '#8EA7CE'; // the colour outside the circle
      ctx.fillRect(relXY(worldBg).x/downscaling, relXY(worldBg).y/downscaling, VIEW_SIZE/downscaling, VIEW_SIZE/downscaling);

      // draw circle
      if (circleRadius > 0) {
        const worldCenter = { x: gameSize/2, y: gameSize/2 }
        ctx.fillStyle = '#c6ad91'; // the colour inside the circle
        ctx.beginPath();
        ctx.arc(relXY(worldCenter).x/downscaling, relXY(worldCenter).y/downscaling, circleRadius/downscaling, 0, 2*Math.PI);
        ctx.fill();
      }

      // draw area outside world background again to letterbox circle
      ctx.fillStyle = 'grey'; // must match the background of the canvas element in css
      ctx.fillRect(0, 0, relXY(worldBg).x/downscaling, VIEW_SIZE/downscaling); // left
      ctx.fillRect(0, 0, VIEW_SIZE/downscaling, relXY(worldBg).y/downscaling); // top
      ctx.fillRect((relXY(worldBg).x + VIEW_SIZE)/downscaling, 0, -relXY(worldBg).x/downscaling, VIEW_SIZE/downscaling); // right
      ctx.fillRect(0, (relXY(worldBg).y + VIEW_SIZE)/downscaling, VIEW_SIZE/downscaling, -relXY(worldBg).y/downscaling,); // bottom



      allEntities().forEach((entity) => {
        var direction

        ctx.fillStyle = entity.colour;
        ctx.fillRect(relXY(entity).x/downscaling, relXY(entity).y/downscaling, playerSize/downscaling, playerSize/downscaling);

        if (entity.id == socket.id) {
          direction = localDirection
        } else if (entity.type == 'player') {
          direction = entity.direction
        } else {
          direction = false
        }
        // draw accel direction for current player based on local variable
        // the idea here is to give players instant feedback when they hit a key
        // to mask the server lag
        ctx.fillStyle = 'black'; // direction indicator color
        let accelWidth = 3
        switch(direction) {
          case false:
            break
          case 'up':
            ctx.fillRect(relXY(entity).x/downscaling, relXY(entity).y/downscaling - accelWidth, playerSize/downscaling, accelWidth);
            break
          case 'down':
            ctx.fillRect(relXY(entity).x/downscaling, relXY(entity).y/downscaling  + playerSize/downscaling, playerSize/downscaling, accelWidth);
            break
          case 'left':
            ctx.fillRect(relXY(entity).x/downscaling - accelWidth, relXY(entity).y/downscaling, accelWidth, playerSize/downscaling);
            break
          case 'right':
            ctx.fillRect(relXY(entity).x/downscaling + playerSize/downscaling, relXY(entity).y/downscaling, accelWidth, playerSize/downscaling);
        }
      })
    }

    function updateGameState(gameState) {
      // update local state to match state on server
      players = gameState.players
      healEntities = gameState.healEntities
      harmEntities = gameState.harmEntities
      circleRadius = gameState.circleRadius

      // draw stuff
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // set other info
      document.getElementById('playerCount').innerHTML = activePlayers() + " player" + (playerCount == 1 ? '' : 's') + " left"
      document.getElementById('hpBarInner').style.maxWidth = String(players[socket.id].hp * 5)+ 'px'

      drawEntities()
    }

    // key handling
    $('html').keydown(function(e) {
      if (e.key == "ArrowDown") {
        socket.emit('down');
        accelPlayer(socket.id, 0, 1)
        localDirection = 'down'
      } else if (e.key == "ArrowUp") {
        socket.emit('up');
        accelPlayer(socket.id, 0, -1)
        localDirection = 'up'
      } else if (e.key == "ArrowLeft") {
        socket.emit('left');
        accelPlayer(socket.id, -1, 0)
        localDirection = 'left'
      } else if (e.key == "ArrowRight") {
        socket.emit('right');
        accelPlayer(socket.id, 1, 0)
        localDirection = 'right'
      }
    })

    function gameLoop() {
      tick++
      if (tick % 1 == 0) {
        circleRadius--
      }
      // update game
      updateGameState({players: players, healEntities: healEntities, harmEntities: harmEntities, circleRadius: circleRadius})
      // move everyone around
      Object.keys(players).forEach((playerId) => {
        let player = players[playerId]
        movePlayer(playerId)
      })
    }

    function drawGame() {
      // draw stuff
      drawEntities(allEntities())
      requestAnimationFrame(drawGame)
    }

    gameInterval = setInterval(gameLoop, 25)
    requestAnimationFrame(drawGame)

  });
