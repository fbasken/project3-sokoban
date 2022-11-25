"use strict";

// DOM
let appDiv;

// Scene vars
let app;
let stage;

let gameScene;
let background;

let targetZoomFactor = 1;
let currentZoomFactor = 0.000001;

// Game vars
let player;
let level;
let levelIndex = 0;
let levelStrings;

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
let colorGoal = 0x66ff85;
let colorWon = 0xFFD700;

let colorDarknessDifference = 0x131313;


let blurFilter = new PIXI.filters.BlurFilter();
let antiAliasingFilter = new PIXI.filters.FXAAFilter();


// ON LOAD
window.onload = (e) => {
    // Wait until level file has been parsed before loading the game
    readTextFile("levels.txt", (textContent) => {
        // Levels are separated by a comma (and return + newline)
        levelStrings = textContent.split(",\r\n");

        appDiv = document.querySelector("#app");

        app = new PIXI.Application({
            // width: 1000,
            // height: 600
            resizeTo: appDiv
        });
        appDiv.appendChild(app.view);

        app.loader.onComplete.add(setup);
        app.loader.load();
    });

};

function setup() {
    // Alias the stage
    stage = app.stage;

    // Create background graphics
    background = new PIXI.Graphics();
    background.beginFill(0xFFFFFF);
    background.drawRect(0, 0, 10000, 10000);
    // background.drawRect(0, 0, app.view.width, app.view.height);
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

    restartLevel();
    // // Load level
    // level = new Level();
    // level.parseLevelString(levelStrings[0]);

    // // Create player
    // player = new Player(level.playerSpawnRow, level.playerSpawnCol);
    // player.zIndex = 3;
    // gameScene.addChild(player);

    // window.addEventListener('resize', resizeGameWindow);
    // window.addEventListener('click', resizeGameWindow);

    keyState("w").press = move;
    keyState("s").press = move;
    keyState("a").press = move;
    keyState("d").press = move;
    keyState("r").press = restartLevel;
    keyState(".").press = nextLevel;
    keyState(",").press = prevLevel;

    // Ensure the game window matches the screen size
    app.ticker.add(resizeGameWindow);
}

function restartLevel() {
    // Remove all children from the gameScene
    removeAllChildren(gameScene);

    level = new Level();
    level.parseLevelString(levelStrings[levelIndex]);

    // Create player
    player = new Player(level.playerSpawnRow, level.playerSpawnCol);
    player.zIndex = 3;
    gameScene.addChild(player);
}

function nextLevel() {
    levelIndex++;
    levelIndex = Math.min(levelIndex, levelStrings.length - 1);
    restartLevel();
}
function prevLevel() {
    levelIndex--;
    levelIndex = Math.max(levelIndex, 0);
    restartLevel();
}

function checkVictory() {
    // Check every box in the level
    for (const box of level.boxList) {
        // If it's not on a goal, this isn't a victory
        if (!box.onGoal) {
            return false;
        }
    }

    return true;
}

/// Scales the level to fit the game window, and centers it
function resizeGameWindow() {

    // Compare the aspect ratio of the viewport versus the aspect ratio of the level
    if ((app.view.width / app.view.height) > (level.mapColCount / level.mapRowCount)) {
        // Find zoom factor to fit level to screen height
        targetZoomFactor = app.view.height / gridSize / level.mapRowCount;

        // Center horizontally
        gameScene.position.set((app.view.width - (level.mapColCount * gridSize * targetZoomFactor)) / 2, 0);

    }
    else {
        // Find zoom factor to fit level to screen width
        targetZoomFactor = app.view.width / gridSize / level.mapColCount;

        // Center vertically
        gameScene.position.set(0, (app.view.height - (level.mapRowCount * gridSize * targetZoomFactor)) / 2);
    }

    // If there's a substantial difference between the current zoom and the target
    if (Math.abs(targetZoomFactor - currentZoomFactor) > 0.0001) {
        // Correct it by only a bit
        currentZoomFactor += (targetZoomFactor - currentZoomFactor) * 0.1;
    }
    else {
        currentZoomFactor = targetZoomFactor;
    }

    // Scale
    gameScene.scale.set(currentZoomFactor);


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

/// Update all boxes
function updateAllBoxes() {
    level.boxList.forEach((box) => {
        box.update();
    });
}

/// Returns a key object which is bound to keyup/down event listeners
/// Code slightly modified from https://github.com/kittykatattack/learningPixi#keyboard
function keyState(value) {
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

function readTextFile(filePath, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", filePath);
    xhr.onload = () => {
        let content = xhr.responseText;
        // console.log(content);
        callback(content);
    }
    xhr.onerror = () => {
        console.log("Error while reading file: " + filePath);
        // return;
    }
    xhr.send();
}

/// Removes all child objects from this PixiJS Object
function removeAllChildren(pixiObj) {
    // Adapted from https://stackoverflow.com/a/55037616
    while (pixiObj.children[0]) {
        pixiObj.removeChild(pixiObj.children[0]);
    }
}

// From https://stackoverflow.com/a/8876069
// function getViewportWidth() {
//     return Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
// }
// function getViewportHeight() {
//     return Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
// }