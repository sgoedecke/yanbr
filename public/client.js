  $(function () {
    var socket = io();
    var canvas = document.getElementById('game');
    var ctx = canvas.getContext('2d');
    // var players = {}; // this is magically defined in game.js

    var VIEW_SIZE = 2500 // the view size around the player. Same as the canvas size when downscaled 5x

    var localDirection // used to display accel direction

    socket.on('gameStateUpdate', updateGameState);

    function drawPlayers(players) {
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
      ctx.fillStyle = 'white';
      ctx.fillRect(relXY(worldBg).x/5, relXY(worldBg).y/5, VIEW_SIZE/5, VIEW_SIZE/5);


      Object.keys(players).forEach((playerId) => {
        let player = players[playerId]
        var direction

        ctx.fillStyle = player.colour;
        ctx.fillRect(relXY(player).x/5, relXY(player).y/5, playerSize/5, playerSize/5);

        if (playerId == socket.id) {
          direction = localDirection
        } else {
          direction = player.direction
        }
        // draw accel direction for current player based on local variable
        // the idea here is to give players instant feedback when they hit a key
        // to mask the server lag
        ctx.fillStyle = 'black';
        let accelWidth = 3
        switch(direction) {
          case 'up':
            ctx.fillRect(relXY(player).x/5, relXY(player).y/5 - accelWidth, playerSize/5, accelWidth);
            break
          case 'down':
            ctx.fillRect(relXY(player).x/5, relXY(player).y/5  + playerSize/5, playerSize/5, accelWidth);
            break
          case 'left':
            ctx.fillRect(relXY(player).x/5 - accelWidth, relXY(player).y/5, accelWidth, playerSize/5);
            break
          case 'right':
            ctx.fillRect(relXY(player).x/5 + playerSize/5, relXY(player).y/5, accelWidth, playerSize/5);
        }
      })
    }

    function updateGameState(gameState) {
      // update local state to match state on server
      players = gameState.players

      // draw stuff
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // set other info
      var playerCount = Object.keys(players).length
      document.getElementById('playerCount').innerHTML = String(playerCount) + " player" + (playerCount > 1 ? 's' : '') + " active"

      drawPlayers(players)
    }

    // key handling
    $('html').keydown(function(e) {
      if (e.key == "ArrowDown") {
        socket.emit('down', players);
        accelPlayer(socket.id, 0, 1)
        localDirection = 'down'
      } else if (e.key == "ArrowUp") {
        socket.emit('up', players);
        accelPlayer(socket.id, 0, -1)
        localDirection = 'up'
      } else if (e.key == "ArrowLeft") {
        socket.emit('left', players);
        accelPlayer(socket.id, -1, 0)
        localDirection = 'left'
      } else if (e.key == "ArrowRight") {
        socket.emit('right', players);
        accelPlayer(socket.id, 1, 0)
        localDirection = 'right'
      }
    })

    function gameLoop() {
      // update game
      updateGameState({players: players})
      // move everyone around
      Object.keys(players).forEach((playerId) => {
        let player = players[playerId]
        movePlayer(playerId)
      })
    }

    function drawGame() {
      // draw stuff
      drawPlayers(players)
      requestAnimationFrame(drawGame)
    }

    setInterval(gameLoop, 25)
    requestAnimationFrame(drawGame)

  });
