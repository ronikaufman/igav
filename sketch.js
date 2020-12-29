let handpose;
let video;
let predictions = [];
let points = [];

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
  image(video, 0, 0, width, height);

  // Call the findKeypoints function to push all keypoints into array
  findKeypoints();

  // Draw lines between keypoints within the array
  for (let i = 0; i < points.length - 1; i+=1){

    /* CODE TO DRAW ELLIPSES
    noStroke();
    ellipse(arr[i][0], arr[i][1], 10); */

    if (points.length > 2){
      let nextindex = i + 1; 
      stroke(255, 204, 0);
      strokeWeight(4);
      // line(starting point x, starting point y, end point x, end point y)
      line(points[i][0],points[i][1], points[nextindex][0],points[nextindex][1]);
    }
  }
}

// A function to push keypoints into an array
function findKeypoints() {
  for (let i = 0; i < predictions.length; i += 1) {
    const prediction = predictions[i];
    points.push(prediction.annotations.indexFinger[3]);
    }
  }
