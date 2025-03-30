import { initializePoseDetection } from './utils/poseDetection.js';

// Global variables
let isModelLoaded = false;
let currentExercise = null;
let repCount = 0;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  const videoElement = document.getElementById('webcam');
  const canvasElement = document.getElementById('canvas');
  const statsDiv = document.getElementById('stats');
  const repCounterElement = document.getElementById('rep-counter');
  const feedbackElement = document.getElementById('feedback-message');
  const statusElement = document.getElementById('status');
  const startCameraButton = document.getElementById('start-camera');
  const exerciseButtons = document.querySelectorAll('.exercise-button');

  // Draw placeholder on canvas
  drawPlaceholder(canvasElement, 'Click "Start Camera" to begin');

  // Start camera button event listener
  startCameraButton.addEventListener('click', () => {
    startCameraButton.disabled = true;
    startCameraButton.textContent = 'Starting...';
    
    setupCamera()
      .then(() => {
        showStatus('Initializing AI models...');
        return loadModels(videoElement, canvasElement, statsDiv);
      })
      .then(() => {
        startCameraButton.textContent = 'Camera Active';
        showStatus('Ready! Select an exercise to begin', 'success');
        isModelLoaded = true;
      })
      .catch(error => {
        console.error('Error:', error);
        startCameraButton.disabled = false;
        startCameraButton.textContent = 'Start Camera';
        showStatus(`Error: ${error.message}. Please try again.`, 'error');
      });
  });

  // Exercise selection
  exerciseButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (!isModelLoaded) {
        showStatus('Please start the camera first', 'warning');
        return;
      }

      // Remove active class from all buttons
      exerciseButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Set current exercise
      currentExercise = button.dataset.exercise;
      
      // Reset rep counter
      repCount = 0;
      repCounterElement.textContent = '0 reps';
      
      // Update feedback
      feedbackElement.textContent = `${capitalizeFirstLetter(currentExercise)} selected. Position yourself and begin.`;
      
      showStatus(`${capitalizeFirstLetter(currentExercise)} exercise activated`, 'success');
    });
  });
});

// Initialize webcam
async function setupCamera() {
  const videoElement = document.getElementById('webcam');
  showStatus('Requesting camera access...');
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 640,
        height: 480,
        facingMode: 'user'
      }
    });
    
    // Set video source to camera stream
    videoElement.srcObject = stream;
    
    // Wait for video to be ready
    return new Promise(resolve => {
      videoElement.onloadedmetadata = () => {
        videoElement.play();
        resolve();
      };
    });
  } catch (error) {
    throw new Error('Camera access denied or not available');
  }
}

// Load TensorFlow models
async function loadModels(videoElement, canvasElement, statsDiv) {
  try {
    // Initialize pose detection (this function should be modified in poseDetection.js)
    const { updateRepCount, getExerciseFeedback } = await initializePoseDetection(
      videoElement, 
      canvasElement, 
      updateStats
    );
    
    // Setup interval for updating stats
    setInterval(() => {
      if (currentExercise && isModelLoaded) {
        const newCount = updateRepCount(currentExercise);
        if (newCount !== repCount) {
          repCount = newCount;
          updateStats();
        }
        
        const feedback = getExerciseFeedback(currentExercise);
        if (feedback) {
          document.getElementById('feedback-message').textContent = feedback;
        }
      }
    }, 100);
    
    return true;
  } catch (error) {
    throw new Error('Failed to load AI models');
  }
}

// Update stats display
function updateStats() {
  const repCounterElement = document.getElementById('rep-counter');
  repCounterElement.textContent = `${repCount} reps`;
}

// Show status message
function showStatus(message, type = 'info') {
  const statusElement = document.getElementById('status');
  statusElement.textContent = message;
  statusElement.className = ''; // Remove all classes
  
  // Apply color based on type
  switch (type) {
    case 'success':
      statusElement.style.backgroundColor = '#4cc9f0';
      break;
    case 'error':
      statusElement.style.backgroundColor = '#f72585';
      break;
    case 'warning':
      statusElement.style.backgroundColor = '#f77f00';
      break;
    default:
      statusElement.style.backgroundColor = '#4361ee';
  }
  
  // Show status
  setTimeout(() => {
    statusElement.classList.remove('status-hidden');
  }, 10);
  
  // Hide status after 3 seconds
  setTimeout(() => {
    statusElement.classList.add('status-hidden');
  }, 3000);
}

// Draw placeholder on canvas
function drawPlaceholder(canvas, text) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#fff';
  ctx.font = '20px Poppins, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}