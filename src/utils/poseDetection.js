import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

// Global variables
let detector;
let currentExercise = null;
let repCount = 0;
let exerciseState = {
  squat: { isDown: false, confidence: 0 },
  pushup: { isDown: false, confidence: 0 },
  plank: { isHolding: false, startTime: 0, duration: 0 },
  bicep: { isUp: false, confidence: 0 }
};

// Confidence threshold for keypoints
const POSE_CONFIDENCE_THRESHOLD = 0.3;

// Feedback messages for each exercise
const feedbackMessages = {
  squat: [
    "Keep your back straight",
    "Lower your hips more",
    "Keep your knees behind your toes",
    "Good depth!",
    "Maintain your form"
  ],
  pushup: [
    "Lower your chest more",
    "Keep your body straight",
    "Good elbow position",
    "Go all the way down",
    "Maintain core tension"
  ],
  plank: [
    "Keep your hips level",
    "Don't sag in the middle",
    "Engage your core",
    "Look slightly forward",
    "Good form!"
  ],
  bicep: [
    "Full range of motion",
    "Keep your elbows still",
    "Control the movement",
    "Slow down the lowering phase",
    "Good contraction at the top"
  ]
};

// Initialize TensorFlow.js and MoveNet model
export async function initializePoseDetection(videoElement, canvasElement, updateStatsCallback) {
  try {
    // Show loading status
    updateStatus("Loading TensorFlow.js...");
    
    // Initialize TensorFlow.js
    await tf.ready();
    updateStatus("Loading pose detection model...");
    
    // Configure detector with MoveNet
    const detectorConfig = {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true
    };
    
    // Create the detector
    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet, 
      detectorConfig
    );
    
    updateStatus("Model loaded successfully!");
    
    // Start the detection loop
    detectPose(videoElement, canvasElement, updateStatsCallback);
    
    return {
      setExercise: (exercise) => {
        currentExercise = exercise;
        repCount = 0;
        updateStatsCallback(repCount, getExerciseFeedback(exercise));
        
        if (exercise === 'plank') {
          exerciseState.plank.startTime = Date.now();
          exerciseState.plank.isHolding = false;
          exerciseState.plank.duration = 0;
        }
      },
      resetCount: () => {
        repCount = 0;
        updateStatsCallback(repCount, "Counter reset");
        
        if (currentExercise === 'plank') {
          exerciseState.plank.startTime = Date.now();
          exerciseState.plank.duration = 0;
        }
      }
    };
  } catch (error) {
    console.error("Error initializing pose detection:", error);
    updateStatus("Error loading model: " + error.message);
    throw error;
  }
}

// Main detection loop
async function detectPose(videoElement, canvasElement, updateStatsCallback) {
  if (!detector || videoElement.readyState < 2) {
    requestAnimationFrame(() => detectPose(videoElement, canvasElement, updateStatsCallback));
    return;
  }
  
  try {
    // Estimate poses
    const poses = await detector.estimatePoses(videoElement);
    
    // Process if poses detected and an exercise is selected
    if (poses.length > 0 && currentExercise) {
      const pose = poses[0];
      
      // Draw the pose
      drawPose(pose, videoElement, canvasElement);
      
      // Process the exercise
      processExercise(pose.keypoints, updateStatsCallback);
    }
  } catch (error) {
    console.error("Error during pose detection:", error);
  }
  
  // Continue the detection loop
  requestAnimationFrame(() => detectPose(videoElement, canvasElement, updateStatsCallback));
}

// Process the detected pose for the current exercise
function processExercise(keypoints, updateStatsCallback) {
  // Check if we have enough valid keypoints
  const validKeypoints = keypoints.filter(kp => kp.score > POSE_CONFIDENCE_THRESHOLD);
  if (validKeypoints.length < 12) {
    updateStatsCallback(repCount, "Move into frame properly");
    return;
  }
  
  // Process based on exercise type
  switch (currentExercise) {
    case 'squat':
      processSquat(keypoints, updateStatsCallback);
      break;
    case 'pushup':
      processPushup(keypoints, updateStatsCallback);
      break;
    case 'plank':
      processPlank(keypoints, updateStatsCallback);
      break;
    case 'bicep':
      processBicepCurl(keypoints, updateStatsCallback);
      break;
  }
}

// Process squat exercise
function processSquat(keypoints, updateStatsCallback) {
  const hips = findKeypoint(keypoints, 'left_hip');
  const knees = findKeypoint(keypoints, 'left_knee');
  const ankles = findKeypoint(keypoints, 'left_ankle');
  
  if (!hips || !knees || !ankles) return;
  
  // Calculate squat depth based on relative positions
  // Hip position relative to knee and ankle indicates squat depth
  const hipHeight = hips.y;
  const kneeHeight = knees.y;
  const hipKneeDistance = kneeHeight - hipHeight;
  
  // Determine if in squat position (hips below threshold)
  const isSquatDown = hipKneeDistance < 0.1 * kneeHeight; // Simplified
  
  // Check for rep completion
  if (isSquatDown && !exerciseState.squat.isDown) {
    exerciseState.squat.isDown = true;
    updateStatsCallback(repCount, "Good! Now stand up");
  } else if (!isSquatDown && exerciseState.squat.isDown) {
    exerciseState.squat.isDown = false;
    repCount++;
    updateStatsCallback(repCount, getExerciseFeedback('squat'));
  }
}

// Process pushup exercise
function processPushup(keypoints, updateStatsCallback) {
  const shoulders = findKeypoint(keypoints, 'left_shoulder');
  const elbows = findKeypoint(keypoints, 'left_elbow');
  const wrists = findKeypoint(keypoints, 'left_wrist');
  
  if (!shoulders || !elbows || !wrists) return;
  
  // Calculate elbow angle to determine pushup position
  const elbowAngle = calculateAngle(
    { x: shoulders.x, y: shoulders.y },
    { x: elbows.x, y: elbows.y },
    { x: wrists.x, y: wrists.y }
  );
  
  // Determine if in down position (elbow bent)
  const isPushupDown = elbowAngle < 110;
  
  // Check for rep completion
  if (isPushupDown && !exerciseState.pushup.isDown) {
    exerciseState.pushup.isDown = true;
    updateStatsCallback(repCount, "Good! Now push up");
  } else if (!isPushupDown && exerciseState.pushup.isDown) {
    exerciseState.pushup.isDown = false;
    repCount++;
    updateStatsCallback(repCount, getExerciseFeedback('pushup'));
  }
}

// Process plank exercise 
function processPlank(keypoints, updateStatsCallback) {
  const shoulders = findKeypoint(keypoints, 'left_shoulder');
  const hips = findKeypoint(keypoints, 'left_hip');
  const ankles = findKeypoint(keypoints, 'left_ankle');
  
  if (!shoulders || !hips || !ankles) return;
  
  // Check if body is in straight line (plank position)
  // Simplified: check if shoulder, hip and ankle form a relatively straight line
  const shoulderHipAnkleAngle = calculateAngle(
    { x: shoulders.x, y: shoulders.y },
    { x: hips.x, y: hips.y },
    { x: ankles.x, y: ankles.y }
  );
  
  const isInPlankPosition = shoulderHipAnkleAngle > 160;
  
  // Update plank status
  if (isInPlankPosition) {
    if (!exerciseState.plank.isHolding) {
      exerciseState.plank.isHolding = true;
      exerciseState.plank.startTime = Date.now();
      updateStatsCallback(0, "Plank position detected");
    } else {
      // Calculate duration
      exerciseState.plank.duration = Math.floor((Date.now() - exerciseState.plank.startTime) / 1000);
      updateStatsCallback(exerciseState.plank.duration, getExerciseFeedback('plank'));
    }
  } else if (exerciseState.plank.isHolding) {
    exerciseState.plank.isHolding = false;
    updateStatsCallback(exerciseState.plank.duration, "Plank position lost");
  }
}

// Process bicep curl exercise
function processBicepCurl(keypoints, updateStatsCallback) {
  const shoulders = findKeypoint(keypoints, 'left_shoulder');
  const elbows = findKeypoint(keypoints, 'left_elbow');
  const wrists = findKeypoint(keypoints, 'left_wrist');
  
  if (!shoulders || !elbows || !wrists) return;
  
  // Calculate elbow angle
  const elbowAngle = calculateAngle(
    { x: shoulders.x, y: shoulders.y },
    { x: elbows.x, y: elbows.y },
    { x: wrists.x, y: wrists.y }
  );
  
  // Determine if arm is curled up
  const isCurledUp = elbowAngle < 80;
  
  // Check for rep completion
  if (isCurledUp && !exerciseState.bicep.isUp) {
    exerciseState.bicep.isUp = true;
    updateStatsCallback(repCount, "Good! Now lower slowly");
  } else if (!isCurledUp && exerciseState.bicep.isUp) {
    exerciseState.bicep.isUp = false;
    repCount++;
    updateStatsCallback(repCount, getExerciseFeedback('bicep'));
  }
}

// Draw the detected pose on the canvas
function drawPose(pose, videoElement, canvasElement) {
  const ctx = canvasElement.getContext('2d');
  
  // Set canvas dimensions to match video
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
  
  // Clear the canvas
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Draw the video frame
  ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
  
  // Draw keypoints
  pose.keypoints.forEach(keypoint => {
    if (keypoint.score > POSE_CONFIDENCE_THRESHOLD) {
      ctx.beginPath();
      ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
      
      // Optional: Label keypoints
      // ctx.fillStyle = 'white';
      // ctx.fillText(keypoint.name, keypoint.x + 5, keypoint.y - 5);
    }
  });
  
  // Draw skeleton
  drawSkeleton(pose.keypoints, ctx);
}

// Define the connections for the skeleton
const skeletonConnections = [
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

// Draw the skeleton connections
function drawSkeleton(keypoints, ctx) {
  ctx.strokeStyle = 'aqua';
  ctx.lineWidth = 2;
  
  skeletonConnections.forEach(([p1Name, p2Name]) => {
    const p1 = keypoints.find(kp => kp.name === p1Name);
    const p2 = keypoints.find(kp => kp.name === p2Name);
    
    if (p1 && p2 && p1.score > POSE_CONFIDENCE_THRESHOLD && p2.score > POSE_CONFIDENCE_THRESHOLD) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  });
}

// Helper functions
function findKeypoint(keypoints, name) {
  const keypoint = keypoints.find(kp => kp.name === name);
  return keypoint && keypoint.score > POSE_CONFIDENCE_THRESHOLD ? keypoint : null;
}

// Calculate angle between three points
function calculateAngle(p1, p2, p3) {
  // Using law of cosines
  const a = Math.sqrt(Math.pow(p2.x - p3.x, 2) + Math.pow(p2.y - p3.y, 2));
  const b = Math.sqrt(Math.pow(p1.x - p3.x, 2) + Math.pow(p1.y - p3.y, 2));
  const c = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  
  // Calculate angle in degrees
  const angleRad = Math.acos((a*a + c*c - b*b) / (2 * a * c));
  return angleRad * (180 / Math.PI);
}

// Get feedback for current exercise
function getExerciseFeedback(exercise) {
  if (!exercise) return "Select an exercise to begin";
  
  const feedbacks = feedbackMessages[exercise];
  if (feedbacks) {
    return feedbacks[Math.floor(Math.random() * feedbacks.length)];
  }
  return "Maintain proper form";
}

// Update status message
function updateStatus(message) {
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.classList.remove('status-hidden');
    
    // Hide status after 3 seconds
    setTimeout(() => {
      statusElement.classList.add('status-hidden');
    }, 3000);
  }
}