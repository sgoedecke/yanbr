# Yet Another Battle Royale

This is a battle royale style game - like PUBATTLEGROUNDS and H1Z1 - built with websockets and HTML5 canvas. It uses [this project](https://github.com/sgoedecke/socket-io-game) as a rough template, but adds lot of features (multiple rounds, player health, a camera centered on the player, a shrinking "safe zone", collectable heals, a minimap, and so on).

It's still more of a tech demo than an actual production-ready game: the goal was to see how well the architecture of the project linked above holds up in a "real" game scenario.

Screenshot of victory:

<img src="./yanbr_victory.png" alt="screenshot" width="500px">

When a player dies or joins a round in progress, they become a ghost:

<img src="./yanbr_ghost.png" alt="screenshot" width="500px">

## Todo

[ ] Make the circle shrink at intervals, with a countdown

[ ] Add actual sprites for graphics

[ ] General optimization

[ ] Make actual collision physics rather than just faking it

[ ] Guard against DoS, make more production-ready in general


## Done

[X] Center the camera around the player, BR style

[X] Add more physics-y collisions so you can actually affect other players

[X] Make player collisions actually accurate physics (or good enough)

[X] Add entities that injure/kill/heal the player

[X] Add a death view (where the player becomes a killing entity)

[X] Add a death circle that slowly shrinks

[X] Handle all players dying by ending the game

[X] Make the graphics not _totally_ terrible (better colours, health bar, show alive players/hp)

[X] Make the map much larger

[X] Minimap

[X] When the game ends, add a countdown to start a new one

[X] Waiting list for ongoing games (death view)

