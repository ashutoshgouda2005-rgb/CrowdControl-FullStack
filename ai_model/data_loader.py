"""
Advanced Data Loading and Preprocessing Pipeline
Handles multiple datasets, augmentation, and efficient data loading
"""

import os
import cv2
import numpy as np
import pandas as pd
import tensorflow as tf
from pathlib import Path
from typing import Tuple, List, Dict, Optional
import albumentations as A
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
import logging
from concurrent.futures import ThreadPoolExecutor
import json

from config import CONFIG

# Set up logging
logging.basicConfig(level=CONFIG['logging']['level'])
logger = logging.getLogger(__name__)

class CrowdDataLoader:
    """
    Advanced data loader for crowd and stampede detection
    Supports multiple datasets, advanced augmentation, and efficient loading
    """
    
    def __init__(self, config: Dict = None):
        self.config = config or CONFIG
        self.input_shape = self.config['model']['input_shape']
        self.num_classes = self.config['model']['num_classes']
        self.class_mapping = self.config['dataset']['class_mapping']
        
        # Initialize augmentation pipeline
        self.train_augmentation = self._create_augmentation_pipeline(training=True)
        self.val_augmentation = self._create_augmentation_pipeline(training=False)
        
        # Data statistics for normalization
        self.mean = np.array([0.485, 0.456, 0.406])  # ImageNet means
        self.std = np.array([0.229, 0.224, 0.225])   # ImageNet stds
        
        logger.info("CrowdDataLoader initialized successfully")
    
    def _create_augmentation_pipeline(self, training: bool = True) -> A.Compose:
        """Create albumentations augmentation pipeline"""
        
        if training:
            # Training augmentations - aggressive but realistic
            transforms = [
                A.Resize(self.input_shape[0], self.input_shape[1]),
                A.HorizontalFlip(p=0.5),
                A.RandomRotate90(p=0.2),
                A.ShiftScaleRotate(
                    shift_limit=0.1,
                    scale_limit=0.2,
                    rotate_limit=15,
                    p=0.5
                ),
                A.RandomBrightnessContrast(
                    brightness_limit=0.2,
                    contrast_limit=0.2,
                    p=0.5
                ),
                A.HueSaturationValue(
                    hue_shift_limit=10,
                    sat_shift_limit=20,
                    val_shift_limit=20,
                    p=0.3
                ),
                A.OneOf([
                    A.MotionBlur(blur_limit=3, p=0.3),
                    A.MedianBlur(blur_limit=3, p=0.3),
                    A.GaussianBlur(blur_limit=3, p=0.3),
                ], p=0.2),
                A.OneOf([
                    A.GaussNoise(var_limit=(10.0, 50.0), p=0.3),
                    A.ISONoise(color_shift=(0.01, 0.05), intensity=(0.1, 0.5), p=0.3),
                ], p=0.2),
                A.CoarseDropout(
                    max_holes=8,
                    max_height=32,
                    max_width=32,
                    min_holes=1,
                    min_height=8,
                    min_width=8,
                    fill_value=0,
                    p=0.2
                ),
                A.Normalize(mean=self.mean, std=self.std),
            ]
        else:
            # Validation augmentations - minimal
            transforms = [
                A.Resize(self.input_shape[0], self.input_shape[1]),
                A.Normalize(mean=self.mean, std=self.std),
            ]
        
        return A.Compose(transforms)
    
    def load_dataset_metadata(self, dataset_path: Path) -> pd.DataFrame:
        """Load and parse dataset metadata"""
        
        metadata_file = dataset_path / "metadata.json"
        if metadata_file.exists():
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
            return pd.DataFrame(metadata['annotations'])
        
        # If no metadata, scan directory structure
        logger.warning(f"No metadata found for {dataset_path}, scanning directory...")
        return self._scan_directory_structure(dataset_path)
    
    def _scan_directory_structure(self, dataset_path: Path) -> pd.DataFrame:
        """Scan directory structure to create metadata"""
        
        data = []
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
        
        for class_dir in dataset_path.iterdir():
            if class_dir.is_dir() and class_dir.name in self.class_mapping.values():
                class_id = [k for k, v in self.class_mapping.items() if v == class_dir.name][0]
                
                for img_file in class_dir.iterdir():
                    if img_file.suffix.lower() in image_extensions:
                        data.append({
                            'image_path': str(img_file),
                            'class_id': class_id,
                            'class_name': class_dir.name,
                            'people_count': self._estimate_people_count(class_id),
                            'density': self._estimate_density(class_id),
                        })
        
        return pd.DataFrame(data)
    
    def _estimate_people_count(self, class_id: int) -> int:
        """Estimate people count based on class"""
        if class_id == 0:  # normal
            return np.random.randint(0, 5)
        elif class_id == 1:  # crowded
            return np.random.randint(6, 20)
        else:  # stampede_risk
            return np.random.randint(21, 100)
    
    def _estimate_density(self, class_id: int) -> float:
        """Estimate crowd density based on class"""
        if class_id == 0:  # normal
            return np.random.uniform(0.0, 0.2)
        elif class_id == 1:  # crowded
            return np.random.uniform(0.2, 0.6)
        else:  # stampede_risk
            return np.random.uniform(0.6, 1.0)
    
    def load_image(self, image_path: str) -> Optional[np.ndarray]:
        """Load and validate image"""
        try:
            # Load image with OpenCV (BGR format)
            image = cv2.imread(image_path)
            if image is None:
                logger.warning(f"Could not load image: {image_path}")
                return None
            
            # Convert BGR to RGB
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Basic validation
            if image.shape[0] < 32 or image.shape[1] < 32:
                logger.warning(f"Image too small: {image_path}")
                return None
            
            return image
            
        except Exception as e:
            logger.error(f"Error loading image {image_path}: {str(e)}")
            return None
    
    def preprocess_batch(self, images: List[np.ndarray], 
                        labels: List[int], 
                        training: bool = True) -> Tuple[np.ndarray, np.ndarray]:
        """Preprocess a batch of images and labels"""
        
        processed_images = []
        processed_labels = []
        
        augmentation = self.train_augmentation if training else self.val_augmentation
        
        for image, label in zip(images, labels):
            if image is not None:
                # Apply augmentation
                augmented = augmentation(image=image)
                processed_image = augmented['image']
                
                processed_images.append(processed_image)
                processed_labels.append(label)
        
        if not processed_images:
            return np.array([]), np.array([])
        
        # Convert to numpy arrays
        X = np.array(processed_images, dtype=np.float32)
        y = tf.keras.utils.to_categorical(processed_labels, num_classes=self.num_classes)
        
        return X, y
    
    def create_data_generators(self, 
                             dataset_df: pd.DataFrame,
                             batch_size: int = 32,
                             validation_split: float = 0.2,
                             test_split: float = 0.1) -> Tuple:
        """Create train, validation, and test data generators"""
        
        # First split: separate test set
        train_val_df, test_df = train_test_split(
            dataset_df,
            test_size=test_split,
            stratify=dataset_df['class_id'],
            random_state=self.config['validation']['random_seed']
        )
        
        # Second split: separate train and validation
        train_df, val_df = train_test_split(
            train_val_df,
            test_size=validation_split / (1 - test_split),
            stratify=train_val_df['class_id'],
            random_state=self.config['validation']['random_seed']
        )
        
        logger.info(f"Dataset split - Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")
        
        # Create generators
        train_gen = self._create_generator(train_df, batch_size, training=True)
        val_gen = self._create_generator(val_df, batch_size, training=False)
        test_gen = self._create_generator(test_df, batch_size, training=False)
        
        return train_gen, val_gen, test_gen, (train_df, val_df, test_df)
    
    def _create_generator(self, df: pd.DataFrame, batch_size: int, training: bool = True):
        """Create a data generator from DataFrame"""
        
        def generator():
            indices = np.arange(len(df))
            if training:
                np.random.shuffle(indices)
            
            for i in range(0, len(indices), batch_size):
                batch_indices = indices[i:i + batch_size]
                batch_df = df.iloc[batch_indices]
                
                images = []
                labels = []
                
                # Load images in parallel
                with ThreadPoolExecutor(max_workers=4) as executor:
                    image_futures = [
                        executor.submit(self.load_image, row['image_path'])
                        for _, row in batch_df.iterrows()
                    ]
                    
                    for future, (_, row) in zip(image_futures, batch_df.iterrows()):
                        image = future.result()
                        if image is not None:
                            images.append(image)
                            labels.append(row['class_id'])
                
                if images:
                    X, y = self.preprocess_batch(images, labels, training)
                    if len(X) > 0:
                        yield X, y
        
        return generator
    
    def compute_class_weights(self, train_df: pd.DataFrame) -> Dict[int, float]:
        """Compute class weights for imbalanced dataset"""
        
        class_counts = train_df['class_id'].value_counts().sort_index()
        total_samples = len(train_df)
        
        # Compute weights inversely proportional to class frequency
        class_weights = {}
        for class_id in range(self.num_classes):
            if class_id in class_counts.index:
                weight = total_samples / (self.num_classes * class_counts[class_id])
                # Apply safety multiplier for critical classes
                if class_id == 2:  # stampede_risk
                    weight *= self.config['metrics']['class_weights'][class_id]
                class_weights[class_id] = weight
            else:
                class_weights[class_id] = 1.0
        
        logger.info(f"Computed class weights: {class_weights}")
        return class_weights
    
    def create_tf_dataset(self, generator_func, batch_size: int, 
                         training: bool = True) -> tf.data.Dataset:
        """Create optimized TensorFlow dataset"""
        
        # Define output signature
        output_signature = (
            tf.TensorSpec(shape=(None, *self.input_shape), dtype=tf.float32),
            tf.TensorSpec(shape=(None, self.num_classes), dtype=tf.float32)
        )
        
        # Create dataset from generator
        dataset = tf.data.Dataset.from_generator(
            generator_func,
            output_signature=output_signature
        )
        
        if training:
            # Shuffle and repeat for training
            dataset = dataset.shuffle(buffer_size=100)
            dataset = dataset.repeat()
        
        # Optimize performance
        dataset = dataset.prefetch(tf.data.AUTOTUNE)
        
        return dataset
    
    def load_synthetic_data(self, num_samples: int = 1000) -> pd.DataFrame:
        """Generate synthetic crowd data for augmentation"""
        
        synthetic_data = []
        
        for i in range(num_samples):
            # Generate synthetic metadata
            class_id = np.random.choice([0, 1, 2], p=[0.5, 0.3, 0.2])  # Bias towards normal
            people_count = self._estimate_people_count(class_id)
            density = self._estimate_density(class_id)
            
            synthetic_data.append({
                'image_path': f'synthetic_{i:06d}.jpg',
                'class_id': class_id,
                'class_name': self.class_mapping[class_id],
                'people_count': people_count,
                'density': density,
                'synthetic': True
            })
        
        return pd.DataFrame(synthetic_data)
    
    def validate_dataset(self, dataset_df: pd.DataFrame) -> Dict:
        """Validate dataset quality and statistics"""
        
        validation_results = {
            'total_samples': len(dataset_df),
            'class_distribution': dataset_df['class_id'].value_counts().to_dict(),
            'missing_files': 0,
            'corrupted_files': 0,
            'valid_samples': 0
        }
        
        # Check file existence and validity
        for _, row in dataset_df.iterrows():
            if not os.path.exists(row['image_path']):
                validation_results['missing_files'] += 1
            else:
                image = self.load_image(row['image_path'])
                if image is None:
                    validation_results['corrupted_files'] += 1
                else:
                    validation_results['valid_samples'] += 1
        
        # Calculate statistics
        validation_results['data_quality'] = (
            validation_results['valid_samples'] / validation_results['total_samples']
        )
        
        logger.info(f"Dataset validation results: {validation_results}")
        return validation_results

def create_crowd_dataloader(config: Dict = None) -> CrowdDataLoader:
    """Factory function to create data loader"""
    return CrowdDataLoader(config)

# Example usage and testing
if __name__ == "__main__":
    # Initialize data loader
    data_loader = create_crowd_dataloader()
    
    # Test with sample data
    sample_data = data_loader.load_synthetic_data(100)
    print(f"Generated {len(sample_data)} synthetic samples")
    
    # Validate dataset
    validation_results = data_loader.validate_dataset(sample_data)
    print(f"Dataset validation: {validation_results}")
