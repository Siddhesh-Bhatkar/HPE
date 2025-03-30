export class PlankChecker {
    static checkForm(keypoints) {
      const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
      const leftHip = keypoints.find(k => k.name === 'left_hip');
      const leftAnkle = keypoints.find(k => k.name === 'left_ankle');
      
      const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
      const rightHip = keypoints.find(k => k.name === 'right_hip');
      const rightAnkle = keypoints.find(k => k.name === 'right_ankle');
      
      if (!leftShoulder || !leftHip || !leftAnkle || 
          !rightShoulder || !rightHip || !rightAnkle) {
        return false; // Not all required keypoints are detected
      }
      
      // Calculate body alignment
      // For a good plank, shoulders, hips, and ankles should form a straight line
      
      // Calculate slope between shoulders and hips
      const shoulderHipSlopeLeft = Math.abs((leftHip.y - leftShoulder.y) / (leftHip.x - leftShoulder.x || 0.001));
      const shoulderHipSlopeRight = Math.abs((rightHip.y - rightShoulder.y) / (rightHip.x - rightShoulder.x || 0.001));
      
      // Calculate slope between hips and ankles
      const hipAnkleSlopeLeft = Math.abs((leftAnkle.y - leftHip.y) / (leftAnkle.x - leftHip.x || 0.001));
      const hipAnkleSlopeRight = Math.abs((rightAnkle.y - rightHip.y) / (rightAnkle.x - rightHip.x || 0.001));
      
      // For a good plank, these slopes should be similar (body is straight)
      const maxSlopeDifference = 0.3;
      const isLeftAligned = Math.abs(shoulderHipSlopeLeft - hipAnkleSlopeLeft) < maxSlopeDifference;
      const isRightAligned = Math.abs(shoulderHipSlopeRight - hipAnkleSlopeRight) < maxSlopeDifference;
      
      // Check if body is relatively horizontal (not standing up)
      const isHorizontal = (leftShoulder.y > leftHip.y - 50) && (rightShoulder.y > rightHip.y - 50);
      
      return (isLeftAligned || isRightAligned) && isHorizontal;
    }
  }