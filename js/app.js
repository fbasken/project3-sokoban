"use strict";

// DOM
let appDiv;
let instructionsDiv;
let inputTextArea;
let inputTextAreaSubmit;

// Scene vars
let app;
let stage;

let gameScene;
let menuCard;
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

// Filters
let blurFilter = new PIXI.filters.BlurFilter();
let antiAliasingFilter = new PIXI.filters.FXAAFilter();
let crtFilter = new PIXI.filters.CRTFilter(PIXI.filters.CRTFilter.defaults);

// Audio
let soundGoal, soundMove, soundVictory, soundRestart, soundChange;
// ON LOAD
window.onload = (e) => {
    // Wait until level file has been parsed before loading the game
    readTextFile("levels.txt", (textContent) => {
        // Levels are separated by a comma (and return + newline)
        levelStrings = textContent.split(",\r\n");

        // Get app div
        appDiv = document.querySelector("#app");

        // Get instructions div
        instructionsDiv = document.querySelector("#instructions");

        // Get input text area form elements
        inputTextArea = document.querySelector("#level-entry textarea");
        inputTextAreaSubmit = document.querySelector("#level-entry button");

        // Create app and append to the page
        app = new PIXI.Application({
            // width: 1000,
            // height: 600
            resizeTo: appDiv
        });
        appDiv.appendChild(app.view);

        // When loaded, start the game
        app.loader.onComplete.add(setup);
        app.loader.load();
    });

};

function setup() {
    // Load Sounds
    soundMove = new Howl({
        src: ['audio/move.mp3']
    });

    soundGoal = new Howl({
        src: ['audio/goal.mp3']
    });

    soundVictory = new Howl({
        src: ['audio/victory.mp3']
    });

    soundRestart = new Howl({
        src: ['audio/restart.mp3']
    });

    soundChange = new Howl({
        src: ['audio/change.mp3']
    });

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

    // Create menu card
    menuCard = new PIXI.Container();
    stage.addChild(menuCard);

    // Load first level
    restartLevel();

    // Initialize input functionality
    document.addEventListener('keydown', processKeyInputs);
    // keyState("w").press = move;
    // keyState("s").press = move;
    // keyState("a").press = move;
    // keyState("d").press = move;
    keyState("r").press = () => {
        // Play sound with random pitch
        soundRestart.rate(Math.random() * 0.5 + 0.75);
        soundRestart.play();

        restartLevel();
    };
    keyState(".").press = () => {
        // Next level
        loadLevel(levelIndex + 1)
    };
    keyState(",").press = () => {
        // Prev level
        loadLevel(levelIndex - 1)
    };

    // Every frame, resize the game window
    app.ticker.add(resizeGameWindow);

    // Check whenever a key is pressed in the input field
    inputTextArea.addEventListener("keyup", (event) => {
        // If there's non-whitespace entered
        if (inputTextArea.value.trim()) {
            // Enable the submit button
            inputTextAreaSubmit.disabled = false;
            inputTextAreaSubmit.classList.add("is-success");
        }
        else {
            // Disable submit button
            inputTextAreaSubmit.disabled = true;
            inputTextAreaSubmit.classList.remove("is-success");
        }

        // Resize input area to fit text
        inputTextArea.style.height = "1px";
        inputTextArea.style.height = (8 + inputTextArea.scrollHeight) + "px";
    });

    // If the submit box is clicked, load the level
    inputTextAreaSubmit.addEventListener("click", (event) => {
        // Record the current level index
        let currentLevelIndex = levelIndex;

        // Read in the input and add it to the level list
        levelStrings.push(inputTextArea.value.trim());
        // Load it (it's the last level)
        loadLevel(levelStrings.length - 1);

        // If the level that was loaded was invalid
        if (!level.isValid) {
            // Remove this level and load the current one
            levelStrings.pop();
            loadLevel(currentLevelIndex);
        }

        // Clear out the textarea
        inputTextArea.value = "";
        // Set it back to normal size
        inputTextArea.removeAttribute("style");

        // Disable submit button
        inputTextAreaSubmit.disabled = true;
        inputTextAreaSubmit.classList.remove("is-success");
    });
}

/// Reloads the current level
function restartLevel() {
    // Remove all children from the gameScene
    removeAllChildren(gameScene);

    // Reload the level
    level = new Level();
    level.loadLevelFromString(levelStrings[levelIndex]);

    // Create player
    player = new Player(level.playerSpawnRow, level.playerSpawnCol);
    player.zIndex = 3;
    gameScene.addChild(player);
}

/// Load the level at the specified index
function loadLevel(index) {
    // Ensure index is a valid index
    index = Math.max(index, 0);
    index = Math.min(index, levelStrings.length - 1);

    // If changing levels, play a sound
    if (index > levelIndex) {
        soundChange.rate(1.1);
        soundChange.play();
    }
    else if (index < levelIndex) {
        soundChange.rate(0.9);
        soundChange.play();
    }
    else {
        return;
    }

    // Set the current level
    levelIndex = index;

    // Restart the level
    restartLevel();
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

function processKeyInputs(key) {
    // W or Up arrow
    if (key.keyCode === 87 || key.keyCode === 38) {
        player.move(-1, 0);
    }

    // S or Down arrow
    if (key.keyCode === 83 || key.keyCode === 40) {
        player.move(1, 0);
    }

    // A or Left arrow
    if (key.keyCode === 65 || key.keyCode === 37) {
        player.move(0, -1);
    }

    // D or Right arrow
    if (key.keyCode === 68 || key.keyCode === 39) {
        player.move(0, 1);
    }

    // Check if the user hasn't hidden the instructions dialog -- if they haven't, hide it
    if (appDiv.className == "show-hints") {
        appDiv.classList.remove("show-hints");
    }

    // // R
    // if (key.keyCode === 82) {
    //     // Play sound with random pitch
    //     soundRestart.rate(Math.random() * 0.5 + 0.75);
    //     soundRestart.play();

    //     restartLevel();
    // }

    // Old logic
    // switch (key) {
    //     // Up
    //     case "w":
    //         player.move(-1, 0);

    //         break;
    //     // Down
    //     case "s":
    //         player.move(1, 0);

    //         break;
    //     // Left
    //     case "a":
    //         player.move(0, -1);

    //         break;
    //     // Right
    //     case "d":
    //         player.move(0, 1);

    //         break;
    // }
}