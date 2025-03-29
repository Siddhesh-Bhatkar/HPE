import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import { SquatChecker } from '../components/Squats.js';
import { PushUpChecker } from '../components/PushUp.js';
import { PlankChecker } from '../components/Plank.js';
import { BicepCurlChecker } from '../components/BicepCurl.js';

// Global variables
let detector;
let currentExercise = 'squat'; // Default exercise
let repCount = 0;
let isInPosition = false;
let lastPoseTime = 0;

// Initialize pose detection
export async function initializePoseDetection(videoElement, canvasElement, statsDiv) {
  await tf.ready();
  
  // Set up the detector
  const detectorConfig = {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    enableSmoothing: true
  };
  
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet, 
    detectorConfig
  );
  
  // Start detection loop
  detectPose(videoElement, canvasElement, statsDiv);
  
  // Add UI for exercise selection
  setupExerciseControls(statsDiv);
}

// Create UI controls for exercise selection
function setupExerciseControls(statsDiv) {
  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'exercise-controls';
  
  const exercises = ['squat', 'pushup', 'plank', 'bicep-curl'];
  
  exercises.forEach(exercise => {
    const button = document.createElement('button');
    button.textContent = exercise.charAt(0).toUpperCase() + exercise.slice(1).replace('-', ' ');
    button.onclick = () => {
      currentExercise = exercise;
      repCount = 0;
      isInPosition = false;
      updateStats(statsDiv);
    };
    controlsDiv.appendChild(button);
  });
  
  // Add reset button
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset Count';
  resetButton.onclick = () => {
    repCount = 0;
    updateStats(statsDiv);
  };
  controlsDiv.appendChild(resetButton);
  
  document.body.insertBefore(controlsDiv, statsDiv);
}

// Main detection loop
async function detectPose(videoElement, canvasElement, statsDiv) {
  if (detector && videoElement.readyState === 4) {
    const poses = await detector.estimatePoses(videoElement);
    
    if (poses.length > 0) {
      const pose = poses[0];
      
      // Process the pose for the current exercise
      processExercise(pose.keypoints, statsDiv);
      
      // Draw the pose
      drawPose(pose, videoElement, canvasElement);
      
      // Update the last pose time
      lastPoseTime = Date.now();
    }
  }
  
  // Continue the detection loop
  requestAnimationFrame(() => {
    detectPose(videoElement, canvasElement, statsDiv);
  });
}

// Process the detected pose for exercise counting
function processExercise(keypoints, statsDiv) {
  // Normalize keypoints to have confidence
  const validKeypoints = keypoints.filter(kp => kp.score > 0.3);
  
  if (validKeypoints.length < 10) return; // Not enough keypoints detected
  
  switch (currentExercise) {
    case 'squat':
      const newSquatCount = SquatChecker.checkForm(keypoints, repCount, isInPosition);
      if (newSquatCount !== repCount) {
        repCount = newSquatCount;
        updateStats(statsDiv);
      }
      isInPosition = SquatChecker.isInSquatPosition(keypoints);
      break;
      
    case 'pushup':
      const newPushupCount = PushUpChecker.checkForm(keypoints, repCount, isInPosition);
      if (newPushupCount !== repCount) {
        repCount = newPushupCount;
        updateStats(statsDiv);
      }
      isInPosition = PushUpChecker.isInPushupPosition(keypoints);
      break;
      
    case 'plank':
      // For plank, we measure duration rather than reps
      if (PlankChecker.checkForm(keypoints)) {
        if (!isInPosition) {
          isInPosition = true;
          updateStats(statsDiv, "Plank position detected");
        }
      } else {
        if (isInPosition) {
          isInPosition = false;
          updateStats(statsDiv, "Plank position lost");
        }
      }
      break;
      
    case 'bicep-curl':
      const newCurlCount = BicepCurlChecker.checkForm(keypoints, repCount, isInPosition);
      if (newCurlCount !== repCount) {
        repCount = newCurlCount;
        updateStats(statsDiv);
      }
      isInPosition = BicepCurlChecker.isInCurlPosition(keypoints);
      break;
  }
}

// Update the stats display
function updateStats(statsDiv, message = null) {
  statsDiv.innerHTML = '';
  
  const exerciseTitle = document.createElement('h2');
  exerciseTitle.textContent = `Current Exercise: ${currentExercise.charAt(0).toUpperCase() + currentExercise.slice(1).replace('-', ' ')}`;
  statsDiv.appendChild(exerciseTitle);
  
  if (currentExercise === 'plank') {
    const statusElement = document.createElement('p');
    statusElement.textContent = isInPosition ? 'In plank position' : 'Not in plank position';
    statsDiv.appendChild(statusElement);
    
    if (isInPosition) {
      const timerElement = document.createElement('p');
      timerElement.id = 'plank-timer';
      statsDiv.appendChild(timerElement);
      
      // Update the timer
      updatePlankTimer(timerElement);
    }
  } else {
    const countElement = document.createElement('p');
    countElement.textContent = `Rep Count: ${repCount}`;
    statsDiv.appendChild(countElement);
  }
  
  if (message) {
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.className = 'feedback-message';
    statsDiv.appendChild(messageElement);
  }
}

// Update the plank timer
function updatePlankTimer(timerElement) {
  let startTime = Date.now();
  
  const timerInterval = setInterval(() => {
    if (!isInPosition) {
      clearInterval(timerInterval);
      return;
    }
    
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    timerElement.textContent = `Time: ${elapsedSeconds} seconds`;
  }, 1000);
}

// Draw the detected pose on the canvas
function drawPose(pose, videoElement, canvasElement) {
  const ctx = canvasElement.getContext('2d');
  
  // Set canvas to match video dimensions
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
  
  // Clear the canvas
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Draw the video frame
  ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
  
  // Draw keypoints
  pose.keypoints.forEach(keypoint => {
    if (keypoint.score > 0.3) {
      ctx.beginPath();
      ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
    }
  });
  
  // Draw connections between keypoints (skeleton)
  drawSkeleton(pose.keypoints, ctx);
}

// Define the connections for the skeleton
const connections = [
  ['nose', 'left_eye'], ['nose', 'right_eye'],
  ['left_eye', 'left_ear'], ['right_eye', 'right_ear'],
  ['nose', 'left_shoulder'], ['nose', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'], ['right_shoulder', 'right_elbow'],
  ['left_elbow', 'left_wrist'], ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'], ['right_hip', 'right_knee'],
  ['left_knee', 'left_ankle'], ['right_knee', 'right_ankle']
];

// Draw the skeleton
function drawSkeleton(keypoints, ctx) {
  ctx.strokeStyle = 'blue';
  ctx.lineWidth = 2;
  
  connections.forEach(([p1Name, p2Name]) => {
    const p1 = keypoints.find(kp => kp.name === p1Name);
    const p2 = keypoints.find(kp => kp.name === p2Name);
    
    if (p1 && p2 && p1.score > 0.3 && p2.score > 0.3) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  });
}