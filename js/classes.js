class WallTile extends PIXI.Graphics {
    constructor(row, col) {
        super();

        // alternately shade color EITHER even rows OR even colums (XOR operator)
        if ((row % 2 == 0 || col % 2 == 0) && !(row % 2 == 0 && col % 2 == 0)) {
            this.beginFill(colorGray - colorDarknessDifference);
        }
        else {
            this.beginFill(colorGray);
        }
        this.drawRoundedRect(padding, padding, gridSize - padding * 2, gridSize - padding * 2, cornerRadius);
        this.endFill();

        this.x = col * gridSize;
        this.y = row * gridSize;
    }
}

class GoalTile extends PIXI.Graphics {
    constructor(row, col) {
        super();

        // alternately shade color EITHER even rows OR even colums (XOR operator)
        if ((row % 2 == 0 || col % 2 == 0) && !(row % 2 == 0 && col % 2 == 0)) {
            this.lineStyle(lineThickness, colorGoal - colorDarknessDifference);
        }
        else {
            this.lineStyle(lineThickness, colorGoal);
        }
        this.drawRoundedRect(padding, padding, gridSize - padding * 2, gridSize - padding * 2, cornerRadius);

        this.x = col * gridSize;
        this.y = row * gridSize;
    }
}

class Box extends PIXI.Graphics {
    constructor(row, col) {
        super();

        this.zIndex = 2;

        this.setPos(row, col);
    }

    update() {
        // Check if on a goal
        this.onGoal = level.isLoaded && level.map[this.row][this.col] == ".";

        // Redraw box based on game state
        this.clear();
        if (this.onGoal) {
            if (level.isVictory) {
                this.beginFill(colorWon);
            }
            else {
                this.beginFill(colorGoal);
            }
        }
        else {
            this.beginFill(colorBox);
        }
        this.drawRoundedRect(largerPadding, largerPadding, gridSize - largerPadding * 2, gridSize - largerPadding * 2, cornerRadius);
        this.endFill();
    }

    setPos(row, col) {
        this.row = row;
        this.col = col;
        this.x = col * gridSize;
        this.y = row * gridSize;

        let wasOnGoal = this.onGoal;

        this.update();

        // If we went from being off a goal to being on a goal
        if (this.onGoal && !wasOnGoal) {
            // Play goal sound with random pitch
            soundGoal.rate(Math.random() * 0.5 + 0.75);
            soundGoal.play();
        }
    }

    isWallInPath(rows, cols) {
        return level.map[this.row + rows][this.col + cols] == "#";
    }

    getBoxInPath(rows, cols) {
        // Check every box in the level
        for (const box of level.boxList) {
            // Is there a box (that isn't us) where we're attempting to move?
            if (box.row == this.row + rows && box.col == this.col + cols && box != this) {
                return box;
            }
        }

        return null;
    }

    /// Moves the box the provided distance if unobstructed, returning true if success
    pushBox(rows, cols) {
        // If there's no wall or box in the way
        if (!this.isWallInPath(rows, cols) && !this.getBoxInPath(rows, cols)) {
            // Move
            this.setPos(this.row + rows, this.col + cols);

            return true;
        }

        return false;
    }


}

class Player extends PIXI.Graphics {
    constructor(row, col) {
        super();
        // this.lineStyle(lineThickness, colorPlayer);
        this.beginFill(colorPlayer);
        this.drawRoundedRect(largerPadding, largerPadding, gridSize - largerPadding * 2, gridSize - largerPadding * 2, cornerRadius);
        this.endFill();

        this.setPos(row, col);
    }

    setPos(row, col) {
        this.row = row;
        this.col = col;
        this.x = col * gridSize;
        this.y = row * gridSize;
    }

    /// Move the player the provided number of rows and columns, pushing any unobstructed boxes in the way
    move(rows, cols) {
        // If player won, don't move any more
        if (level.isVictory)
        {
            return;
        }

        // Check if player is going out-of-bounds
        if (!level.map[this.row + rows] || !level.map[this.row + rows][this.col + cols]) {
            console.log("Player attempted to go out of bounds!");
            return;
        }

        // If this is a wall, don't move
        if (level.map[this.row + rows][this.col + cols] == "#") {
            return;
        }

        // Check every box in the level
        for (const box of level.boxList) {
            // Is there a box where we're attempting to move?
            if (box.row == this.row + rows && box.col == this.col + cols) {
                // If the box was pushed successfully
                if (box.pushBox(rows, cols)) {
                    // Check to see if you won
                    level.checkVictory();

                    // Move into where it was pushed (break;)
                    break;
                }
                // Otherwise, the box was not pushed successfully
                else {
                    // Do not move (return;)
                    return;
                }
            }
        }

        // Move
        this.setPos(this.row + rows, this.col + cols);

        // Play sound with random pitch
        soundMove.rate(Math.random() * 0.5 + 0.75);
        soundMove.play();
    }
}

class Level {
    constructor() {
        this.boxList = [];
        this.isLoaded = false;
        this.isVictory = false;
        this.isValid = false;
    }

    /// Parses a run-length encoded standard Sokoban level string into a 2D map
    loadLevelFromString(levelString) {
        // Level is not loaded or valid
        this.isLoaded = false;

        // Level hasn't been won
        this.isVictory = false;

        // Level 2D array
        this.map = [];

        // Clear the level of all boxes
        this.boxList.forEach(b => gameScene.removeChild(b));
        this.boxList = [];

        // Standardize the string to use hyphens instead of spaces or underscores
        levelString = levelString.replaceAll(" ", "-");
        levelString = levelString.replaceAll("_", "-");
        // Also, use pipes (not newlines) to indicate new rows
        levelString = levelString.replaceAll("\n", "|");

        // Split the level into strings of each row
        let rows = levelString.split("|");

        // Number of rows is equal to the height of the level
        this.mapRowCount = rows.length;

        // Iterate through all rows, where j is the row index
        for (let j = 0; j < rows.length; j++) {
            // Each symbol counts once
            let runLength = 1;

            // Initialize empty array for this row
            let row = [];

            // Iterate through every index of this row, where i is the index of an item in the row
            for (let i = 0; i < rows[j].length; i++) {
                // Store the symbol at this index
                let symbol = rows[j][i];

                // If this symbol is a number, it indicates run-length encoding for the next symbol
                if (!isNaN(symbol)) {
                    // Record how many times to repeat the next symbol
                    runLength = parseInt(symbol);
                    // Skip this symbol and go to the next
                    continue;
                }
                // Otherwise, this is a normal symbol
                else {
                    // Repeat this symbol for as many times as it's encoded
                    for (let repeats = 0; repeats < runLength; repeats++) {

                        let rowIndex = j; // the current row number in the text file
                        let colIndex = row.length; // next available index in the row

                        let newBox;

                        switch (symbol) {
                            // Empty space
                            case "-":
                                // Put an empty space here in the level map
                                row.push("-");
                                break;

                            // Wall
                            case "#":
                                // Put a wall here in the level map
                                row.push("#");

                                // Add wall tile
                                gameScene.addChild(new WallTile(rowIndex, colIndex));
                                break;

                            // Player
                            case "@":
                                // Put an empty space here in the level map
                                row.push("-");

                                // Set player spawn location
                                this.playerSpawnRow = rowIndex;
                                this.playerSpawnCol = colIndex;
                                break;

                            // Player on Goal Square
                            case "+":
                                // Put a goal here in the level map
                                row.push(".");

                                // Add a goal tile
                                gameScene.addChild(new GoalTile(rowIndex, colIndex));

                                // Set player spawn location
                                this.playerSpawnRow = rowIndex;
                                this.playerSpawnCol = colIndex;
                                break;

                            // Box
                            case "$":
                                // Put an empty space here in the level map
                                row.push("-");

                                // Add a box to the box list
                                newBox = new Box(rowIndex, colIndex);
                                newBox.onGoal = false;
                                this.boxList.push(newBox);
                                gameScene.addChild(newBox);
                                break;

                            // Box on goal square
                            case "*":
                                // Put a goal here in the level map
                                row.push(".");

                                // Also add a goal tile
                                gameScene.addChild(new GoalTile(rowIndex, colIndex));

                                // Add a box to the box list
                                newBox = new Box(rowIndex, colIndex);
                                newBox.onGoal = true;
                                this.boxList.push(newBox);
                                gameScene.addChild(newBox);
                                break;

                            // Goal
                            case ".":
                                // Put a goal here in the level map
                                row.push(".");

                                // Add a goal tile
                                gameScene.addChild(new GoalTile(rowIndex, colIndex));
                                break;
                        }
                    }

                    // Reset the runlength
                    runLength = 1;
                }

            }

            // After the rowMap is filled, push it to the map
            this.map.push(row);
        }

        // Find the column count (tile width) of this level
        this.mapColCount = 0;
        this.map.forEach((row) => { if (row.length > this.mapColCount) this.mapColCount = row.length });

        // Mark level as loaded
        this.isLoaded = true;

        // Update all the boxes
        this.boxList.forEach((box) => { box.update(); });

        // Check if the level is invalid
        if (!this.map ||
            this.mapColCount <= 2 ||
            this.mapRowCount <= 2 ||
            !this.playerSpawnRow ||
            this.boxList.length == 0) {
            // Mark the level as invalid
            this.isValid = false;
        }
        else {
            this.isValid = true;
        }
    }

    checkVictory() {
        // Check every box in the level
        for (const box of this.boxList) {
            // If ANY box isn't on a goal, this isn't a victory
            if (!box.onGoal) {
                this.isVictory = false;

                // Update all the boxes
                this.boxList.forEach((box) => { box.update(); });
                return;
            }
        }

        // Otherwise, victory!
        this.isVictory = true;

        // Play victory sound
        soundVictory.rate(Math.random() * 0.3 + 0.85);
        soundVictory.play();

        // Update all the boxes
        this.boxList.forEach((box) => { box.update(); });
    }
}