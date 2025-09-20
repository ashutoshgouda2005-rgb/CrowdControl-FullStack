"""
Complete Model Training Script
Execute this to train the stampede detection model from scratch
"""

import os
import sys
import argparse
import logging
from pathlib import Path
import json
import time
from datetime import datetime

# Add current directory to path for imports
sys.path.append(str(Path(__file__).parent))

from config import CONFIG
from training_pipeline import create_training_pipeline
from data_loader import create_crowd_dataloader
from model_architecture import create_stampede_model

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(f'training_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
    ]
)
logger = logging.getLogger(__name__)

def setup_training_environment():
    """Setup training environment and dependencies"""
    
    logger.info("Setting up training environment...")
    
    # Create necessary directories
    directories = [
        CONFIG['paths']['models_dir'],
        CONFIG['paths']['logs_dir'],
        CONFIG['paths']['checkpoints_dir'],
        CONFIG['dataset']['data_sources']['images'],
        CONFIG['dataset']['data_sources']['annotations'],
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        logger.info(f"Created directory: {directory}")
    
    # Check GPU availability
    import tensorflow as tf
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        logger.info(f"Found {len(gpus)} GPU(s): {[gpu.name for gpu in gpus]}")
        
        # Configure GPU memory growth
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
    else:
        logger.warning("No GPUs found. Training will use CPU (slower).")
    
    # Set mixed precision if enabled
    if CONFIG['training']['mixed_precision']:
        policy = tf.keras.mixed_precision.Policy('mixed_float16')
        tf.keras.mixed_precision.set_global_policy(policy)
        logger.info("Mixed precision training enabled")
    
    return True

def create_sample_dataset():
    """Create a sample dataset for testing if no real data is available"""
    
    logger.info("Creating sample dataset for testing...")
    
    import numpy as np
    import cv2
    from PIL import Image
    
    # Create sample images directory
    sample_dir = Path(CONFIG['dataset']['data_sources']['images']) / 'sample'
    sample_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate sample images for each class
    class_names = ['normal', 'crowded', 'stampede_risk']
    samples_per_class = 50
    
    metadata = {'annotations': []}
    
    for class_id, class_name in enumerate(class_names):
        class_dir = sample_dir / class_name
        class_dir.mkdir(exist_ok=True)
        
        for i in range(samples_per_class):
            # Generate synthetic crowd image
            image = generate_synthetic_crowd_image(class_id)
            
            # Save image
            image_path = class_dir / f'{class_name}_{i:03d}.jpg'
            cv2.imwrite(str(image_path), image)
            
            # Add to metadata
            metadata['annotations'].append({
                'image_path': str(image_path),
                'class_id': class_id,
                'class_name': class_name,
                'people_count': estimate_people_count(class_id),
                'density': estimate_density(class_id),
                'synthetic': True
            })
    
    # Save metadata
    metadata_path = sample_dir / 'metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    logger.info(f"Created {len(metadata['annotations'])} sample images in {sample_dir}")
    return str(sample_dir)

def generate_synthetic_crowd_image(class_id: int) -> np.ndarray:
    """Generate synthetic crowd image based on class"""
    
    import numpy as np
    import cv2
    
    # Base image size
    height, width = 480, 640
    
    # Create base background
    background = np.random.randint(50, 200, (height, width, 3), dtype=np.uint8)
    
    # Add noise and texture
    noise = np.random.normal(0, 25, (height, width, 3))
    background = np.clip(background + noise, 0, 255).astype(np.uint8)
    
    # Add crowd elements based on class
    if class_id == 0:  # Normal
        num_people = np.random.randint(0, 5)
    elif class_id == 1:  # Crowded
        num_people = np.random.randint(6, 20)
    else:  # Stampede risk
        num_people = np.random.randint(21, 50)
    
    # Add simple crowd simulation (circles representing people)
    for _ in range(num_people):
        x = np.random.randint(20, width - 20)
        y = np.random.randint(20, height - 20)
        radius = np.random.randint(8, 15)
        color = (
            np.random.randint(100, 255),
            np.random.randint(100, 255),
            np.random.randint(100, 255)
        )
        cv2.circle(background, (x, y), radius, color, -1)
        
        # Add some variation for realism
        if np.random.random() > 0.7:
            cv2.circle(background, (x-3, y-3), 3, (0, 0, 0), -1)  # Head
    
    # Add motion blur for stampede risk
    if class_id == 2:
        kernel_size = np.random.randint(5, 15)
        kernel = np.zeros((kernel_size, kernel_size))
        kernel[kernel_size//2, :] = 1.0
        kernel = kernel / kernel_size
        background = cv2.filter2D(background, -1, kernel)
    
    return background

def estimate_people_count(class_id: int) -> int:
    """Estimate people count based on class"""
    if class_id == 0:  # normal
        return np.random.randint(0, 5)
    elif class_id == 1:  # crowded
        return np.random.randint(6, 20)
    else:  # stampede_risk
        return np.random.randint(21, 50)

def estimate_density(class_id: int) -> float:
    """Estimate crowd density based on class"""
    if class_id == 0:  # normal
        return np.random.uniform(0.0, 0.2)
    elif class_id == 1:  # crowded
        return np.random.uniform(0.2, 0.6)
    else:  # stampede_risk
        return np.random.uniform(0.6, 1.0)

def train_model(data_path: str, 
                epochs: int = None,
                batch_size: int = None,
                learning_rate: float = None,
                resume_checkpoint: str = None):
    """Main training function"""
    
    logger.info("Starting model training...")
    
    # Override config if parameters provided
    if epochs:
        CONFIG['training']['epochs'] = epochs
    if batch_size:
        CONFIG['training']['batch_size'] = batch_size
    if learning_rate:
        CONFIG['training']['learning_rate'] = learning_rate
    
    # Create training pipeline
    trainer = create_training_pipeline(CONFIG)
    
    # Start training
    start_time = time.time()
    
    try:
        results = trainer.train_model(
            data_path=data_path,
            epochs=epochs,
            resume_from_checkpoint=resume_checkpoint
        )
        
        training_time = time.time() - start_time
        
        logger.info("=" * 60)
        logger.info("TRAINING COMPLETED SUCCESSFULLY!")
        logger.info("=" * 60)
        logger.info(f"Training time: {training_time:.2f} seconds")
        logger.info(f"Final test accuracy: {results['test_results']['accuracy']:.4f}")
        logger.info(f"Final test F1-score: {results['test_results']['f1_score']:.4f}")
        
        # Save final model
        model_paths = trainer.save_final_model()
        logger.info(f"Model saved to: {model_paths}")
        
        return results
        
    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        raise

def hyperparameter_optimization(data_path: str, n_trials: int = 20):
    """Run hyperparameter optimization"""
    
    logger.info(f"Starting hyperparameter optimization with {n_trials} trials...")
    
    try:
        import optuna
        
        def objective(trial):
            # Suggest hyperparameters
            learning_rate = trial.suggest_float('learning_rate', 1e-5, 1e-2, log=True)
            batch_size = trial.suggest_categorical('batch_size', [16, 32, 64])
            dropout_rate = trial.suggest_float('dropout_rate', 0.1, 0.5)
            l2_reg = trial.suggest_float('l2_regularization', 1e-6, 1e-3, log=True)
            
            # Update config
            trial_config = CONFIG.copy()
            trial_config['training']['learning_rate'] = learning_rate
            trial_config['training']['batch_size'] = batch_size
            trial_config['model']['dropout_rate'] = dropout_rate
            trial_config['model']['l2_regularization'] = l2_reg
            
            # Create trainer with trial config
            trainer = create_training_pipeline(trial_config)
            
            # Train for fewer epochs for optimization
            results = trainer.train_model(
                data_path=data_path,
                epochs=20  # Reduced epochs for faster optimization
            )
            
            # Return metric to optimize (F1-score)
            return results['test_results']['f1_score']
        
        # Create study
        study = optuna.create_study(direction='maximize')
        study.optimize(objective, n_trials=n_trials)
        
        # Log best parameters
        logger.info("Hyperparameter optimization completed!")
        logger.info(f"Best F1-score: {study.best_value:.4f}")
        logger.info(f"Best parameters: {study.best_params}")
        
        # Save best parameters
        best_params_path = Path(CONFIG['paths']['logs_dir']) / 'best_hyperparameters.json'
        with open(best_params_path, 'w') as f:
            json.dump(study.best_params, f, indent=2)
        
        return study.best_params
        
    except ImportError:
        logger.error("Optuna not installed. Install with: pip install optuna")
        return None

def evaluate_model(model_path: str, test_data_path: str):
    """Evaluate trained model on test data"""
    
    logger.info(f"Evaluating model: {model_path}")
    
    # Load model
    import tensorflow as tf
    model = tf.keras.models.load_model(model_path)
    
    # Load test data
    data_loader = create_crowd_dataloader(CONFIG)
    test_df = data_loader.load_dataset_metadata(Path(test_data_path))
    
    # Create test generator
    _, _, test_gen, _ = data_loader.create_data_generators(
        test_df, 
        batch_size=CONFIG['training']['batch_size'],
        validation_split=0.0,  # Use all data for testing
        test_split=0.0
    )
    
    # Evaluate
    results = model.evaluate(test_gen, verbose=1)
    
    logger.info(f"Evaluation results: {results}")
    return results

def main():
    """Main training script"""
    
    parser = argparse.ArgumentParser(description='Train Stampede Detection Model')
    parser.add_argument('--data-path', type=str, help='Path to training data')
    parser.add_argument('--epochs', type=int, default=None, help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=None, help='Batch size')
    parser.add_argument('--learning-rate', type=float, default=None, help='Learning rate')
    parser.add_argument('--resume', type=str, default=None, help='Resume from checkpoint')
    parser.add_argument('--optimize', action='store_true', help='Run hyperparameter optimization')
    parser.add_argument('--create-sample', action='store_true', help='Create sample dataset')
    parser.add_argument('--evaluate', type=str, help='Evaluate model at given path')
    
    args = parser.parse_args()
    
    # Setup environment
    setup_training_environment()
    
    # Create sample dataset if requested
    if args.create_sample:
        data_path = create_sample_dataset()
        logger.info(f"Sample dataset created at: {data_path}")
        if not args.data_path:
            args.data_path = data_path
    
    # Check if data path is provided
    if not args.data_path and not args.evaluate:
        logger.error("No data path provided. Use --data-path or --create-sample")
        return
    
    try:
        if args.evaluate:
            # Evaluate existing model
            evaluate_model(args.evaluate, args.data_path)
            
        elif args.optimize:
            # Run hyperparameter optimization
            best_params = hyperparameter_optimization(args.data_path)
            if best_params:
                logger.info("Now training final model with best parameters...")
                
                # Update config with best parameters
                CONFIG['training'].update(best_params)
                
                # Train final model
                train_model(
                    data_path=args.data_path,
                    epochs=CONFIG['training']['epochs'],  # Full epochs for final training
                    resume_checkpoint=args.resume
                )
        else:
            # Regular training
            train_model(
                data_path=args.data_path,
                epochs=args.epochs,
                batch_size=args.batch_size,
                learning_rate=args.learning_rate,
                resume_checkpoint=args.resume
            )
        
        logger.info("Training script completed successfully!")
        
    except Exception as e:
        logger.error(f"Training script failed: {str(e)}")
        raise

if __name__ == "__main__":
    main()
