let handpose;
let video;
let predictions = [];

let lines = []; // array of drawn lines (each line is an array)
let currentLine = [];
let eraseStart = 0; // counts frames since we entered the erase zone
let colors = [[255, 204, 0], [0], [255]];
let colorIdx = 0; // current color index
let colorOfLines = []; // color index of each line
let changeColorCounter = 0;

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);

  handpose = ml5.handpose(video, modelReady);

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
  // invert the webcam
  translate(video.width, 0);
  scale(-1, 1);

  // show the video
  image(video, 0, 0, width, height);

  // erase zone:
  noStroke();
  fill(246, 0, 0);
  rect(0, 0, 80, 80, 0, 0, 10, 0);
  fill(198, 49, 49);
  rect(80 - eraseStart/3*8, 0, eraseStart/3*8, 80, 0, 0, 10, 0);
  stroke(255);
  strokeWeight(3);
  line(30, 30, 50, 50);
  line(30, 50, 50, 30);

  // detect which fingers are up
  let gesture = findGesture();

  // detect index and major fingers up: change color gesture
  changeColorCounter++;
  if ((changeColorCounter > 10) && (!keyIsPressed) && (gesture[1] == 1 && gesture[2] == 1 && gesture[3] == 0 && gesture[4] == 0)) {
    colorIdx = (colorIdx + 1)%colors.length;
    changeColorCounter = 0;
  }

  // draw the color selection at the bottom
  noStroke();
  let x = width - 25;
  let y = height - 25
  for (let i = 0; i < colors.length; i++) {
    let d;
    if (i == colorIdx) {
      d = 30;
    } else {
      d = 15;
    }
    fill(colors[i]);
    circle(x, y, d);
    x -= 30;
  }

  let indexPoint = findIndex();

  // check if we want to erase
  if (gesture[1] == 1) {
    if (indexPoint[0] < 80 && indexPoint[1] < 80) {
      eraseStart++;
    } else {
      eraseStart = 0;
    }
    // erase!
    if (eraseStart > 30) {
      //console.log("erase");
      lines = [];
      currentLine = [];
    }
  }

  if (keyIsPressed && key == "d") {
    lines = [];
    currentLine = [];
  }

  // draw when index is up and space bar is pressed
  if (indexUp(gesture) && keyIsPressed && key == " ")  {
    // Call the findKeypoints function to push all keypoints into array
    currentLine.push(indexPoint);
  }
  
  // Draw our lines
  noFill();
  strokeWeight(4);
  
  for (i = 0; i < lines.length; i++) {
    let line = lines[i];
    stroke(colors[colorOfLines[i]]);
    beginShape();
    for (let p of line) {
      curveVertex(p[0], p[1]);
    }
    endShape();
  }
  stroke(colors[colorIdx]);
  beginShape();
  for (let p of currentLine) {
    curveVertex(p[0], p[1]);
  }
  endShape();
}

// A function to push keypoints into an array
function findIndex() {
  for (let i = 0; i < predictions.length; i += 1) {
    const prediction = predictions[i];
    noFill();
    stroke(0, 0, 255);
    circle(prediction.annotations.indexFinger[3][0], prediction.annotations.indexFinger[3][1], 5);
    return prediction.annotations.indexFinger[3];
  }
}

  // Function to detect gestures, i.e. which fingers are up
  function findGesture() {
    let out = [0, 0, 0, 0, 0];
    // 0: false, the finger is down
    // 1: true, the finger is up
    // order: [thumb, index, middle, ring, pinky]
    for (let i = 0; i < predictions.length; i += 1) {
      const prediction = predictions[i];
      let fingers = [prediction.annotations.thumb, prediction.annotations.indexFinger, prediction.annotations.middleFinger, prediction.annotations.ringFinger, prediction.annotations.pinky];
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

  function keyReleased() {
    if (key == " ") {
      lines.push(currentLine);
      colorOfLines.push(colorIdx);
      currentLine = [];
    }
  }