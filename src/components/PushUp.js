export class PushUpChecker {
    static checkForm(keypoints, count, isInPosition) {
      const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
      const leftWrist = keypoints.find(k => k.name === 'left_wrist');
      const leftElbow = keypoints.find(k => k.name === 'left_elbow');
      
      const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
      const rightWrist = keypoints.find(k => k.name === 'right_wrist');
      const rightElbow = keypoints.find(k => k.name === 'right_elbow');
      
      if (!leftShoulder || !leftWrist || !leftElbow || 
          !rightShoulder || !rightWrist || !rightElbow) {
        return count; // Not all required keypoints are detected
      }
      
      // Average elbow and shoulder Y positions
      const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
      const elbowY = (leftElbow.y + rightElbow.y) / 2;
      
      // In push-up down position, elbows are lower than shoulders
      const inDownPosition = (elbowY > shoulderY + 20);
      
      // Only count when transitioning from down to up
      if (isInPosition && !inDownPosition) {
        return count + 1; // Completed a rep
      }
      
      return count;
    }
    
    static isInPushupPosition(keypoints) {
      const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
      const leftWrist = keypoints.find(k => k.name === 'left_wrist');
      const leftElbow = keypoints.find(k => k.name === 'left_elbow');
      
      const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
      const rightWrist = keypoints.find(k => k.name === 'right_wrist');
      const rightElbow = keypoints.find(k => k.name === 'right_elbow');
      
      if (!leftShoulder || !leftWrist || !leftElbow || 
          !rightShoulder || !rightWrist || !rightElbow) {
        return false;
      }
      
      // Average elbow and shoulder Y positions
      const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
      const elbowY = (leftElbow.y + rightElbow.y) / 2;
      
      // Check if in planking position (horizontal body alignment)
      return (elbowY > shoulderY + 20);
    }
  }