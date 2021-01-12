let handpose;
let video;
let predictions = [];

let sizeFactor;
let lines = []; // array of drawn lines (each line is an array)
let currentLine = []; // array of currently drawn line

let eraseStart = 0; // counts frames since we entered the erase zone
let colors = [[255, 204, 0], [0], [255]]; // possible drawing colors
let colorIdx = 0; // current color index
let colorOfLines = []; // color index of each line
let changeColorCounter = 0; // counts how many frames since the last color change
let stayColorCounter = 0; // counts how many frames since we didn't try to change color

let strokeSizes = [2, 4, 8]; // possible drawing colors
let sizeIdx = 0; // current color index
let sizeOfLines = []; // color index of each line
let changeSizeCounter = 0; // counts how many frames since the last color change
let staySizeCounter = 0; // counts how many frames since we didn't try to change color

const ERASE_TIME = 30; // how much frames on the erase button are needed to erase
const CHANGE_COLOR_TIME = 20; // how much frames with the "peace" gesture are needed to change color
const CHANGE_SIZE_TIME = 20; // how much frames with the "peace" gesture are needed to change color

function setup() {
  let h = windowHeight - 60 - 121;
  sizeFactor = h/480;
  createCanvas(640*sizeFactor, h);
  video = createCapture(VIDEO);
  video.size(width, height);

  const options = {
    flipHorizontal: false, // boolean value for if the video should be flipped, defaults to false
    maxContinuousChecks: Infinity, // How many frames to go without running the bounding box detector. Defaults to infinity, but try a lower value if the detector is consistently producing bad predictions.
    detectionConfidence: 0.75, // Threshold for discarding a prediction. Defaults to 0.8.
    scoreThreshold: 0.75, // A threshold for removing multiple (likely duplicate) detections based on a "non-maximum suppression" algorithm. Defaults to 0.75
    iouThreshold: 0.3, // A float representing the threshold for deciding whether boxes overlap too much in non-maximum suppression. Must be between [0, 1]. Defaults to 0.3.
  }
  handpose = ml5.handpose(video, options, modelReady);

  // This sets up an event that fills the global variable "predictions"
  // with an array every time new hand poses are detected
  handpose.on("predict", results => {
    predictions = results;
  });

  // Hide the video element, and just show the canvas
  video.hide();
}

function modelReady() {
  console.log("Model ready!");
}

function draw() {
  // ********** GENERAL STUFF **********
  // invert the webcam
  translate(video.width, 0);
  scale(-1, 1);

  // show the video
  image(video, 0, 0, width, height);

  // Draw the lines
  noFill();
  for (i = 0; i < lines.length; i++) {
    strokeWeight(strokeSizes[sizeOfLines[i]]);
    stroke(colors[colorOfLines[i]]);
    drawLine(lines[i]);
  }
  strokeWeight(strokeSizes[sizeIdx]);
  stroke(colors[colorIdx]);
  drawLine(currentLine);

  // detect which fingers are up
  let gesture = findGesture();
  const indexPoint = findIndex();
  if (!indexPoint) { // index was, in fact, not found
    gesture[1] = 0;
  }
  // ********************


  // ********** ABOUT ERASING **********
  const eraseButtonSize = 80;
  // draw erase button on screen
  noStroke();
  fill(246, 0, 0);
  rect(0, 0, eraseButtonSize, eraseButtonSize, 0, 0, 10, 0);
  fill(198, 49, 49);
  let prog = eraseButtonSize/ERASE_TIME;
  rect(eraseButtonSize - eraseStart*prog, 0, eraseStart*prog, eraseButtonSize, 0, 0, 10, 0);
  stroke(255);
  strokeWeight(3);
  line(30, 30, 50, 50);
  line(30, 50, 50, 30);

  // check if we want to erase
  if (indexUp(gesture)) {
    if (indexPoint[0] < 80 && indexPoint[1] < 80) {
      eraseStart++;
    } else {
      eraseStart = 0;
    }
    // erase!
    if (eraseStart > ERASE_TIME) {
      lines = [];
      currentLine = [];
      colorOfLines = [];
      sizeOfLines = [];
    }
  }

  // erasing with the "d" key
  if (keyIsPressed && key == "d") {
    lines = [];
    currentLine = [];
    colorOfLines = [];
    sizeOfLines = [];
    noStroke();
    fill(198, 49, 49);
    rect(0, 0, eraseButtonSize, eraseButtonSize, 0, 0, 10, 0);
    stroke(255);
    strokeWeight(3);
    line(30, 30, 50, 50);
    line(30, 50, 50, 30);
  }
  // ********************


  // ********** ABOUT COLORS **********
  const colorBubbleSize = 30;
  // draw the color selection at the bottom
  noStroke();
  let x = width - 25;
  let y = height - 25
  for (let i = 0; i < colors.length; i++) {
    let d;
    if (i == colorIdx) {
      d = colorBubbleSize;
    } else {
      d = colorBubbleSize/2;
    }
    fill(colors[i]);
    circle(x, y, d);
    x -= colorBubbleSize;
  }
  // loading next color
  if (changeColorCounter > 0) {
    stroke(0, 0, 255);
    strokeWeight(2);
    noFill();
    x = width - 25 - colorBubbleSize*((colorIdx+1)%colors.length);
    let prog = (changeColorCounter-stayColorCounter)/CHANGE_COLOR_TIME;
    arc(x, y, colorBubbleSize/2, colorBubbleSize/2, PI/2, PI/2+TWO_PI*prog);
  }

  // detect index and major fingers up: change color gesture
  if (peaceSymbolUp(gesture) && (eraseStart < 10)) {
    changeColorCounter++;
  } else {
    stayColorCounter++;
  }

  if ((changeColorCounter > CHANGE_COLOR_TIME) && (!keyIsPressed)) {
    colorIdx = (colorIdx + 1)%colors.length;
    changeColorCounter = 0;
  }
  if (stayColorCounter > changeColorCounter) {
    changeColorCounter = 0;
    stayColorCounter = 0;
  }
  // ********************


  // ********** ABOUT STROKE SIZE **********
  // detect index and pinkie fingers up: change stroke size
  if (rockGestureUp(gesture) && (eraseStart < 10)) {
    changeSizeCounter++;
  } else {
    staySizeCounter++;
  }

  if ((changeSizeCounter > CHANGE_SIZE_TIME) && (!keyIsPressed)) {
    sizeIdx = (sizeIdx + 1)%strokeSizes.length;
    changeSizeCounter = 0;
  }
  if (staySizeCounter > changeSizeCounter) {
    changeSizeCounter = 0;
    staySizeCounter = 0;
  }
  // ********************


  // ********** ABOUT DRAWING **********
  // draw when index is up and space bar is pressed
  if (indexUp(gesture) && keyIsPressed && key == " ")  {
    // Call the findKeypoints function to push all keypoints into array
    currentLine.push(indexPoint);
  }
  // ********************
}


// Function to find the index fingertip, draw it and return it (None otherwise)
function findIndex() {
  for (let i = 0; i < predictions.length; i += 1) {
    const prediction = predictions[i];
    const tip = prediction.annotations.indexFinger[3];
    const base = prediction.annotations.indexFinger[0];
    if (dist(tip[0], tip[1], base[0], base[1]) < height/10) {
      break;
    }
    noStroke();
    fill(0, 0, 255);
    circle(tip[0]*sizeFactor, tip[1]*sizeFactor, strokeSizes[sizeIdx]*2+1);
    return [tip[0]*sizeFactor, tip[1]*sizeFactor];
  }
  return null;
}


// Function to detect gestures, i.e. which fingers are up
function findGesture() {
  let out = [0, 0, 0, 0, 0];
  // 0: false, the finger is down
  // 1: true, the finger is up
  // order: [thumb, index, middle, ring, pinky]
  for (let i = 0; i < predictions.length; i += 1) {
    const prediction = predictions[i];
    let fingers = [
      prediction.annotations.thumb,
      prediction.annotations.indexFinger,
      prediction.annotations.middleFinger,
      prediction.annotations.ringFinger,
      prediction.annotations.pinky
    ];
    //console.log(fingers);
    for (let i = 0; i < 5; i++) {
      let finger = fingers[i];
      if (finger[3][1] < finger[2][1] && finger[2][1] < finger[1][1] && finger[1][1] < finger[0][1]) {
        // the finger is up
        out[i] = 1;
      }
    }
  }
  return out;
}


// Returns true if the index is up (ignores the other fingers)
function indexUp(gesture) {
  return (gesture[1] == 1);
}


// Returns true if the index and middle fingers are up
// (ignores the thumb)
function peaceSymbolUp(gesture) {
  return (gesture[1] == 1 && gesture[2] == 1 && gesture[3] == 0 && gesture[4] == 0);
}


// Returns true if the index and pinkie fingers are up
// (ignores the thumb)
function rockGestureUp(gesture) {
  return (gesture[1] == 1 && gesture[2] == 0 && gesture[3] == 0 && gesture[4] == 1);
}


// Draws a line as a Catmull-Rom curve
function drawLine(line) {
  beginShape();
  for (let p of line) {
    if (p) {
      curveVertex(p[0], p[1]);
    }
  }
  endShape();
}


function keyReleased() {
  if (key == " ") { // stop drawing
    let cleanLine = [currentLine[0]];
    for (let i = 0; i < currentLine.length; i += 3) {
      cleanLine.push(currentLine[i]);
    }
    cleanLine.push(currentLine[currentLine.length-1]);
    lines.push(cleanLine);
    colorOfLines.push(colorIdx);
    sizeOfLines.push(sizeIdx);
    currentLine = [];
  }
}
