let handpose;
let video;
let predictions = [];

let points = []; // array of drawn points
let eraseStart = 0; // counts frames since we entered the erase zone

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
  fill(255, 0, 0);
  rect(0, 0, 80, 80);

  // detect which fingers are up
  let gesture = findGesture();

  // check if we want to erase
  if (gesture[1] == 1) {
    let indexPoint;
    for (let i = 0; i < predictions.length; i += 1) {
      const prediction = predictions[i];
      indexPoint = prediction.annotations.indexFinger[3];
    }
    if (indexPoint[0] < 80 && indexPoint[1] < 80) {
      eraseStart++;
    } else {
      eraseStart = 0;
    }
    // erase!
    if (eraseStart > 30) {
      //console.log("erase");
      points = [];
    }
  }

  //console.log(gesture);
  if (onlyIndexUp(gesture)) {
    // Call the findKeypoints function to push all keypoints into array
    findKeypoints();
  }
  
  // Draw our line
  noFill();
  stroke(255, 204, 0);
  strokeWeight(4);
  beginShape();
  // Draw lines between keypoints within the array
  for (let i = 0; i < points.length; i+=1){

      /* CODE TO DRAW ELLIPSES
      noStroke();
      ellipse(arr[i][0], arr[i][1], 10); */

    curveVertex(points[i][0],points[i][1]);
  }
  endShape();
}

// A function to push keypoints into an array
function findKeypoints() {
  for (let i = 0; i < predictions.length; i += 1) {
    const prediction = predictions[i];
    points.push(prediction.annotations.indexFinger[3]);
    stroke(0, 0, 255);
    circle(prediction.annotations.indexFinger[3][0], prediction.annotations.indexFinger[3][1], 5);
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

  // Returns true if only the index is up (ignores the thumb, which can be problematic)
  function onlyIndexUp(gesture) {
    return ((gesture[1] == 1) && (gesture[2] == 0) && (gesture[3] == 0) && (gesture[4] == 0));
  }