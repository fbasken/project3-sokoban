"use strict";

// DOM
let appDiv;

// Scene vars
let app;
let stage;

let gameScene;

// Game vars
let player;
let level;
let boxList;

// Drawing vars
let gridSize = 80;

let cornerRadius = gridSize / 8;
let padding = gridSize / 32;
let largerPadding = padding * 3;
let lineThickness = 5;

let colorGray = 0xCCCCCC;
// let colorLightGray = 0xDFDFDF;
let colorBox = 0xa3f4ff;
let colorPlayer = 0xffa3f4;
let colorGoal = colorPlayer;//0x66ff85;

let colorDarknessDifference = 0x131313;


let blurFilter = new PIXI.filters.BlurFilter();
let antiAliasingFilter = new PIXI.filters.FXAAFilter();

window.onload = (e) => {
    appDiv = document.querySelector("#app");

    app = new PIXI.Application({
        // width: 1000,
        // height: 600
        resizeTo: appDiv
    });
    appDiv.appendChild(app.view);

    app.loader.onComplete.add(setup);
    app.loader.load();
};

function setup() {
    // Alias the stage
    stage = app.stage;

    // Create background graphics
    let background = new PIXI.Graphics();
    background.beginFill(0xFFFFFF);
    background.drawRect(0, 0, app.view.width, app.view.height);
    background.endFill();

    stage.addChild(background);

    // Create game container
    gameScene = new PIXI.Container();
    stage.addChild(gameScene);
    gameScene.sortableChildren = true;

    // Add filters to game scene
    stage.filters = [blurFilter, antiAliasingFilter];

    blurFilter.blur = 0;
    antiAliasingFilter.resolution = 1;

    // Load level
    level = new Level();
    level.parseLevelString(levelStrings[0]);
    console.log(level.map);

    // Create player
    player = new Player(level.playerSpawnRow, level.playerSpawnCol);
    player.zIndex = 3;
    gameScene.addChild(player);

    // window.addEventListener('resize', resizeGameWindow);
    // window.addEventListener('click', resizeGameWindow);

    keyboard("w").press = move;
    keyboard("s").press = move;
    keyboard("a").press = move;
    keyboard("d").press = move;

    app.ticker.add(gameLoop);

    // Ensure the game window matches the screen size
    app.ticker.add(resizeGameWindow);
}

function resizeGameWindow() {
    // console.log("Attempting resize");

    if ((app.view.width / app.view.height) > (level.mapColCount / level.mapRowCount)) {
        // Zoom to fit level to screen height
        gameScene.scale.set(app.view.height / gridSize / level.mapRowCount);
    }
    else {
        // Zoom to fit level to screen width
        gameScene.scale.set(app.view.width / gridSize / level.mapColCount);

    }
}

function move(key) {
    switch (key) {
        // Up
        case "w":
            player.move(-1, 0);

            break;
        // Down
        case "s":
            player.move(1, 0);

            break;
        // Left
        case "a":
            player.move(0, -1);

            break;
        // Right
        case "d":
            player.move(0, 1);

            break;
    }
}

function gameLoop() {
}

function getGrid() {

}

/// Returns a key object which is bound to keyup/down event listeners
/// Code slightly modified from https://github.com/kittykatattack/learningPixi#keyboard
function keyboard(value) {
    const key = {};
    key.value = value;
    key.isDown = false;

    key.press = undefined;
    key.release = undefined;

    key.downHandler = (event) => {
        if (event.key === key.value) {
            if (!key.isDown && key.press) {
                key.press(key.value);
            }
            key.isDown = true;
            event.preventDefault();
        }
    };

    //The `upHandler`
    key.upHandler = (event) => {
        if (event.key === key.value) {
            if (key.isDown && key.release) {
                key.release(key.value);
            }
            key.isDown = false;
            event.preventDefault();
        }
    };

    //Attach event listeners
    const downListener = key.downHandler.bind(key);
    const upListener = key.upHandler.bind(key);

    window.addEventListener("keydown", downListener, false);
    window.addEventListener("keyup", upListener, false);

    return key;
}

// From https://stackoverflow.com/a/8876069
function getViewportWidth() {
    return Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
}
function getViewportHeight() {
    return Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
}

const levelStrings = [
`    ####
 ####  ##
 #  # *###
##.$#  * ##
#   @ * * #
#   #  *  #
##### * * #
    ## * ##
    ##   #
     ##  #
      ####`,
    `6#|#@$.-#|6#`
];

