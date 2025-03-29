export class BicepCurlChecker {
    static checkForm(keypoints, count, isInPosition) {
      const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
      const leftElbow = keypoints.find(k => k.name === 'left_elbow');
      const leftWrist = keypoints.find(k => k.name === 'left_wrist');
      
      const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
      const rightElbow = keypoints.find(k => k.name === 'right_elbow');
      const rightWrist = keypoints.find(k => k.name === 'right_wrist');
      
      if (!leftShoulder || !leftElbow || !leftWrist || 
          !rightShoulder || !rightElbow || !rightWrist) {
        return count; // Not all required keypoints are detected
      }
      
      // Check left arm
      const leftArmCurled = this.isArmCurled(leftShoulder, leftElbow, leftWrist);
      
      // Check right arm
      const rightArmCurled = this.isArmCurled(rightShoulder, rightElbow, rightWrist);
      
      // Consider curl position if either arm is curled
      const inCurlPosition = leftArmCurled || rightArmCurled;
      
      // Only count when transitioning from curled to extended
      if (isInPosition && !inCurlPosition) {
        return count + 1; // Completed a rep
      }
      
      return count;
    }
    
    static isArmCurled(shoulder, elbow, wrist) {
      // Calculate vectors
      const upperArmX = elbow.x - shoulder.x;
      const upperArmY = elbow.y - shoulder.y;
      
      const forearmX = wrist.x - elbow.x;
      const forearmY = wrist.y - elbow.y;
      
      // Calculate dot product
      const dotProduct = upperArmX * forearmX + upperArmY * forearmY;
      
      // Calculate magnitudes
      const upperArmMag = Math.sqrt(upperArmX * upperArmX + upperArmY * upperArmY);
      const forearmMag = Math.sqrt(forearmX * forearmX + forearmY * forearmY);
      
      // Calculate angle in radians
      const cosAngle = dotProduct / (upperArmMag * forearmMag);
      const angle = Math.acos(Math.min(Math.max(cosAngle, -1), 1));
      
      // Convert to degrees
      const angleDegrees = angle * 180 / Math.PI;
      
      // Angle between upper arm and forearm should be small for a curl
      return angleDegrees < 90;
    }
    
    static isInCurlPosition(keypoints) {
      const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
      const leftElbow = keypoints.find(k => k.name === 'left_elbow');
      const leftWrist = keypoints.find(k => k.name === 'left_wrist');
      
      const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
      const rightElbow = keypoints.find(k => k.name === 'right_elbow');
      const rightWrist = keypoints.find(k => k.name === 'right_wrist');
      
      if (!leftShoulder || !leftElbow || !leftWrist || 
          !rightShoulder || !rightElbow || !rightWrist) {
        return false;
      }
      
      const leftArmCurled = this.isArmCurled(leftShoulder, leftElbow, leftWrist);
      const rightArmCurled = this.isArmCurled(rightShoulder, rightElbow, rightWrist);
      
      return leftArmCurled || rightArmCurled;
    }
  }