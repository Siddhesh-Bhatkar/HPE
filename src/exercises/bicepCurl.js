export class BicepCurl {
    constructor() {
        this.counter = 0;
        this.stage = 'down';
        this.lastUpdate = Date.now();
    }

    detect(results) {
        const landmarks = results.poseLandmarks;
        if(!landmarks) return;

        // Get key points
        const leftShoulder = landmarks[11];
        const leftElbow = landmarks[13];
        const leftWrist = landmarks[15];
        
        // Calculate angle
        const angle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
        
        // Detection logic
        if(angle > 160 && this.stage === 'down') {
            this.stage = 'up';
        }
        if(angle < 30 && this.stage === 'up' && Date.now() - this.lastUpdate > 1000) {
            this.stage = 'down';
            this.counter++;
            this.lastUpdate = Date.now();
            document.getElementById('counter').textContent = `Count: ${this.counter}`;
        }
    }

    calculateAngle(a, b, c) {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(radians * 180 / Math.PI);
        return angle > 180 ? 360 - angle : angle;
    }
}