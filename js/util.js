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
            // event.preventDefault(); // Commented out to allow typing
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

/// Asynchronously reads a text file and calls the callback function on completion
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