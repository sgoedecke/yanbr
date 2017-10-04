  $(function () {
    var socket = io();
    var canvas = document.getElementById('game');
    var ctx = canvas.getContext('2d');
    // var players = {}; // this is magically defined in game.js

    var VIEW_SIZE = 2500 // the view size around the player. Same as the canvas size when downscaled 5x

    var localDirection // used to display accel direction
    var tick = 0
    socket.on('gameStateUpdate', updateGameState);

    function drawEntities() {
      entities = allEntities()
      // NB the game world is 500x500, but we're downscaling 5x to smooth accel out

      // draw the current player dead centre
      // then draw other players

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
      ctx.fillStyle = 'black';
      ctx.fillRect(relXY(worldBg).x/5, relXY(worldBg).y/5, VIEW_SIZE/5, VIEW_SIZE/5);

      // draw circle
      if (circleRadius > 0) {
        const worldCenter = { x: gameSize/2, y: gameSize/2 }
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(relXY(worldCenter).x/5, relXY(worldCenter).y/5, circleRadius/5, 0, 2*Math.PI);
        ctx.fill();
      }

      // draw area outside world background again to letterbox circle
      ctx.fillStyle = 'grey';
      ctx.fillRect(0, 0, relXY(worldBg).x/5, VIEW_SIZE/5); // left
      ctx.fillRect(0, 0, VIEW_SIZE/5, relXY(worldBg).y/5); // top
      ctx.fillRect((relXY(worldBg).x + VIEW_SIZE)/5, 0, -relXY(worldBg).x/5, VIEW_SIZE/5); // right
      ctx.fillRect(0, (relXY(worldBg).y + VIEW_SIZE)/5, VIEW_SIZE/5, -relXY(worldBg).y/5,); // bottom



      allEntities().forEach((entity) => {
        var direction

        ctx.fillStyle = entity.colour;
        ctx.fillRect(relXY(entity).x/5, relXY(entity).y/5, playerSize/5, playerSize/5);

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
        ctx.fillStyle = 'black';
        let accelWidth = 3
        switch(direction) {
          case false:
            break
          case 'up':
            ctx.fillRect(relXY(entity).x/5, relXY(entity).y/5 - accelWidth, playerSize/5, accelWidth);
            break
          case 'down':
            ctx.fillRect(relXY(entity).x/5, relXY(entity).y/5  + playerSize/5, playerSize/5, accelWidth);
            break
          case 'left':
            ctx.fillRect(relXY(entity).x/5 - accelWidth, relXY(entity).y/5, accelWidth, playerSize/5);
            break
          case 'right':
            ctx.fillRect(relXY(entity).x/5 + playerSize/5, relXY(entity).y/5, accelWidth, playerSize/5);
        }
      })
    }

    function updateGameState(gameState) {
      // update local state to match state on server
      players = gameState.players
      healEntities = gameState.healEntities
      harmEntities = gameState.harmEntities

      console.log("FROM SERVER", players[socket.id].hp)

      // draw stuff
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // set other info
      var playerCount = Object.keys(players).length
      document.getElementById('playerCount').innerHTML = String(playerCount) + " player" + (playerCount > 1 ? 's' : '') + " active"
      document.getElementById('hp').innerHTML = "You have " + String(players[socket.id].hp) + " health"

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

    setInterval(gameLoop, 25)
    requestAnimationFrame(drawGame)

  });
