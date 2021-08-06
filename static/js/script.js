// init context
const k = kaboom({
  global: true, // import all kaboom functions to global namespace
  scale: 2, // pixel size (for pixelated games you might want smaller size with scale)
  clearColor: [1, 0, 1, 1], // background color (default is a checker board background)
  fullscreen: false, // if fullscreen
  crisp: true, // if pixel crisp (for sharp pixelated games)
  debug: true, // debug mode
});

const gameCanvas = document.getElementsByTagName('canvas')[0]

// define SFX
loadSound("gameover_sound", "static/sounds/annoying_game_over_biploop.wav")
loadSound("comedy_jump", "static/sounds/comedy_jump_bip_2loop.wav")
loadSound("counting", "static/sounds/counting_bliploop.wav")
loadSound("death_scream", "static/sounds/death_scream_biploop.wav")
loadSound("jump", "static/sounds/jump_biploop.wav")
loadSound("jumpy", "static/sounds/jumpy_biploop.wav")
loadSound("negative_hit1", "static/sounds/negative_hit_bip_1loop.wav")
loadSound("negative_hit2", "static/sounds/negative_hit_biploop.wav")

// music loops
loadSound("menu", "static/sounds/MENU_LOOP.mp3")
loadSound("creepy_menu", "static/sounds/CREEPY_AMBIENT_REVERSE_LOOP.mp3")
loadSound("game_loop", "static/sounds/REGULAR_GAMELOOP.mp3")

const music = play("game_loop");
const menu_music = play("creepy_menu");

// define 'lionel' sprite
loadSprite("lionel", "static/sprites/lionel.png");

// define map sprites (Mario)
loadSprite("block", "static/sprites/block.png")
loadSprite("brick", "static/sprites/brick.png")
loadSprite("coin", "static/sprites/coin.png")
loadSprite("question", "static/sprites/question.png")
loadSprite("unboxed", "static/sprites/unboxed.png")
loadSprite("pipe-left", "static/sprites/pipe-left.png")
loadSprite("pipe-right", "static/sprites/pipe-right.png")
loadSprite("pipe-top-left-side", "static/sprites/pipe-top-left-side.png")
loadSprite("pipe-top-right-side", "static/sprites/pipe-top-right-side.png")
loadSprite("evil-shroom-1", "static/sprites/evil-shroom-1.png")
loadSprite("mushroom", "static/sprites/mushroom.png")
loadSprite("background-pink", "static/sprites/bg5.png")
loadSprite("background-blue", "static/sprites/bg5b.jpg")
loadSprite("background-red", "static/sprites/bg5c.jpg")
loadSprite("background-green", "static/sprites/bg5d.jpg")

scene("game", () => {

  menu_music.stop()

  const MOVE_SPEED = 120
  const JUMP_FORCE = 360
  const BIG_JUMP_FORCE = 550
  let CURRENT_JUMP_FORCE = JUMP_FORCE
  const ENEMY_SPEED = 20
  const FALL_DEATH = 600
  const layerColours = ["pink", "blue", "red", "green"]
  let colourCounter = 0;

  let isJumping = true

  layers(['bg', 'obj', 'ui'], 'obj')

  camIgnore(["bg", "ui"])

  add([
    layer("bg"),
    sprite("background-pink", {
      width: width(),
      height: height(),
    })
  ])

  // define map (can make a longer array of these later)
  map = [
    '                                                       ',
    '                                                       ',
    '                                                       ',
    '                                                       ',
    '                                                       ',
    '    %   =*=%=                               -+         ',
    '                                            ()         ',
    '                      -+          -+       xxx      -+ ',
    '             ^   ^    ()          ()                () ',
    'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  xxxxxxxx  xxxxxxxx',
  ]

  // define map level config - can make several of these for each level design
  const levelCfg = {
    width: 20,
    height: 20,
    '=': [sprite('block'), solid()],
    'x': [sprite('brick'), solid()],
    '$': [sprite('coin'), 'coin'],
    '%': [sprite('question'), 'coin-surprise', solid()],
    '*': [sprite('question'), 'mushroom-surprise', solid()],
    '}': [sprite('unboxed'), solid()],
    '(': [sprite('pipe-left'), scale(0.5), solid()],
    ')': [sprite('pipe-right'), scale(0.5), solid()],
    '-': [sprite('pipe-top-left-side'), scale(0.5), solid()],
    '+': [sprite('pipe-top-right-side'), scale(0.5), solid(), 'pipe'],
    'r': [sprite('pipe-top-right-side'), scale(0.5), solid()],
    '^': [sprite('evil-shroom-1'), solid(), 'dangerous'],
    '#': [sprite('mushroom'), 'mushroom', body()],
  }

  // creates game level
  const gameLevel = addLevel(map, levelCfg)

  // function that checks if a player is 'big' or not
  function big() {
    // default timer and big status
    let timer = 0
    let isBig = false
    return {
      update() {
        if (isBig) {
          timer -= dt()
          if (timer <= 0) {
            this.smallify()
          }
        }
      },
      isBig() {
        return isBig
      },
      // makes lionel small once the timer has elapsed
      smallify() {
        play("jump")
        this.scale = vec2(1)
        timer = 0
        isBig = false
        CURRENT_JUMP_FORCE = JUMP_FORCE
      },
      // makes lionel big when eating 'mushroom'
      biggify(time) {
        play("comedy_jump")
        this.scale = vec2(2)
        timer = time
        isBig = true
        CURRENT_JUMP_FORCE = BIG_JUMP_FORCE
      }
    }
  }

  // add lionel sprite
  const lionel = add([
    sprite("lionel"),
    pos(30, 0),
    body(),
    big(),
    origin('bot'),
  ]);

  // defines lionel sprites behaviour - is tracked by camera and falldeath action
  lionel.action(() => {
    camPos(lionel.pos)
    if (lionel.pos.y >= FALL_DEATH) {
      console.log("You Lose")
      lionel.destroy()
      play("death_scream")
      go("gameover")
    }
  });

  // lionel left movement
  keyDown('left', () => {
    lionel.move(-120, 0)
  });

  // lionel right movement
  keyDown('right', () => {
    lionel.move(120, 0)
  });

  // lionel jump (could use spacebar as well maybe?)
  keyPress('up', () => {
    if (lionel.grounded()) {
      isJumping = true
      lionel.jump(CURRENT_JUMP_FORCE)
      play("jumpy")
    }
  });

  // action when lionel collides with 'coin-surprise' sprite
  lionel.collides('coin-surprise', (obj) => {
    play("negative_hit1")
    gameLevel.spawn('$', obj.gridPos.sub(0, 1))
    destroy(obj)
    gameLevel.spawn('}', obj.gridPos.sub(0, 0))
  });

  // action when lionel collides with 'mushroom-surprise' sprite
  lionel.collides('mushroom-surprise', (obj) => {
    play("negative_hit2")
    gameLevel.spawn('#', obj.gridPos.sub(0, 1))
    destroy(obj)
    gameLevel.spawn('}', obj.gridPos.sub(0, 0))
  });

  // action when mushroom is activated
  action('mushroom', (m) => {
    m.move(20, 0)
  });

  // action when lionel collides with mushroom sprite
  lionel.collides('mushroom', (m) => {
    lionel.biggify(6)
    destroy(m)
  });

  // action when lionel collides with coin sprite
  lionel.collides('coin', (c) => {
    play("death_scream")
    destroy(c)
  });

  // sets basic viewing angle
  let angle = 0;
  document.querySelector('canvas').style.setProperty("transform", `rotate(${angle}deg)`)

  // action when lionel jumps on pipe
  lionel.collides('pipe', (p) => {
    console.log(angle)
    angle += 90;
    destroy(p)
    gameLevel.spawn('r', p.gridPos.sub(0, 0))
    play("comedy_jump")
    // spins canvas
    document.querySelector('canvas').style.setProperty("transform", `rotate(${angle}deg)`)

    // updates background colour
    colourCounter = (colourCounter + 1) % layerColours.length;
    add([
      layer("bg"),
      sprite(`background-${layerColours[colourCounter]}`, {
        width: width(),
        height: height(),
      })
    ])
  });
});

// defines gameover screen
scene("gameover", () => {

  music.stop()
  play("gameover_sound")

  // gameover screen text
  add([
    text("Game Over", 16),
    pos(width() / 2, 120),
    origin("center"),
  ]);

  add([
    text("You are an idiot", 32),
    pos(width() / 2, 220),
    origin("center"),
  ]);

  add([
    text("Press space to go again", 16),
    pos(width() / 2, 320),
    origin("center"),
  ]);

  // press space to restart game
  keyPress("space", () => {
    go("game");
    music.play()
  });

});

// defines starting screen
scene("start", () => {

  music.stop()

  // starting screen text
  add([
    text("Welcome to Lionoil", 20),
    pos(width() / 2, 120),
    origin("center"),
  ]);

  // starting screen text 2
  add([
    text("Press the space key to begin", 16),
    pos(width() / 2, 180),
    origin("center"),
  ]);

  // press space to start
  keyPress("space", () => {
    go("game");
    music.play()
  });

})

// default action on page load - start screen
go("start")