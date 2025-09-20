"""
Production-Ready Stampede Predictor
Replaces the old ml_predictor.py with modern, robust architecture
"""

import os
import cv2
import numpy as np
import tensorflow as tf
from pathlib import Path
import logging
from typing import Dict, List, Tuple, Optional, Union
import time
from base64 import b64decode
from PIL import Image
from io import BytesIO
import json
import threading
from collections import deque

from inference_engine import create_inference_engine, RiskLevel, DetectionResult
from config import CONFIG

logger = logging.getLogger(__name__)

class ProductionStampedePredictor:
    """
    Production-ready stampede predictor that replaces the old CrowdPredictor
    Features:
    - Modern TensorFlow 2.x support
    - Robust error handling and fallbacks
    - Real-time performance optimization
    - Comprehensive logging and monitoring
    - Multiple model support (ensemble)
    """
    
    def __init__(self, config: Dict = None):
        self.config = config or CONFIG
        
        # Initialize inference engine
        self.inference_engine = create_inference_engine(self.config)
        
        # Model loading state
        self.model_loaded = False
        self.model_path = None
        self.fallback_mode = False
        
        # Performance tracking
        self.prediction_count = 0
        self.total_inference_time = 0.0
        self.recent_predictions = deque(maxlen=100)
        
        # Thread safety
        self.prediction_lock = threading.Lock()
        
        # Initialize model loading
        self._initialize_models()
        
        logger.info("ProductionStampedePredictor initialized")
    
    def _initialize_models(self):
        """Initialize and load models with fallback handling"""
        try:
            # Try to load the primary model
            model_paths = self._get_model_paths()
            
            if model_paths:
                success = self.inference_engine.load_models(model_paths)
                if success:
                    self.model_loaded = True
                    self.fallback_mode = False
                    logger.info("AI models loaded successfully")
                else:
                    self._enable_fallback_mode("Model loading failed")
            else:
                self._enable_fallback_mode("No model files found")
                
        except Exception as e:
            logger.error(f"Model initialization failed: {str(e)}")
            self._enable_fallback_mode(f"Initialization error: {str(e)}")
    
    def _get_model_paths(self) -> List[str]:
        """Get available model paths"""
        model_paths = []
        
        # Check for ensemble models
        ensemble_dir = self.config['paths']['ensemble_models']
        if os.path.exists(ensemble_dir):
            for model_file in Path(ensemble_dir).glob("*.h5"):
                model_paths.append(str(model_file))
        
        # Check for single best model
        best_model_path = self.config['paths']['best_model']
        if os.path.exists(best_model_path):
            model_paths.append(str(best_model_path))
        
        # Check for latest checkpoint
        checkpoint_path = self.config['paths']['latest_checkpoint']
        if os.path.exists(checkpoint_path):
            model_paths.append(str(checkpoint_path))
        
        return model_paths
    
    def _enable_fallback_mode(self, reason: str):
        """Enable fallback mode with enhanced demo predictions"""
        self.fallback_mode = True
        self.model_loaded = False
        logger.warning(f"Fallback mode enabled: {reason}")
    
    def load_model(self, model_path: str = None) -> bool:
        """
        Load a specific model or reload default models
        Compatible with the old interface
        """
        try:
            if model_path:
                success = self.inference_engine.load_models(model_path)
            else:
                self._initialize_models()
                success = self.model_loaded
            
            if success:
                self.model_loaded = True
                self.fallback_mode = False
                self.model_path = model_path
                logger.info(f"Model loaded: {model_path or 'default models'}")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            self._enable_fallback_mode(f"Load error: {str(e)}")
            return False
    
    def preprocess_image(self, image_data: Union[str, bytes, np.ndarray]) -> Optional[np.ndarray]:
        """
        Preprocess image data for prediction
        Compatible with old interface but with modern implementation
        """
        try:
            # Handle different input types
            if isinstance(image_data, str):
                # Base64 encoded image
                try:
                    image_data = b64decode(image_data)
                except Exception as e:
                    logger.error(f"Base64 decode failed: {e}")
                    return None
            
            if isinstance(image_data, bytes):
                # Convert bytes to PIL Image then to numpy
                try:
                    pil_image = Image.open(BytesIO(image_data))
                    image_array = np.array(pil_image)
                except Exception as e:
                    logger.error(f"Image conversion failed: {e}")
                    return None
            elif isinstance(image_data, np.ndarray):
                image_array = image_data
            else:
                logger.error(f"Unsupported image data type: {type(image_data)}")
                return None
            
            # Validate image
            if image_array is None or image_array.size == 0:
                logger.error("Empty or invalid image")
                return None
            
            # Ensure RGB format
            if len(image_array.shape) == 3:
                if image_array.shape[2] == 4:  # RGBA
                    image_array = image_array[:, :, :3]
                elif image_array.shape[2] == 1:  # Grayscale
                    image_array = np.repeat(image_array, 3, axis=2)
            elif len(image_array.shape) == 2:  # Grayscale
                image_array = np.stack([image_array] * 3, axis=2)
            
            return image_array
            
        except Exception as e:
            logger.error(f"Image preprocessing failed: {str(e)}")
            return None
    
    def detect_faces(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces using OpenCV (fallback method)
        Compatible with old interface
        """
        try:
            # Use the crowd analyzer from inference engine
            faces = self.inference_engine.crowd_analyzer.detect_faces(image)
            return faces
        except Exception as e:
            logger.error(f"Face detection failed: {str(e)}")
            return []
    
    def predict_crowd(self, image_data: Union[str, bytes, np.ndarray]) -> Dict:
        """
        Main prediction method - compatible with old interface
        Returns comprehensive crowd analysis results
        """
        start_time = time.time()
        
        with self.prediction_lock:
            try:
                # Preprocess image
                image_array = self.preprocess_image(image_data)
                if image_array is None:
                    return self._fallback_prediction("Image preprocessing failed")
                
                # Get prediction from inference engine
                if self.model_loaded and not self.fallback_mode:
                    try:
                        result = self.inference_engine.predict_frame(image_array)
                        prediction_dict = self._convert_result_to_dict(result)
                    except Exception as e:
                        logger.error(f"AI prediction failed: {str(e)}")
                        prediction_dict = self._fallback_prediction(f"AI error: {str(e)}")
                else:
                    prediction_dict = self._fallback_prediction("Model not loaded")
                
                # Update statistics
                self._update_prediction_stats(start_time)
                
                return prediction_dict
                
            except Exception as e:
                logger.error(f"Prediction failed: {str(e)}")
                return self._fallback_prediction(f"Critical error: {str(e)}")
    
    def _convert_result_to_dict(self, result: DetectionResult) -> Dict:
        """Convert DetectionResult to dictionary format (old interface compatibility)"""
        
        # Map risk levels to boolean flags
        crowd_detected = result.risk_level != RiskLevel.NORMAL
        is_stampede_risk = result.risk_level in [RiskLevel.HIGH_RISK, RiskLevel.STAMPEDE_IMMINENT]
        
        # Create response dictionary
        response = {
            'crowd_detected': crowd_detected,
            'confidence_score': round(result.confidence, 3),
            'people_count': result.people_count,
            'is_stampede_risk': is_stampede_risk,
            'status_message': result.alert_message,
            'model_active': True,
            'processing_time_ms': round(result.processing_time_ms, 1),
            'timestamp': result.timestamp,
            
            # Enhanced fields
            'risk_level': result.risk_level.value,
            'crowd_density': round(result.crowd_density, 3),
            'risk_factors': result.risk_factors or {},
            'bounding_boxes': result.bounding_boxes or [],
            'frame_id': result.frame_id,
            
            # System status
            'fallback_mode': False,
            'demo_mode': False,
            'model_version': self.config.get('env', {}).get('MODEL_VERSION', 'v2.0'),
        }
        
        return response
    
    def _fallback_prediction(self, error_message: str = None) -> Dict:
        """
        Enhanced fallback prediction with realistic crowd simulation
        Much more sophisticated than the old demo mode
        """
        
        # Simulate realistic crowd scenarios
        import random
        
        # Time-based variation for more realistic simulation
        time_factor = (time.time() % 3600) / 3600  # Hour-based cycle
        base_crowd_level = 0.3 + 0.4 * np.sin(time_factor * 2 * np.pi)
        
        # Generate realistic people count
        if base_crowd_level < 0.3:
            people_count = random.randint(0, 5)
            risk_prob = 0.05
        elif base_crowd_level < 0.6:
            people_count = random.randint(3, 15)
            risk_prob = 0.15
        else:
            people_count = random.randint(10, 25)
            risk_prob = 0.25
        
        # Determine risk level
        risk_roll = random.random()
        if risk_roll < risk_prob * 0.1:  # Very rare stampede risk in demo
            is_stampede_risk = True
            crowd_detected = True
            confidence = 0.85 + random.random() * 0.1
            status_message = f"⚠️ DEMO: Simulated stampede risk - {people_count} people detected"
            risk_level = "stampede_imminent"
        elif risk_roll < risk_prob:
            is_stampede_risk = False
            crowd_detected = True
            confidence = 0.7 + random.random() * 0.2
            status_message = f"👥 DEMO: Crowd simulation - {people_count} people detected"
            risk_level = "crowded"
        else:
            is_stampede_risk = False
            crowd_detected = people_count >= 3
            confidence = 0.6 + random.random() * 0.3
            status_message = f"✅ DEMO: Normal simulation - {people_count} people detected"
            risk_level = "normal" if not crowd_detected else "crowded"
        
        # Calculate simulated density
        crowd_density = min(people_count / 20.0, 1.0)
        
        # Create realistic risk factors
        risk_factors = {
            'high_people_count': people_count > 15,
            'high_density': crowd_density > 0.6,
            'ai_high_confidence': confidence > 0.8,
            'stampede_class_active': is_stampede_risk,
            'multiple_indicators': sum([
                people_count > 15,
                crowd_density > 0.6,
                confidence > 0.8,
                is_stampede_risk
            ])
        }
        
        return {
            'crowd_detected': crowd_detected,
            'confidence_score': round(confidence, 3),
            'people_count': people_count,
            'is_stampede_risk': is_stampede_risk,
            'status_message': status_message,
            'model_active': False,
            'processing_time_ms': round(random.uniform(50, 150), 1),
            'timestamp': time.time(),
            
            # Enhanced fields
            'risk_level': risk_level,
            'crowd_density': round(crowd_density, 3),
            'risk_factors': risk_factors,
            'bounding_boxes': self._generate_fake_bounding_boxes(people_count),
            
            # System status
            'fallback_mode': True,
            'demo_mode': True,
            'error': error_message,
            'model_version': 'fallback_v2.0',
        }
    
    def _generate_fake_bounding_boxes(self, people_count: int) -> List[List[int]]:
        """Generate realistic fake bounding boxes for demo mode"""
        boxes = []
        
        for _ in range(min(people_count, 10)):  # Limit to 10 boxes for performance
            x = np.random.randint(50, 550)
            y = np.random.randint(50, 400)
            w = np.random.randint(40, 80)
            h = np.random.randint(60, 120)
            boxes.append([x, y, w, h])
        
        return boxes
    
    def predict_from_file(self, file_path: str) -> Dict:
        """
        Predict from image file - compatible with old interface
        """
        try:
            # Load image file
            if not os.path.exists(file_path):
                return self._fallback_prediction(f"File not found: {file_path}")
            
            # Read image with OpenCV
            image = cv2.imread(file_path)
            if image is None:
                return self._fallback_prediction(f"Could not load image: {file_path}")
            
            # Convert BGR to RGB
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Use main prediction method
            return self.predict_crowd(image)
            
        except Exception as e:
            logger.error(f"File prediction failed: {str(e)}")
            return self._fallback_prediction(f"File error: {str(e)}")
    
    def _update_prediction_stats(self, start_time: float):
        """Update prediction statistics"""
        
        inference_time = time.time() - start_time
        self.prediction_count += 1
        self.total_inference_time += inference_time
        
        # Store recent prediction time
        self.recent_predictions.append({
            'timestamp': time.time(),
            'inference_time': inference_time,
            'model_active': self.model_loaded and not self.fallback_mode
        })
    
    def get_performance_stats(self) -> Dict:
        """Get comprehensive performance statistics"""
        
        if self.prediction_count == 0:
            return {
                'total_predictions': 0,
                'average_inference_time': 0.0,
                'model_loaded': self.model_loaded,
                'fallback_mode': self.fallback_mode
            }
        
        recent_times = [p['inference_time'] for p in self.recent_predictions]
        
        stats = {
            'total_predictions': self.prediction_count,
            'average_inference_time': self.total_inference_time / self.prediction_count,
            'recent_average_time': np.mean(recent_times) if recent_times else 0.0,
            'model_loaded': self.model_loaded,
            'fallback_mode': self.fallback_mode,
            'model_path': self.model_path,
            'recent_predictions_count': len(self.recent_predictions),
            'predictions_per_minute': len([
                p for p in self.recent_predictions 
                if time.time() - p['timestamp'] < 60
            ])
        }
        
        # Add inference engine stats if available
        if hasattr(self.inference_engine, 'get_performance_stats'):
            engine_stats = self.inference_engine.get_performance_stats()
            stats.update({f'engine_{k}': v for k, v in engine_stats.items()})
        
        return stats
    
    def get_model_info(self) -> Dict:
        """Get model information and status"""
        
        return {
            'model_loaded': self.model_loaded,
            'fallback_mode': self.fallback_mode,
            'model_path': self.model_path,
            'config_version': self.config.get('env', {}).get('MODEL_VERSION', 'v2.0'),
            'available_models': self._get_model_paths(),
            'tensorflow_version': tf.__version__,
            'gpu_available': len(tf.config.list_physical_devices('GPU')) > 0,
            'performance_stats': self.get_performance_stats()
        }
    
    def reload_models(self) -> bool:
        """Reload models (useful for hot-swapping)"""
        
        logger.info("Reloading models...")
        
        # Reset state
        self.model_loaded = False
        self.fallback_mode = False
        
        # Reinitialize
        self._initialize_models()
        
        return self.model_loaded
    
    def __del__(self):
        """Cleanup resources"""
        try:
            if hasattr(self.inference_engine, 'stop_async_processing'):
                self.inference_engine.stop_async_processing()
        except:
            pass

# Global predictor instance (lazy loaded) - compatible with old interface
_predictor_instance = None

def get_predictor() -> ProductionStampedePredictor:
    """
    Get or create predictor instance - compatible with old interface
    """
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = ProductionStampedePredictor()
    return _predictor_instance

# Backward compatibility aliases
CrowdPredictor = ProductionStampedePredictor

# Example usage and testing
if __name__ == "__main__":
    # Test the new predictor
    predictor = get_predictor()
    
    print("=== Production Stampede Predictor Test ===")
    print(f"Model loaded: {predictor.model_loaded}")
    print(f"Fallback mode: {predictor.fallback_mode}")
    
    # Test with dummy data
    dummy_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    result = predictor.predict_crowd(dummy_image)
    
    print("\n=== Prediction Result ===")
    for key, value in result.items():
        print(f"{key}: {value}")
    
    # Performance stats
    print("\n=== Performance Stats ===")
    stats = predictor.get_performance_stats()
    for key, value in stats.items():
        print(f"{key}: {value}")
    
    # Model info
    print("\n=== Model Info ===")
    info = predictor.get_model_info()
    for key, value in info.items():
        print(f"{key}: {value}")
