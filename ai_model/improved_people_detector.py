"""
Improved People Detection with Non-Maximum Suppression (NMS)
Fixes false positives and duplicate detections for accurate people counting
"""

import cv2
import numpy as np
import tensorflow as tf
from typing import List, Tuple, Dict, Optional
import logging
from dataclasses import dataclass
import time

logger = logging.getLogger(__name__)

@dataclass
class Detection:
    """Single detection result"""
    bbox: Tuple[int, int, int, int]  # x, y, width, height
    confidence: float
    class_id: int
    class_name: str

@dataclass
class PeopleCountResult:
    """People counting result with debugging info"""
    people_count: int
    detections: List[Detection]
    raw_detections: int
    filtered_detections: int
    confidence_threshold: float
    nms_threshold: float
    processing_time_ms: float
    debug_image: Optional[np.ndarray] = None

class ImprovedPeopleDetector:
    """
    Advanced people detector with NMS and false positive filtering
    """
    
    def __init__(self, config: Dict = None):
        self.config = config or self._get_default_config()
        
        # Detection parameters
        self.confidence_threshold = self.config.get('confidence_threshold', 0.5)
        self.nms_threshold = self.config.get('nms_threshold', 0.4)
        self.min_detection_size = self.config.get('min_detection_size', (30, 50))
        self.max_detection_size = self.config.get('max_detection_size', (300, 400))
        
        # Initialize detectors
        self.yolo_detector = None
        self.face_cascade = None
        self.body_cascade = None
        
        self._initialize_detectors()
        
        logger.info("ImprovedPeopleDetector initialized")
    
    def _get_default_config(self) -> Dict:
        """Default configuration for people detection"""
        return {
            'confidence_threshold': 0.5,
            'nms_threshold': 0.4,
            'min_detection_size': (30, 50),
            'max_detection_size': (300, 400),
            'use_yolo': True,
            'use_opencv_dnn': True,
            'use_face_detection': True,
            'debug_mode': True
        }
    
    def _initialize_detectors(self):
        """Initialize all available detectors"""
        try:
            # Initialize YOLO detector (if available)
            if self.config.get('use_yolo', True):
                self._init_yolo_detector()
            
            # Initialize OpenCV cascade classifiers
            self._init_cascade_detectors()
            
            # Initialize DNN detector
            if self.config.get('use_opencv_dnn', True):
                self._init_dnn_detector()
                
        except Exception as e:
            logger.error(f"Detector initialization failed: {e}")
    
    def _init_yolo_detector(self):
        """Initialize YOLO detector for people detection"""
        try:
            # This would load a pre-trained YOLO model
            # For now, we'll use a placeholder
            logger.info("YOLO detector would be initialized here")
            # self.yolo_detector = cv2.dnn.readNet('yolo_weights.weights', 'yolo_config.cfg')
        except Exception as e:
            logger.warning(f"YOLO detector initialization failed: {e}")
    
    def _init_cascade_detectors(self):
        """Initialize OpenCV cascade classifiers"""
        try:
            # Face cascade for people detection
            self.face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            
            # Full body cascade (if available)
            try:
                self.body_cascade = cv2.CascadeClassifier(
                    cv2.data.haarcascades + 'haarcascade_fullbody.xml'
                )
            except:
                logger.info("Full body cascade not available")
                
        except Exception as e:
            logger.warning(f"Cascade detector initialization failed: {e}")
    
    def _init_dnn_detector(self):
        """Initialize DNN-based detector"""
        try:
            # This would initialize a DNN model for people detection
            # Using MobileNet SSD or similar
            logger.info("DNN detector would be initialized here")
        except Exception as e:
            logger.warning(f"DNN detector initialization failed: {e}")
    
    def detect_people(self, image: np.ndarray, debug: bool = None) -> PeopleCountResult:
        """
        Detect people in image with improved accuracy
        
        Args:
            image: Input image (BGR format)
            debug: Enable debug visualization
            
        Returns:
            PeopleCountResult with accurate count and debugging info
        """
        start_time = time.time()
        debug = debug if debug is not None else self.config.get('debug_mode', False)
        
        # Get all detections from different methods
        all_detections = []
        
        # Method 1: Face detection (most reliable for people)
        face_detections = self._detect_faces(image)
        all_detections.extend(face_detections)
        
        # Method 2: Full body detection (if available)
        if self.body_cascade is not None:
            body_detections = self._detect_bodies(image)
            all_detections.extend(body_detections)
        
        # Method 3: YOLO detection (if available)
        if self.yolo_detector is not None:
            yolo_detections = self._detect_yolo(image)
            all_detections.extend(yolo_detections)
        
        raw_count = len(all_detections)
        
        # Apply filtering and NMS
        filtered_detections = self._filter_detections(all_detections, image.shape)
        final_detections = self._apply_nms(filtered_detections)
        
        # Create result
        processing_time = (time.time() - start_time) * 1000
        
        result = PeopleCountResult(
            people_count=len(final_detections),
            detections=final_detections,
            raw_detections=raw_count,
            filtered_detections=len(filtered_detections),
            confidence_threshold=self.confidence_threshold,
            nms_threshold=self.nms_threshold,
            processing_time_ms=processing_time
        )
        
        # Add debug visualization if requested
        if debug:
            result.debug_image = self._create_debug_image(image, final_detections, all_detections)
        
        return result
    
    def _detect_faces(self, image: np.ndarray) -> List[Detection]:
        """Detect faces as indicators of people"""
        detections = []
        
        if self.face_cascade is None:
            return detections
        
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect faces with multiple scales
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30),
                maxSize=(200, 200)
            )
            
            for (x, y, w, h) in faces:
                # Estimate full body from face detection
                body_x = max(0, x - w // 2)
                body_y = max(0, y - h // 4)
                body_w = min(image.shape[1] - body_x, w * 2)
                body_h = min(image.shape[0] - body_y, h * 4)
                
                detection = Detection(
                    bbox=(body_x, body_y, body_w, body_h),
                    confidence=0.8,  # High confidence for face-based detection
                    class_id=0,
                    class_name='person'
                )
                detections.append(detection)
                
        except Exception as e:
            logger.error(f"Face detection failed: {e}")
        
        return detections
    
    def _detect_bodies(self, image: np.ndarray) -> List[Detection]:
        """Detect full bodies"""
        detections = []
        
        if self.body_cascade is None:
            return detections
        
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            bodies = self.body_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=3,
                minSize=(50, 100),
                maxSize=(300, 400)
            )
            
            for (x, y, w, h) in bodies:
                detection = Detection(
                    bbox=(x, y, w, h),
                    confidence=0.6,  # Medium confidence for body detection
                    class_id=0,
                    class_name='person'
                )
                detections.append(detection)
                
        except Exception as e:
            logger.error(f"Body detection failed: {e}")
        
        return detections
    
    def _detect_yolo(self, image: np.ndarray) -> List[Detection]:
        """YOLO-based people detection (placeholder)"""
        detections = []
        
        # This would implement YOLO detection
        # For now, return empty list
        
        return detections
    
    def _filter_detections(self, detections: List[Detection], image_shape: Tuple) -> List[Detection]:
        """Filter detections based on size and confidence"""
        filtered = []
        
        h, w = image_shape[:2]
        min_w, min_h = self.min_detection_size
        max_w, max_h = self.max_detection_size
        
        for detection in detections:
            x, y, bbox_w, bbox_h = detection.bbox
            
            # Filter by confidence
            if detection.confidence < self.confidence_threshold:
                continue
            
            # Filter by size
            if bbox_w < min_w or bbox_h < min_h:
                continue
            
            if bbox_w > max_w or bbox_h > max_h:
                continue
            
            # Filter by position (remove detections at image edges)
            if x < 5 or y < 5 or x + bbox_w > w - 5 or y + bbox_h > h - 5:
                continue
            
            # Filter by aspect ratio (people are taller than wide)
            aspect_ratio = bbox_h / bbox_w
            if aspect_ratio < 1.2:  # People should be at least 1.2x taller than wide
                continue
            
            filtered.append(detection)
        
        return filtered
    
    def _apply_nms(self, detections: List[Detection]) -> List[Detection]:
        """Apply Non-Maximum Suppression to remove duplicate detections"""
        if len(detections) <= 1:
            return detections
        
        # Convert to format needed for OpenCV NMS
        boxes = []
        scores = []
        
        for detection in detections:
            x, y, w, h = detection.bbox
            boxes.append([x, y, x + w, y + h])
            scores.append(detection.confidence)
        
        boxes = np.array(boxes, dtype=np.float32)
        scores = np.array(scores, dtype=np.float32)
        
        # Apply NMS
        indices = cv2.dnn.NMSBoxes(
            boxes.tolist(),
            scores.tolist(),
            self.confidence_threshold,
            self.nms_threshold
        )
        
        # Return filtered detections
        if len(indices) > 0:
            indices = indices.flatten()
            return [detections[i] for i in indices]
        
        return []
    
    def _create_debug_image(self, image: np.ndarray, final_detections: List[Detection], 
                           all_detections: List[Detection]) -> np.ndarray:
        """Create debug visualization showing all detections"""
        debug_img = image.copy()
        
        # Draw all raw detections in red (before filtering)
        for detection in all_detections:
            x, y, w, h = detection.bbox
            cv2.rectangle(debug_img, (x, y), (x + w, y + h), (0, 0, 255), 1)
            cv2.putText(debug_img, f'Raw: {detection.confidence:.2f}', 
                       (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)
        
        # Draw final detections in green (after filtering and NMS)
        for i, detection in enumerate(final_detections):
            x, y, w, h = detection.bbox
            cv2.rectangle(debug_img, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.putText(debug_img, f'Person {i+1}: {detection.confidence:.2f}', 
                       (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        # Add summary text
        cv2.putText(debug_img, f'Raw: {len(all_detections)}, Final: {len(final_detections)}', 
                   (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        return debug_img
    
    def tune_parameters(self, test_images: List[np.ndarray], 
                       ground_truth_counts: List[int]) -> Dict:
        """
        Automatically tune detection parameters for best accuracy
        
        Args:
            test_images: List of test images
            ground_truth_counts: True people counts for each image
            
        Returns:
            Best parameters found
        """
        best_params = None
        best_accuracy = 0
        
        # Parameter ranges to test
        confidence_thresholds = [0.3, 0.4, 0.5, 0.6, 0.7]
        nms_thresholds = [0.2, 0.3, 0.4, 0.5, 0.6]
        
        for conf_thresh in confidence_thresholds:
            for nms_thresh in nms_thresholds:
                # Test with these parameters
                self.confidence_threshold = conf_thresh
                self.nms_threshold = nms_thresh
                
                correct_predictions = 0
                total_predictions = len(test_images)
                
                for img, true_count in zip(test_images, ground_truth_counts):
                    result = self.detect_people(img, debug=False)
                    predicted_count = result.people_count
                    
                    # Consider prediction correct if within ±1 of true count
                    if abs(predicted_count - true_count) <= 1:
                        correct_predictions += 1
                
                accuracy = correct_predictions / total_predictions
                
                if accuracy > best_accuracy:
                    best_accuracy = accuracy
                    best_params = {
                        'confidence_threshold': conf_thresh,
                        'nms_threshold': nms_thresh,
                        'accuracy': accuracy
                    }
        
        # Apply best parameters
        if best_params:
            self.confidence_threshold = best_params['confidence_threshold']
            self.nms_threshold = best_params['nms_threshold']
            logger.info(f"Best parameters found: {best_params}")
        
        return best_params or {'accuracy': 0}

# Example usage and testing
if __name__ == "__main__":
    # Create detector
    detector = ImprovedPeopleDetector()
    
    # Test with a sample image
    test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    
    result = detector.detect_people(test_image, debug=True)
    
    print(f"People detected: {result.people_count}")
    print(f"Raw detections: {result.raw_detections}")
    print(f"After filtering: {result.filtered_detections}")
    print(f"Processing time: {result.processing_time_ms:.1f}ms")
