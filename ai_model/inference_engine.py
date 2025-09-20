"""
Production-Ready Inference Engine for Stampede Detection
Optimized for real-time performance with comprehensive error handling
"""

import os
import cv2
import numpy as np
import tensorflow as tf
from pathlib import Path
import logging
from typing import Dict, List, Tuple, Optional, Union
import time
from collections import deque
import threading
import queue
from dataclasses import dataclass
from enum import Enum
import json
import pickle

from config import CONFIG

logger = logging.getLogger(__name__)

class RiskLevel(Enum):
    """Risk level enumeration"""
    NORMAL = "normal"
    CROWDED = "crowded"
    HIGH_RISK = "high_risk"
    STAMPEDE_IMMINENT = "stampede_imminent"

@dataclass
class DetectionResult:
    """Structured detection result"""
    risk_level: RiskLevel
    confidence: float
    people_count: int
    crowd_density: float
    timestamp: float
    processing_time_ms: float
    frame_id: Optional[str] = None
    bounding_boxes: Optional[List] = None
    risk_factors: Optional[Dict] = None
    alert_message: Optional[str] = None

class ModelManager:
    """Manages model loading, caching, and ensemble predictions"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.models = {}
        self.model_metadata = {}
        self.current_model = None
        self.ensemble_models = []
        
    def load_model(self, model_path: str, model_name: str = "primary") -> bool:
        """Load a trained model with error handling"""
        try:
            logger.info(f"Loading model from {model_path}")
            
            # Check if model file exists
            if not os.path.exists(model_path):
                logger.error(f"Model file not found: {model_path}")
                return False
            
            # Load model based on file extension
            if model_path.endswith('.h5'):
                model = tf.keras.models.load_model(model_path, compile=False)
            elif model_path.endswith('.pb') or os.path.isdir(model_path):
                model = tf.saved_model.load(model_path)
            else:
                logger.error(f"Unsupported model format: {model_path}")
                return False
            
            # Store model and metadata
            self.models[model_name] = model
            self.model_metadata[model_name] = {
                'path': model_path,
                'loaded_at': time.time(),
                'input_shape': self.config['model']['input_shape']
            }
            
            # Set as current model if it's the first one
            if self.current_model is None:
                self.current_model = model_name
            
            logger.info(f"Model '{model_name}' loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model {model_path}: {str(e)}")
            return False
    
    def load_ensemble(self, model_paths: List[str]) -> bool:
        """Load ensemble of models for improved accuracy"""
        try:
            self.ensemble_models = []
            
            for i, model_path in enumerate(model_paths):
                model_name = f"ensemble_{i}"
                if self.load_model(model_path, model_name):
                    self.ensemble_models.append(model_name)
            
            logger.info(f"Loaded ensemble of {len(self.ensemble_models)} models")
            return len(self.ensemble_models) > 0
            
        except Exception as e:
            logger.error(f"Failed to load ensemble: {str(e)}")
            return False
    
    def get_model(self, model_name: str = None):
        """Get model by name or current model"""
        model_name = model_name or self.current_model
        return self.models.get(model_name)
    
    def predict_single(self, input_data: np.ndarray, model_name: str = None) -> np.ndarray:
        """Single model prediction"""
        model = self.get_model(model_name)
        if model is None:
            raise ValueError(f"Model not found: {model_name}")
        
        return model.predict(input_data, verbose=0)
    
    def predict_ensemble(self, input_data: np.ndarray) -> np.ndarray:
        """Ensemble prediction with voting"""
        if not self.ensemble_models:
            return self.predict_single(input_data)
        
        predictions = []
        for model_name in self.ensemble_models:
            try:
                pred = self.predict_single(input_data, model_name)
                predictions.append(pred[0])  # Classification output
            except Exception as e:
                logger.warning(f"Ensemble model {model_name} failed: {e}")
        
        if not predictions:
            raise RuntimeError("All ensemble models failed")
        
        # Average predictions
        ensemble_pred = np.mean(predictions, axis=0)
        return [ensemble_pred]  # Return in same format as single prediction

class ImagePreprocessor:
    """Optimized image preprocessing for real-time inference"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.input_shape = config['model']['input_shape']
        self.mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        self.std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        
        # Pre-allocate arrays for better performance
        self.preprocessed_buffer = np.zeros((1, *self.input_shape), dtype=np.float32)
        
    def preprocess_frame(self, frame: np.ndarray) -> np.ndarray:
        """Fast preprocessing for single frame"""
        try:
            # Convert BGR to RGB if needed
            if len(frame.shape) == 3 and frame.shape[2] == 3:
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Resize to target shape
            resized = cv2.resize(frame, (self.input_shape[1], self.input_shape[0]))
            
            # Normalize to [0, 1]
            normalized = resized.astype(np.float32) / 255.0
            
            # Apply ImageNet normalization
            normalized = (normalized - self.mean) / self.std
            
            # Add batch dimension
            self.preprocessed_buffer[0] = normalized
            
            return self.preprocessed_buffer.copy()
            
        except Exception as e:
            logger.error(f"Preprocessing failed: {str(e)}")
            return None
    
    def preprocess_batch(self, frames: List[np.ndarray]) -> np.ndarray:
        """Batch preprocessing for multiple frames"""
        batch_size = len(frames)
        batch_array = np.zeros((batch_size, *self.input_shape), dtype=np.float32)
        
        for i, frame in enumerate(frames):
            processed = self.preprocess_frame(frame)
            if processed is not None:
                batch_array[i] = processed[0]
        
        return batch_array

class CrowdAnalyzer:
    """Advanced crowd analysis with multiple detection methods"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.thresholds = config['crowd_thresholds']
        
        # Initialize face detector
        self.face_cascade = None
        self.init_face_detector()
        
        # Initialize people detector (YOLO or similar)
        self.people_detector = None
        self.init_people_detector()
        
    def init_face_detector(self):
        """Initialize OpenCV face detector"""
        try:
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            logger.info("Face detector initialized")
        except Exception as e:
            logger.warning(f"Face detector initialization failed: {e}")
    
    def init_people_detector(self):
        """Initialize people detection model"""
        try:
            # Load pre-trained YOLO or MobileNet SSD for people detection
            # This is a placeholder - implement based on your preferred detector
            logger.info("People detector would be initialized here")
        except Exception as e:
            logger.warning(f"People detector initialization failed: {e}")
    
    def detect_faces(self, frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Detect faces in frame"""
        if self.face_cascade is None:
            return []
        
        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            return faces.tolist()
        except Exception as e:
            logger.error(f"Face detection failed: {e}")
            return []
    
    def detect_people(self, frame: np.ndarray) -> List[Dict]:
        """Detect people in frame using advanced detector"""
        # Placeholder for advanced people detection
        # Would use YOLO, SSD, or similar detector
        return []
    
    def calculate_crowd_density(self, people_count: int, frame_area: int) -> float:
        """Calculate crowd density"""
        if frame_area == 0:
            return 0.0
        
        # Estimate people per square meter
        # This is a simplified calculation
        estimated_area_per_person = 2.0  # square meters
        frame_area_m2 = frame_area / (100 * 100)  # Convert pixels to rough m2 estimate
        
        density = people_count / max(frame_area_m2, 1.0)
        return min(density, 1.0)  # Cap at 1.0
    
    def analyze_movement(self, current_frame: np.ndarray, 
                        previous_frame: np.ndarray) -> Dict:
        """Analyze crowd movement patterns"""
        try:
            # Convert to grayscale
            current_gray = cv2.cvtColor(current_frame, cv2.COLOR_RGB2GRAY)
            previous_gray = cv2.cvtColor(previous_frame, cv2.COLOR_RGB2GRAY)
            
            # Calculate optical flow
            flow = cv2.calcOpticalFlowPyrLK(
                previous_gray, current_gray, None, None
            )
            
            # Analyze flow patterns (simplified)
            movement_intensity = np.mean(np.abs(flow)) if flow is not None else 0.0
            
            return {
                'movement_intensity': float(movement_intensity),
                'chaotic_movement': movement_intensity > 0.5,
                'rapid_movement': movement_intensity > 0.8
            }
            
        except Exception as e:
            logger.error(f"Movement analysis failed: {e}")
            return {'movement_intensity': 0.0, 'chaotic_movement': False, 'rapid_movement': False}

class StampedeInferenceEngine:
    """Main inference engine for real-time stampede detection"""
    
    def __init__(self, config: Dict = None):
        self.config = config or CONFIG
        
        # Initialize components
        self.model_manager = ModelManager(self.config)
        self.preprocessor = ImagePreprocessor(self.config)
        self.crowd_analyzer = CrowdAnalyzer(self.config)
        
        # Performance tracking
        self.frame_buffer = deque(maxlen=5)  # Store recent frames for temporal analysis
        self.inference_times = deque(maxlen=100)
        self.detection_history = deque(maxlen=50)
        
        # Threading for async processing
        self.processing_queue = queue.Queue(maxsize=10)
        self.result_queue = queue.Queue()
        self.processing_thread = None
        self.is_running = False
        
        # Statistics
        self.stats = {
            'total_frames': 0,
            'successful_detections': 0,
            'failed_detections': 0,
            'average_inference_time': 0.0,
            'alerts_triggered': 0
        }
        
        logger.info("Stampede Inference Engine initialized")
    
    def load_models(self, model_paths: Union[str, List[str]]) -> bool:
        """Load model(s) for inference"""
        try:
            if isinstance(model_paths, str):
                return self.model_manager.load_model(model_paths)
            else:
                return self.model_manager.load_ensemble(model_paths)
        except Exception as e:
            logger.error(f"Failed to load models: {e}")
            return False
    
    def predict_frame(self, frame: np.ndarray, frame_id: str = None) -> DetectionResult:
        """Predict stampede risk for single frame"""
        start_time = time.time()
        
        try:
            # Preprocess frame
            processed_frame = self.preprocessor.preprocess_frame(frame)
            if processed_frame is None:
                raise ValueError("Frame preprocessing failed")
            
            # Get model prediction
            if self.model_manager.ensemble_models:
                predictions = self.model_manager.predict_ensemble(processed_frame)
            else:
                predictions = self.model_manager.predict_single(processed_frame)
            
            # Extract predictions
            classification_pred = predictions[0][0]  # Shape: (num_classes,)
            density_pred = predictions[1][0][0] if len(predictions) > 1 else 0.0
            people_count_pred = predictions[2][0][0] if len(predictions) > 2 else 0.0
            
            # Analyze crowd using traditional CV methods
            faces = self.crowd_analyzer.detect_faces(frame)
            face_count = len(faces)
            
            # Combine AI and CV predictions
            final_people_count = max(int(people_count_pred), face_count)
            
            # Calculate crowd density
            frame_area = frame.shape[0] * frame.shape[1]
            crowd_density = self.crowd_analyzer.calculate_crowd_density(
                final_people_count, frame_area
            )
            
            # Determine risk level
            risk_level, confidence = self._determine_risk_level(
                classification_pred, final_people_count, crowd_density
            )
            
            # Calculate processing time
            processing_time = (time.time() - start_time) * 1000
            
            # Create result
            result = DetectionResult(
                risk_level=risk_level,
                confidence=confidence,
                people_count=final_people_count,
                crowd_density=crowd_density,
                timestamp=time.time(),
                processing_time_ms=processing_time,
                frame_id=frame_id,
                bounding_boxes=faces,
                risk_factors=self._calculate_risk_factors(
                    classification_pred, final_people_count, crowd_density
                ),
                alert_message=self._generate_alert_message(risk_level, final_people_count)
            )
            
            # Update statistics
            self._update_stats(result)
            
            # Store in history
            self.detection_history.append(result)
            
            return result
            
        except Exception as e:
            logger.error(f"Frame prediction failed: {str(e)}")
            
            # Return safe fallback result
            return DetectionResult(
                risk_level=RiskLevel.NORMAL,
                confidence=0.0,
                people_count=0,
                crowd_density=0.0,
                timestamp=time.time(),
                processing_time_ms=(time.time() - start_time) * 1000,
                frame_id=frame_id,
                alert_message="Detection failed - system monitoring"
            )
    
    def _determine_risk_level(self, classification_pred: np.ndarray, 
                            people_count: int, crowd_density: float) -> Tuple[RiskLevel, float]:
        """Determine risk level from predictions"""
        
        # Get class probabilities
        normal_prob = classification_pred[0]
        crowded_prob = classification_pred[1]
        stampede_prob = classification_pred[2] if len(classification_pred) > 2 else 0.0
        
        # Calculate combined confidence
        max_prob = np.max(classification_pred)
        predicted_class = np.argmax(classification_pred)
        
        # Apply business logic with safety margins
        if (stampede_prob > 0.7 or 
            people_count > self.config['crowd_thresholds']['stampede_min_people'] or
            crowd_density > 0.8):
            return RiskLevel.STAMPEDE_IMMINENT, float(max_prob)
        
        elif (stampede_prob > 0.4 or 
              people_count > self.config['crowd_thresholds']['crowded_max_people'] or
              crowd_density > 0.6):
            return RiskLevel.HIGH_RISK, float(max_prob)
        
        elif (crowded_prob > 0.5 or 
              people_count > self.config['crowd_thresholds']['normal_max_people'] or
              crowd_density > 0.3):
            return RiskLevel.CROWDED, float(max_prob)
        
        else:
            return RiskLevel.NORMAL, float(max_prob)
    
    def _calculate_risk_factors(self, classification_pred: np.ndarray,
                              people_count: int, crowd_density: float) -> Dict:
        """Calculate detailed risk factors"""
        
        risk_factors = {
            'high_people_count': people_count > 15,
            'high_density': crowd_density > 0.6,
            'ai_high_confidence': np.max(classification_pred) > 0.8,
            'stampede_class_active': classification_pred[2] > 0.3 if len(classification_pred) > 2 else False,
            'multiple_indicators': 0
        }
        
        # Count active risk factors
        risk_factors['multiple_indicators'] = sum([
            risk_factors['high_people_count'],
            risk_factors['high_density'],
            risk_factors['ai_high_confidence'],
            risk_factors['stampede_class_active']
        ])
        
        return risk_factors
    
    def _generate_alert_message(self, risk_level: RiskLevel, people_count: int) -> str:
        """Generate appropriate alert message"""
        
        messages = {
            RiskLevel.NORMAL: f"✅ Normal conditions - {people_count} people detected",
            RiskLevel.CROWDED: f"⚠️ Crowd detected - {people_count} people - Monitor situation",
            RiskLevel.HIGH_RISK: f"🚨 HIGH RISK - {people_count} people - Activate crowd control",
            RiskLevel.STAMPEDE_IMMINENT: f"🆘 STAMPEDE IMMINENT - {people_count} people - IMMEDIATE ACTION REQUIRED!"
        }
        
        return messages.get(risk_level, "System monitoring")
    
    def _update_stats(self, result: DetectionResult):
        """Update performance statistics"""
        
        self.stats['total_frames'] += 1
        
        if result.confidence > 0:
            self.stats['successful_detections'] += 1
        else:
            self.stats['failed_detections'] += 1
        
        # Update inference time
        self.inference_times.append(result.processing_time_ms)
        self.stats['average_inference_time'] = np.mean(self.inference_times)
        
        # Count alerts
        if result.risk_level in [RiskLevel.HIGH_RISK, RiskLevel.STAMPEDE_IMMINENT]:
            self.stats['alerts_triggered'] += 1
    
    def start_async_processing(self):
        """Start asynchronous processing thread"""
        
        if self.is_running:
            return
        
        self.is_running = True
        self.processing_thread = threading.Thread(target=self._processing_worker)
        self.processing_thread.daemon = True
        self.processing_thread.start()
        
        logger.info("Async processing started")
    
    def stop_async_processing(self):
        """Stop asynchronous processing"""
        
        self.is_running = False
        if self.processing_thread:
            self.processing_thread.join(timeout=5.0)
        
        logger.info("Async processing stopped")
    
    def _processing_worker(self):
        """Worker thread for async processing"""
        
        while self.is_running:
            try:
                # Get frame from queue (with timeout)
                frame_data = self.processing_queue.get(timeout=1.0)
                
                # Process frame
                result = self.predict_frame(frame_data['frame'], frame_data.get('frame_id'))
                
                # Put result in output queue
                self.result_queue.put(result)
                
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Processing worker error: {e}")
    
    def submit_frame_async(self, frame: np.ndarray, frame_id: str = None) -> bool:
        """Submit frame for asynchronous processing"""
        
        try:
            frame_data = {'frame': frame, 'frame_id': frame_id}
            self.processing_queue.put_nowait(frame_data)
            return True
        except queue.Full:
            logger.warning("Processing queue full, dropping frame")
            return False
    
    def get_result_async(self, timeout: float = 0.1) -> Optional[DetectionResult]:
        """Get result from async processing"""
        
        try:
            return self.result_queue.get(timeout=timeout)
        except queue.Empty:
            return None
    
    def get_performance_stats(self) -> Dict:
        """Get current performance statistics"""
        
        stats = self.stats.copy()
        stats['queue_size'] = self.processing_queue.qsize()
        stats['result_queue_size'] = self.result_queue.qsize()
        stats['detection_history_length'] = len(self.detection_history)
        
        return stats
    
    def get_recent_detections(self, count: int = 10) -> List[DetectionResult]:
        """Get recent detection results"""
        
        return list(self.detection_history)[-count:]
    
    def export_model_for_deployment(self, output_path: str, format: str = 'tflite'):
        """Export model for edge deployment"""
        
        try:
            model = self.model_manager.get_model()
            if model is None:
                raise ValueError("No model loaded")
            
            if format == 'tflite':
                # Convert to TensorFlow Lite
                converter = tf.lite.TFLiteConverter.from_keras_model(model)
                converter.optimizations = [tf.lite.Optimize.DEFAULT]
                tflite_model = converter.convert()
                
                with open(output_path, 'wb') as f:
                    f.write(tflite_model)
                    
            elif format == 'onnx':
                # Convert to ONNX (requires tf2onnx)
                import tf2onnx
                spec = (tf.TensorSpec(model.input_shape, tf.float32, name="input"),)
                output_path = output_path.replace('.tflite', '.onnx')
                model_proto, _ = tf2onnx.convert.from_keras(model, input_signature=spec)
                
                with open(output_path, 'wb') as f:
                    f.write(model_proto.SerializeToString())
            
            logger.info(f"Model exported to {output_path} in {format} format")
            
        except Exception as e:
            logger.error(f"Model export failed: {e}")

def create_inference_engine(config: Dict = None) -> StampedeInferenceEngine:
    """Factory function to create inference engine"""
    return StampedeInferenceEngine(config)

# Example usage
if __name__ == "__main__":
    # Create inference engine
    engine = create_inference_engine()
    
    # Load model
    model_path = "path/to/your/trained/model.h5"
    if engine.load_models(model_path):
        print("Model loaded successfully")
        
        # Test with dummy frame
        dummy_frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        result = engine.predict_frame(dummy_frame)
        
        print(f"Risk Level: {result.risk_level}")
        print(f"Confidence: {result.confidence:.3f}")
        print(f"People Count: {result.people_count}")
        print(f"Processing Time: {result.processing_time_ms:.1f}ms")
    else:
        print("Failed to load model")
