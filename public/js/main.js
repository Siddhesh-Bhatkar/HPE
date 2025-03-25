import {BicepCurl} from './exercises/bicepCurl.js';
import {PushUp} from './exercises/pushUp.js';
import {Plank} from './exercises/plank.js';
import {Squats} from './exercises/squats.js';

const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
let currentExercise = null;

const pose = new Pose({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
});

pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

pose.onResults((results) => {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);
    drawLandmarks(canvasCtx, results.poseLandmarks);
    
    if(currentExercise) {
        currentExercise.detect(results);
    }
    
    canvasCtx.restore();
});

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await pose.send({image: videoElement});
    },
    width: 1280,
    height: 720
});

document.querySelectorAll('.exercise-card').forEach(button => {
    button.addEventListener('click', () => {
        const exercise = button.dataset.exercise;
        switch(exercise) {
            case 'bicepCurl':
                currentExercise = new BicepCurl();
                break;
            case 'pushUp':
                currentExercise = new PushUp();
                break;
            case 'plank':
                currentExercise = new Plank();
                break;
            case 'squats':
                currentExercise = new Squats();
                break;
        }
        camera.start();
    });
});