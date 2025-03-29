export class SquatChecker {
    static checkForm(keypoints, count, isInPosition) {
      const leftHip = keypoints.find(k => k.name === 'left_hip');
      const leftKnee = keypoints.find(k => k.name === 'left_knee');
      const rightHip = keypoints.find(k => k.name === 'right_hip');
      const rightKnee = keypoints.find(k => k.name === 'right_knee');
      
      if (!leftHip || !leftKnee || !rightHip || !rightKnee) {
        return count; // Not all required keypoints are detected
      }
      
      // Average hip and knee position from both sides
      const hipY = (leftHip.y + rightHip.y) / 2;
      const kneeY = (leftKnee.y + rightKnee.y) / 2;
      
      // Check if currently in squat position (hip is low)
      const inSquatPosition = (hipY > kneeY - 30); // Hip is close to or below the knee
      
      // Only count when transitioning from squat to standing
      if (isInPosition && !inSquatPosition) {
        return count + 1; // Completed a rep
      }
      
      return count;
    }
    
    static isInSquatPosition(keypoints) {
      const leftHip = keypoints.find(k => k.name === 'left_hip');
      const leftKnee = keypoints.find(k => k.name === 'left_knee');
      const rightHip = keypoints.find(k => k.name === 'right_hip');
      const rightKnee = keypoints.find(k => k.name === 'right_knee');
      
      if (!leftHip || !leftKnee || !rightHip || !rightKnee) {
        return false;
      }
      
      const hipY = (leftHip.y + rightHip.y) / 2;
      const kneeY = (leftKnee.y + rightKnee.y) / 2;
      
      return (hipY > kneeY - 30); // Hip is close to or below the knee
    }
  }