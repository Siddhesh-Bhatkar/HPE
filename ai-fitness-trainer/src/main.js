import { initializePoseDetection } from './utils/poseDetection.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  const videoElement = document.getElementById('webcam');
  const canvasElement = document.getElementById('canvas');
  const statsDiv = document.getElementById('stats');

  // Add status message
  const statusDiv = document.createElement('div');
  statusDiv.id = 'status';
  statusDiv.textContent = 'Initializing camera...';
  document.body.insertBefore(statusDiv, canvasElement);

  // Setup camera and pose detection
  setupCamera()
    .then(() => {
      statusDiv.textContent = 'Loading TensorFlow models...';
      return initializePoseDetection(videoElement, canvasElement, statsDiv);
    })
    .then(() => {
      statusDiv.textContent = 'Ready! Select an exercise to begin.';
      setTimeout(() => {
        statusDiv.style.opacity = '0';
      }, 3000);
    })
    .catch(error => {
      console.error('Error initializing:', error);
      statusDiv.textContent = `Error: ${error.message}. Please refresh and try again.`;
      statusDiv.style.color = 'red';
    });
});

// Initialize webcam
async function setupCamera() {
  const videoElement = document.getElementById('webcam');
  
  // Request camera permission
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