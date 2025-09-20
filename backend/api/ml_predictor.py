import logging
import os
import numpy as np
from django.conf import settings

logger = logging.getLogger(__name__)

# Try to import TensorFlow with fallback
try:
    import tensorflow.compat.v1 as tf
    tf.disable_v2_behavior()
    TF_AVAILABLE = True
except ImportError:
    try:
        import tensorflow as tf
        TF_AVAILABLE = True
    except ImportError:
        logger.warning("TensorFlow not available. ML predictions will use demo mode.")
        TF_AVAILABLE = False

# Try to import OpenCV with fallback
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    logger.warning("OpenCV not available. Using demo mode for image processing.")
    CV2_AVAILABLE = False

from PIL import Image
from io import BytesIO
from base64 import b64decode

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
        # Don't load model immediately to prevent startup errors
        # Load on first use instead
    
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
        """Preprocess image for model prediction"""
        try:
            # Convert image data to numpy array
            if isinstance(image_data, str):
                # Base64 encoded image
                image_data = base64.b64decode(image_data)
            
            # Convert to PIL Image
            if isinstance(image_data, bytes):
                image = Image.open(BytesIO(image_data))
                image = np.array(image)
            else:
                image = image_data
            
            # Convert to grayscale if needed
            if len(image.shape) == 3:
                if CV2_AVAILABLE:
                    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
                else:
                    # Fallback grayscale conversion
                    gray = np.dot(image[...,:3], [0.2989, 0.5870, 0.1140])
            else:
                gray = image
            
            # Resize to 100x100
            if CV2_AVAILABLE:
                resized = cv2.resize(gray, (100, 100))
            else:
                # Fallback resize using PIL
                from PIL import Image as PILImage
                pil_img = PILImage.fromarray(gray.astype('uint8'))
                pil_img = pil_img.resize((100, 100))
                resized = np.array(pil_img)
            
            img_flat = resized.flatten().astype('float32').reshape(1, -1)
            
            return img_flat, gray, image
            
        except Exception as e:
            print(f"Error preprocessing image: {str(e)}")
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
        if not self.model_loaded:
            # Try to load model on first use
            if not self.load_model():
                return {
                    'error': 'Model not available - running in demo mode',
                    'crowd_detected': True,  # Demo data
                    'confidence_score': 1.5,
                    'people_count': 3,
                    'is_stampede_risk': False
                }
        
        try:
            # Preprocess image
            img_flat, gray, original = self.preprocess_image(image_data)
            if img_flat is None:
                return {
                    'error': 'Image preprocessing failed',
                    'crowd_detected': False,
                    'confidence_score': 0.0,
                    'people_count': 0,
                    'is_stampede_risk': False
                }
            
            # Get compressed representation from autoencoder
            compressed = self.sess.run(self.hid_layer3, feed_dict={self.X: img_flat})
            
            # Reshape for CNN input
            reshaped = []
            for j in range(0, 2500, 50):
                temp = [[compressed[0][k]] for k in range(j, j + 50)]
                reshaped.append(temp)
            final_input = np.expand_dims(np.array(reshaped), axis=0)  # Shape: [1, 50, 50, 1]
            
            # Get prediction from CNN
            result = self.sess.run(self.out_final, feed_dict={self.Xtrain: final_input})[0][0]
            
            # Detect faces for people counting
            faces = self.detect_faces(gray)
            num_people = len(faces)
            
            # Determine crowd status
            crowd_detected = result > 1.0 or num_people >= 3
            is_stampede_risk = result > 2.0 or num_people >= 5
            
            return {
                'crowd_detected': crowd_detected,
                'confidence_score': float(result),
                'people_count': num_people,
                'is_stampede_risk': is_stampede_risk,
                'faces_coordinates': faces.tolist() if len(faces) > 0 else []
            }
            
        except Exception as e:
            print(f"Error in crowd prediction: {str(e)}")
            return {
                'error': str(e),
                'crowd_detected': False,
                'confidence_score': 0.0,
                'people_count': 0,
                'is_stampede_risk': False
            }
    
    def predict_from_file(self, file_path):
        """Predict crowd status from image file"""
        try:
            image = cv2.imread(file_path)
            if image is None:
                return {
                    'error': 'Could not load image file',
                    'crowd_detected': False,
                    'confidence_score': 0.0,
                    'people_count': 0,
                    'is_stampede_risk': False
                }
            
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
    """Get or create predictor instance"""
    global predictor
    if predictor is None:
        predictor = CrowdPredictor()
    return predictor
