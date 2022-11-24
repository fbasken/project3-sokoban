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
        this.beginFill(colorBox);
        this.drawRoundedRect(largerPadding, largerPadding, gridSize - largerPadding * 2, gridSize - largerPadding * 2, cornerRadius);
        this.endFill();

        this.zIndex = 2;

        this.x = col * gridSize;
        this.y = row * gridSize;
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

    move(rows, cols) {
        if (level.map[this.row + rows][this.col + cols] == "#") {
            return;
        }
        this.row += rows;
        this.col += cols;
        this.setPos(this.row, this.col);
    }
}

class Level {
    constructor() {
    }

    /// Parses a run-length encoded standard Sokoban level string into a 2D map
    parseLevelString(levelString) {
        // Level 2D array
        this.map = [];

        boxList = [];

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

                        switch (symbol) {
                            // Empty space
                            case "-":
                                // Put an empty space here in the level map
                                row.push("-");
                                break;

                            // Wall
                            case "#":
                                // Add wall tile
                                gameScene.addChild(new WallTile(rowIndex, colIndex));

                                // Put a wall here in the level map
                                row.push("#");
                                break;

                            // Player
                            case "@":
                                // Set player spawn location
                                this.playerSpawnRow = rowIndex;
                                this.playerSpawnCol = colIndex;

                                // Put an empty space here in the level map
                                row.push("-");
                                break;

                            // Player on Goal Square
                            case "+":
                                // Set player spawn location
                                this.playerSpawnRow = rowIndex;
                                this.playerSpawnCol = colIndex;

                                // Also add a goal tile
                                gameScene.addChild(new GoalTile(rowIndex, colIndex));

                                // Put a goal here in the level
                                row.push(".");
                                break;

                            // Box
                            case "$":
                                // Add a box
                                gameScene.addChild(new Box(rowIndex, colIndex));

                                // Put an empty space here in the level map
                                row.push("-");
                                break;

                            // Box on goal square
                            case "*":
                                // Add a box
                                gameScene.addChild(new Box(rowIndex, colIndex));

                                // Also add a goal tile
                                gameScene.addChild(new GoalTile(rowIndex, colIndex));

                                // Put a goal here in the level map
                                row.push(".");
                                break;

                            // Goal
                            case ".":
                                // Add a goal tile
                                gameScene.addChild(new GoalTile(rowIndex, colIndex));

                                // Put a goal here in the level map
                                row.push(".");
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

        this.mapColCount = 0;
        this.map.forEach((e) => { if (e.length > this.mapColCount) this.mapColCount = e.length });
    }

}