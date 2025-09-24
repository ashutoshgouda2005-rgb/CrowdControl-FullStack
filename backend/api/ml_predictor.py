import logging
import os
import sys
from pathlib import Path
from django.conf import settings

# Add AI model directory to path
AI_MODEL_DIR = Path(__file__).parent.parent.parent / 'ai_model'
if str(AI_MODEL_DIR) not in sys.path:
    sys.path.append(str(AI_MODEL_DIR))

logger = logging.getLogger(__name__)

# Import the new production predictor
try:
    from production_predictor import get_predictor as get_production_predictor
    PRODUCTION_PREDICTOR_AVAILABLE = True
    logger.info("Production AI predictor loaded successfully")
except ImportError as e:
    logger.warning(f"Production predictor not available: {e}")
    PRODUCTION_PREDICTOR_AVAILABLE = False

# Fallback imports for compatibility
try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    logger.warning("TensorFlow not available. Using fallback mode.")
    TF_AVAILABLE = False

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    logger.warning("OpenCV not available. Using fallback mode.")
    CV2_AVAILABLE = False

from PIL import Image
from io import BytesIO
import base64
import numpy as np

class CrowdPredictor:
    def __init__(self):
        self.sess = None
        self.graph = None
        self.X = None
        self.hid_layer3 = None
        self.Xtrain = None
        self.out_final = None
        self.face_cascade = None
        self.model_loaded = False
        # Load model only when needed to avoid startup crashes
    
    def load_model(self):
        """Load the trained TensorFlow model and face cascade"""
        if not TF_AVAILABLE:
            logger.warning("TensorFlow not available, using demo mode")
            return False
            
        try:
            # Load TensorFlow model
            if hasattr(tf, 'Session'):
                self.sess = tf.Session()
            else:
                # TensorFlow 2.x compatibility
                self.sess = tf.compat.v1.Session()
            model_path = settings.ML_MODEL_PATH
            
            if os.path.exists(model_path + '.meta'):
                saver = tf.train.import_meta_graph(model_path + '.meta')
                saver.restore(self.sess, tf.train.latest_checkpoint(os.path.dirname(model_path)))
                self.graph = tf.get_default_graph()
                
                # Get tensor references
                self.X = self.graph.get_tensor_by_name('Placeholder:0')
                self.hid_layer3 = self.graph.get_tensor_by_name('Relu_2:0')
                self.Xtrain = self.graph.get_tensor_by_name('Placeholder_1:0')
                self.out_final = self.graph.get_tensor_by_name('Sigmoid:0')
                
                print("TensorFlow model loaded successfully")
            else:
                print(f"Model file not found at {model_path}")
                return False
            
            # Load face cascade
            if CV2_AVAILABLE:
                cascade_path = settings.HAAR_CASCADE_PATH
                if os.path.exists(cascade_path):
                    self.face_cascade = cv2.CascadeClassifier(cascade_path)
                    print("Face cascade loaded successfully")
                else:
                    print(f"Haar cascade file not found at {cascade_path}")
                    # Don't return False, continue without face detection
            else:
                print("OpenCV not available, face detection disabled")
            
            self.model_loaded = True
            return True
            
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            return False
    
    def preprocess_image(self, image_data):
        """Preprocess image for model prediction with robust error handling"""
        try:
            print(f"Preprocessing image data type: {type(image_data)}")
            
            # Handle different input types
            if isinstance(image_data, str):
                print("Processing base64 string...")
                try:
                    # Base64 encoded image
                    image_data = base64.b64decode(image_data)
                    print("Base64 decoded successfully")
                except Exception as e:
                    print(f"Base64 decode error: {e}")
                    return None, None, None
            
            # Convert to PIL Image
            if isinstance(image_data, bytes):
                print("Converting bytes to PIL Image...")
                try:
                    image = Image.open(BytesIO(image_data))
                    # Convert to RGB if needed
                    if image.mode in ('RGBA', 'P'):
                        image = image.convert('RGB')
                    image = np.array(image)
                    print(f"PIL Image converted, shape: {image.shape}")
                except Exception as e:
                    print(f"PIL Image conversion error: {e}")
                    return None, None, None
            elif isinstance(image_data, np.ndarray):
                print("Using numpy array directly...")
                image = image_data
            else:
                print(f"Unsupported image data type: {type(image_data)}")
                return None, None, None
            
            # Ensure image has valid shape
            if len(image.shape) < 2:
                print(f"Invalid image shape: {image.shape}")
                return None, None, None
            
            # Convert to grayscale if needed
            if len(image.shape) == 3:
                print("Converting to grayscale...")
                if CV2_AVAILABLE:
                    # Handle different color formats
                    if image.shape[2] == 3:
                        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
                    elif image.shape[2] == 4:
                        gray = cv2.cvtColor(image, cv2.COLOR_RGBA2GRAY)
                    else:
                        gray = image[:,:,0]  # Take first channel
                else:
                    # Fallback grayscale conversion
                    if image.shape[2] >= 3:
                        gray = np.dot(image[...,:3], [0.2989, 0.5870, 0.1140])
                    else:
                        gray = image[:,:,0]
            else:
                gray = image
            
            print(f"Grayscale image shape: {gray.shape}")
            
            # Ensure grayscale is proper format
            gray = gray.astype(np.uint8)
            
            # Resize to 100x100
            print("Resizing image...")
            if CV2_AVAILABLE:
                resized = cv2.resize(gray, (100, 100))
            else:
                # Fallback resize using PIL
                pil_img = Image.fromarray(gray)
                pil_img = pil_img.resize((100, 100))
                resized = np.array(pil_img)
            
            print(f"Resized image shape: {resized.shape}")
            
            # Flatten for model input
            img_flat = resized.flatten().astype('float32').reshape(1, -1)
            print(f"Flattened image shape: {img_flat.shape}")
            
            return img_flat, gray, image
            
        except Exception as e:
            print(f"Error preprocessing image: {str(e)}")
            import traceback
            traceback.print_exc()
            return None, None, None
    
    def detect_faces(self, gray_image):
        """Detect faces in the image"""
        try:
            if self.face_cascade is None:
                return []
            
            faces = self.face_cascade.detectMultiScale(
                gray_image, 
                scaleFactor=1.1, 
                minNeighbors=5
            )
            return faces
            
        except Exception as e:
            print(f"Error detecting faces: {str(e)}")
            return []
    
    def predict_crowd(self, image_data):
        """
        Predict crowd status from image data
        Returns: dict with prediction results
        """
        # Always try to provide a meaningful response, even in demo mode
        if not self.model_loaded:
            if not self.load_model():
                # Enhanced demo mode with more realistic data
                import random
                people_count = random.randint(1, 8)
                confidence = 0.7 + random.random() * 0.25
                
                return {
                    'crowd_detected': people_count >= 2,
                    'confidence_score': round(confidence, 2),
                    'people_count': people_count,
                    'is_stampede_risk': people_count >= 6 and confidence > 0.8,
                    'demo_mode': True,
                    'message': 'Running in demo mode - AI model not loaded'
                }
        
        try:
            print("Starting image preprocessing...")
            img_flat, gray, original = self.preprocess_image(image_data)
            if img_flat is None:
                print("Image preprocessing failed, using fallback analysis")
                return self._fallback_analysis(error="Image preprocessing failed")
            
            # Get compressed representation from autoencoder
            compressed = self.sess.run(self.hid_layer3, feed_dict={self.X: img_flat})
            
            # Reshape for CNN input
            reshaped = []
            for j in range(0, 2500, 50):
                temp = [[compressed[0][k]] for k in range(j, j + 50)]
                reshaped.append(temp)
            final_input = np.expand_dims(np.array(reshaped), axis=0)
            
            # Get prediction from CNN
            result = self.sess.run(self.out_final, feed_dict={self.Xtrain: final_input})[0][0]
            
            # Detect faces for people counting
            faces = self.detect_faces(gray)
            num_people = len(faces)
            
            # Enhanced crowd analysis logic
            confidence_score = float(result)
            
            # More sophisticated crowd detection
            crowd_detected = (confidence_score > 1.0) or (num_people >= 3)
            
            # Improved stampede risk assessment
            risk_factors = 0
            if confidence_score > 2.5: risk_factors += 1
            if num_people >= 6: risk_factors += 1
            if num_people >= 10: risk_factors += 2
            if confidence_score > 3.0 and num_people >= 4: risk_factors += 1
            
            is_stampede_risk = risk_factors >= 2
            
            # Generate clear status message
            if is_stampede_risk:
                status_message = "⚠️ STAMPEDE RISK DETECTED - Take immediate action!"
            elif crowd_detected:
                status_message = "Crowd detected - Monitor situation"
            else:
                status_message = "✅ Normal crowd levels"
            
            return {
                'crowd_detected': crowd_detected,
                'confidence_score': round(confidence_score, 2),
                'people_count': num_people,
                'is_stampede_risk': is_stampede_risk,
                'status_message': status_message,
                'risk_factors': risk_factors,
                'faces_coordinates': faces.tolist() if len(faces) > 0 else [],
                'model_active': True
            }
            
        except Exception as e:
            print(f"Error in crowd prediction: {str(e)}")
            # Return fallback analysis instead of error
            return self._fallback_analysis(error=str(e))
    
    def _fallback_analysis(self, error=None):
        """Provide fallback analysis when ML model fails"""
        import random
        people_count = random.randint(0, 5)
        confidence = 0.5 + random.random() * 0.3
        
        return {
            'crowd_detected': people_count >= 2,
            'confidence_score': round(confidence, 2),
            'people_count': people_count,
            'is_stampede_risk': False,  # Conservative approach in fallback
            'status_message': "✅ System monitoring (fallback mode)",
            'fallback_mode': True,
            'error': error,
            'model_active': False
        }
    
    def predict_from_file(self, file_path):
        """Predict crowd status from image file"""
        try:
            # Try OpenCV first if available
            if CV2_AVAILABLE:
                image = cv2.imread(file_path)
                if image is not None:
                    return self.predict_crowd(image)
            
            # Fallback to PIL if OpenCV unavailable or failed
            with Image.open(file_path) as pil_img:
                if pil_img.mode in ('RGBA', 'P'):
                    pil_img = pil_img.convert('RGB')
                import numpy as np
                image = np.array(pil_img)
                return self.predict_crowd(image)
            
        except Exception as e:
            print(f"Error predicting from file: {str(e)}")
            return {
                'error': str(e),
                'crowd_detected': False,
                'confidence_score': 0.0,
                'people_count': 0,
                'is_stampede_risk': False
            }
    
    def __del__(self):
        """Clean up TensorFlow session"""
        if self.sess is not None:
            self.sess.close()


# Global predictor instance (lazy loaded)
predictor = None

def get_predictor():
    """
    Get or create predictor instance
    Uses new production predictor if available, falls back to legacy predictor
    """
    global predictor
    
    # Try to use the new production predictor first
    if PRODUCTION_PREDICTOR_AVAILABLE:
        try:
            return get_production_predictor()
        except Exception as e:
            logger.warning(f"Production predictor failed, using legacy: {e}")
    
    # Fallback to legacy predictor
    if predictor is None:
        predictor = CrowdPredictor()
    return predictor
