"""
Advanced Training Pipeline for Stampede Detection Model
Includes hyperparameter tuning, advanced callbacks, and robust training procedures
"""

import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.callbacks import *
from tensorflow.keras.optimizers.schedules import *
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix
from pathlib import Path
import logging
from datetime import datetime
import wandb
from typing import Dict, List, Tuple, Optional
import pickle

from config import CONFIG
from model_architecture import create_stampede_model, FocalLoss, LabelSmoothingLoss
from data_loader import create_crowd_dataloader

logger = logging.getLogger(__name__)

class AdvancedTrainingPipeline:
    """
    Comprehensive training pipeline with:
    - Advanced callbacks and monitoring
    - Hyperparameter optimization
    - Model checkpointing and versioning
    - Comprehensive evaluation and visualization
    """
    
    def __init__(self, config: Dict = None):
        self.config = config or CONFIG
        self.model_builder = create_stampede_model(config)
        self.data_loader = create_crowd_dataloader(config)
        
        # Training state
        self.model = None
        self.history = None
        self.best_model_path = None
        self.training_logs = []
        
        # Setup directories
        self.setup_directories()
        
        # Initialize logging
        self.setup_logging()
        
        # Initialize experiment tracking
        self.setup_experiment_tracking()
        
    def setup_directories(self):
        """Create necessary directories for training"""
        directories = [
            self.config['paths']['checkpoints_dir'],
            self.config['paths']['logs_dir'],
            self.config['paths']['models_dir'],
            Path(self.config['paths']['logs_dir']) / 'tensorboard',
            Path(self.config['paths']['logs_dir']) / 'plots',
        ]
        
        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True)
    
    def setup_logging(self):
        """Setup comprehensive logging"""
        log_file = Path(self.config['paths']['logs_dir']) / f"training_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        
        logging.basicConfig(
            level=getattr(logging, self.config['logging']['level']),
            format=self.config['logging']['format'],
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        
        logger.info("Training pipeline initialized")
    
    def setup_experiment_tracking(self):
        """Initialize experiment tracking with Weights & Biases"""
        try:
            wandb.init(
                project="crowdcontrol-stampede-detection",
                config=self.config,
                name=f"experiment_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            )
            self.use_wandb = True
            logger.info("Weights & Biases tracking initialized")
        except Exception as e:
            logger.warning(f"Could not initialize W&B: {e}")
            self.use_wandb = False
    
    def create_callbacks(self, validation_data=None) -> List:
        """Create comprehensive callback list for training"""
        
        callbacks = []
        
        # Model checkpointing - save best model
        checkpoint_path = self.config['paths']['checkpoints_dir'] / "best_model_{epoch:02d}_{val_loss:.4f}.h5"
        model_checkpoint = ModelCheckpoint(
            filepath=str(checkpoint_path),
            monitor='val_classification_output_f1_score',
            mode='max',
            save_best_only=True,
            save_weights_only=False,
            verbose=1
        )
        callbacks.append(model_checkpoint)
        
        # Early stopping with patience
        early_stopping = EarlyStopping(
            monitor='val_classification_output_f1_score',
            mode='max',
            patience=self.config['training']['patience'],
            restore_best_weights=True,
            verbose=1
        )
        callbacks.append(early_stopping)
        
        # Learning rate scheduling
        lr_scheduler = ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=self.config['training']['min_lr'],
            verbose=1
        )
        callbacks.append(lr_scheduler)
        
        # Cosine annealing schedule
        cosine_scheduler = CosineRestartSchedule(
            first_decay_steps=20,
            t_mul=2.0,
            m_mul=0.9,
            alpha=0.1
        )
        callbacks.append(LearningRateScheduler(cosine_scheduler, verbose=1))
        
        # TensorBoard logging
        tensorboard_dir = Path(self.config['paths']['logs_dir']) / 'tensorboard'
        tensorboard = TensorBoard(
            log_dir=str(tensorboard_dir),
            histogram_freq=1,
            write_graph=True,
            write_images=True,
            update_freq='epoch'
        )
        callbacks.append(tensorboard)
        
        # Custom metrics callback
        metrics_callback = CustomMetricsCallback(validation_data)
        callbacks.append(metrics_callback)
        
        # Weights & Biases callback
        if self.use_wandb:
            wandb_callback = wandb.keras.WandbCallback(
                monitor='val_classification_output_f1_score',
                mode='max',
                save_model=True
            )
            callbacks.append(wandb_callback)
        
        # Gradient clipping callback
        gradient_clip_callback = GradientClippingCallback(
            clip_norm=self.config['training']['gradient_clip_norm']
        )
        callbacks.append(gradient_clip_callback)
        
        # Model backup callback (save every N epochs)
        backup_callback = ModelBackupCallback(
            backup_dir=self.config['paths']['checkpoints_dir'],
            backup_frequency=10
        )
        callbacks.append(backup_callback)
        
        logger.info(f"Created {len(callbacks)} training callbacks")
        return callbacks
    
    def prepare_data(self, data_path: str) -> Tuple:
        """Prepare and validate training data"""
        
        logger.info("Loading and preparing dataset...")
        
        # Load dataset metadata
        dataset_df = self.data_loader.load_dataset_metadata(Path(data_path))
        
        # Validate dataset
        validation_results = self.data_loader.validate_dataset(dataset_df)
        
        if validation_results['data_quality'] < 0.8:
            logger.warning(f"Dataset quality is low: {validation_results['data_quality']:.2f}")
        
        # Create data generators
        train_gen, val_gen, test_gen, (train_df, val_df, test_df) = self.data_loader.create_data_generators(
            dataset_df,
            batch_size=self.config['training']['batch_size'],
            validation_split=self.config['validation']['validation_split'],
            test_split=self.config['validation']['test_split']
        )
        
        # Compute class weights
        class_weights = self.data_loader.compute_class_weights(train_df)
        
        # Create TensorFlow datasets
        train_dataset = self.data_loader.create_tf_dataset(
            train_gen, 
            self.config['training']['batch_size'], 
            training=True
        )
        
        val_dataset = self.data_loader.create_tf_dataset(
            val_gen, 
            self.config['training']['batch_size'], 
            training=False
        )
        
        # Calculate steps per epoch
        steps_per_epoch = len(train_df) // self.config['training']['batch_size']
        validation_steps = len(val_df) // self.config['training']['batch_size']
        
        logger.info(f"Data prepared - Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")
        
        return (train_dataset, val_dataset, test_gen, 
                steps_per_epoch, validation_steps, class_weights, test_df)
    
    def build_and_compile_model(self, class_weights: Dict = None) -> tf.keras.Model:
        """Build and compile the model with advanced configurations"""
        
        logger.info("Building and compiling model...")
        
        # Build model
        model = self.model_builder.build_model()
        
        # Setup mixed precision if enabled
        if self.config['training']['mixed_precision']:
            policy = tf.keras.mixed_precision.Policy('mixed_float16')
            tf.keras.mixed_precision.set_global_policy(policy)
            logger.info("Mixed precision training enabled")
        
        # Custom learning rate schedule
        initial_lr = self.config['training']['learning_rate']
        lr_schedule = ExponentialDecay(
            initial_learning_rate=initial_lr,
            decay_steps=1000,
            decay_rate=0.96,
            staircase=True
        )
        
        # Advanced optimizer
        optimizer = tf.keras.optimizers.AdamW(
            learning_rate=lr_schedule,
            weight_decay=self.config['training']['weight_decay'],
            beta_1=0.9,
            beta_2=0.999,
            epsilon=1e-7
        )
        
        # Loss functions
        losses = {
            'classification_output': FocalLoss(alpha=1.0, gamma=2.0),
            'density': 'mse',
            'people_count': 'huber'  # Robust to outliers
        }
        
        # Loss weights
        loss_weights = {
            'classification_output': 1.0,
            'density': 0.3,
            'people_count': 0.2
        }
        
        # Comprehensive metrics
        metrics = {
            'classification_output': [
                'accuracy',
                tf.keras.metrics.Precision(name='precision'),
                tf.keras.metrics.Recall(name='recall'),
                tf.keras.metrics.F1Score(name='f1_score'),
                tf.keras.metrics.AUC(name='auc')
            ],
            'density': ['mae', 'mse'],
            'people_count': ['mae', 'mse']
        }
        
        # Compile model
        model.compile(
            optimizer=optimizer,
            loss=losses,
            loss_weights=loss_weights,
            metrics=metrics
        )
        
        self.model = model
        logger.info(f"Model compiled with {model.count_params():,} parameters")
        
        return model
    
    def train_model(self, 
                   data_path: str,
                   epochs: Optional[int] = None,
                   resume_from_checkpoint: Optional[str] = None) -> Dict:
        """Execute complete training pipeline"""
        
        logger.info("Starting model training...")
        
        # Prepare data
        (train_dataset, val_dataset, test_gen, 
         steps_per_epoch, validation_steps, class_weights, test_df) = self.prepare_data(data_path)
        
        # Build and compile model
        if self.model is None:
            self.build_and_compile_model(class_weights)
        
        # Resume from checkpoint if specified
        if resume_from_checkpoint and os.path.exists(resume_from_checkpoint):
            logger.info(f"Resuming training from {resume_from_checkpoint}")
            self.model.load_weights(resume_from_checkpoint)
        
        # Create callbacks
        callbacks = self.create_callbacks(val_dataset)
        
        # Training parameters
        epochs = epochs or self.config['training']['epochs']
        
        # Start training
        logger.info(f"Training for {epochs} epochs...")
        start_time = datetime.now()
        
        try:
            self.history = self.model.fit(
                train_dataset,
                epochs=epochs,
                steps_per_epoch=steps_per_epoch,
                validation_data=val_dataset,
                validation_steps=validation_steps,
                callbacks=callbacks,
                class_weight=class_weights,
                verbose=1
            )
            
            training_time = datetime.now() - start_time
            logger.info(f"Training completed in {training_time}")
            
            # Save training history
            self.save_training_history()
            
            # Evaluate on test set
            test_results = self.evaluate_model(test_gen, test_df)
            
            # Generate comprehensive report
            training_report = self.generate_training_report(test_results, training_time)
            
            return training_report
            
        except Exception as e:
            logger.error(f"Training failed: {str(e)}")
            raise
    
    def evaluate_model(self, test_generator, test_df: pd.DataFrame) -> Dict:
        """Comprehensive model evaluation"""
        
        logger.info("Evaluating model on test set...")
        
        # Generate predictions
        predictions = []
        true_labels = []
        
        for batch_x, batch_y in test_generator():
            pred = self.model.predict(batch_x, verbose=0)
            predictions.extend(pred[0])  # Classification predictions
            true_labels.extend(batch_y)
        
        predictions = np.array(predictions)
        true_labels = np.array(true_labels)
        
        # Convert to class indices
        pred_classes = np.argmax(predictions, axis=1)
        true_classes = np.argmax(true_labels, axis=1)
        
        # Calculate metrics
        from sklearn.metrics import accuracy_score, precision_recall_fscore_support, roc_auc_score
        
        accuracy = accuracy_score(true_classes, pred_classes)
        precision, recall, f1, _ = precision_recall_fscore_support(true_classes, pred_classes, average='weighted')
        
        # Per-class metrics
        class_report = classification_report(true_classes, pred_classes, 
                                           target_names=list(self.config['dataset']['class_mapping'].values()),
                                           output_dict=True)
        
        # Confusion matrix
        cm = confusion_matrix(true_classes, pred_classes)
        
        # ROC AUC for each class
        try:
            auc_scores = {}
            for i in range(self.config['model']['num_classes']):
                auc_scores[f'class_{i}_auc'] = roc_auc_score(
                    (true_classes == i).astype(int),
                    predictions[:, i]
                )
        except Exception as e:
            logger.warning(f"Could not calculate AUC scores: {e}")
            auc_scores = {}
        
        evaluation_results = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'classification_report': class_report,
            'confusion_matrix': cm.tolist(),
            'auc_scores': auc_scores,
            'num_test_samples': len(true_classes)
        }
        
        logger.info(f"Test accuracy: {accuracy:.4f}, F1-score: {f1:.4f}")
        
        # Save evaluation results
        self.save_evaluation_results(evaluation_results)
        
        # Create visualizations
        self.create_evaluation_plots(evaluation_results)
        
        return evaluation_results
    
    def save_training_history(self):
        """Save training history and create plots"""
        
        if self.history is None:
            return
        
        # Save history as JSON
        history_path = Path(self.config['paths']['logs_dir']) / 'training_history.json'
        
        # Convert numpy arrays to lists for JSON serialization
        history_dict = {}
        for key, values in self.history.history.items():
            history_dict[key] = [float(v) for v in values]
        
        with open(history_path, 'w') as f:
            json.dump(history_dict, f, indent=2)
        
        # Create training plots
        self.plot_training_history()
        
        logger.info(f"Training history saved to {history_path}")
    
    def plot_training_history(self):
        """Create comprehensive training plots"""
        
        if self.history is None:
            return
        
        history = self.history.history
        epochs = range(1, len(history['loss']) + 1)
        
        # Create subplots
        fig, axes = plt.subplots(2, 3, figsize=(18, 12))
        fig.suptitle('Training History', fontsize=16)
        
        # Loss plots
        axes[0, 0].plot(epochs, history['loss'], 'b-', label='Training Loss')
        axes[0, 0].plot(epochs, history['val_loss'], 'r-', label='Validation Loss')
        axes[0, 0].set_title('Model Loss')
        axes[0, 0].set_xlabel('Epoch')
        axes[0, 0].set_ylabel('Loss')
        axes[0, 0].legend()
        axes[0, 0].grid(True)
        
        # Accuracy plots
        if 'classification_output_accuracy' in history:
            axes[0, 1].plot(epochs, history['classification_output_accuracy'], 'b-', label='Training Accuracy')
            axes[0, 1].plot(epochs, history['val_classification_output_accuracy'], 'r-', label='Validation Accuracy')
            axes[0, 1].set_title('Model Accuracy')
            axes[0, 1].set_xlabel('Epoch')
            axes[0, 1].set_ylabel('Accuracy')
            axes[0, 1].legend()
            axes[0, 1].grid(True)
        
        # F1 Score plots
        if 'classification_output_f1_score' in history:
            axes[0, 2].plot(epochs, history['classification_output_f1_score'], 'b-', label='Training F1')
            axes[0, 2].plot(epochs, history['val_classification_output_f1_score'], 'r-', label='Validation F1')
            axes[0, 2].set_title('F1 Score')
            axes[0, 2].set_xlabel('Epoch')
            axes[0, 2].set_ylabel('F1 Score')
            axes[0, 2].legend()
            axes[0, 2].grid(True)
        
        # Learning rate plot
        if 'lr' in history:
            axes[1, 0].plot(epochs, history['lr'], 'g-')
            axes[1, 0].set_title('Learning Rate')
            axes[1, 0].set_xlabel('Epoch')
            axes[1, 0].set_ylabel('Learning Rate')
            axes[1, 0].set_yscale('log')
            axes[1, 0].grid(True)
        
        # Density loss (auxiliary task)
        if 'density_loss' in history:
            axes[1, 1].plot(epochs, history['density_loss'], 'b-', label='Training')
            axes[1, 1].plot(epochs, history['val_density_loss'], 'r-', label='Validation')
            axes[1, 1].set_title('Density Estimation Loss')
            axes[1, 1].set_xlabel('Epoch')
            axes[1, 1].set_ylabel('MSE Loss')
            axes[1, 1].legend()
            axes[1, 1].grid(True)
        
        # People count loss (auxiliary task)
        if 'people_count_loss' in history:
            axes[1, 2].plot(epochs, history['people_count_loss'], 'b-', label='Training')
            axes[1, 2].plot(epochs, history['val_people_count_loss'], 'r-', label='Validation')
            axes[1, 2].set_title('People Count Loss')
            axes[1, 2].set_xlabel('Epoch')
            axes[1, 2].set_ylabel('Huber Loss')
            axes[1, 2].legend()
            axes[1, 2].grid(True)
        
        plt.tight_layout()
        
        # Save plot
        plots_dir = Path(self.config['paths']['logs_dir']) / 'plots'
        plot_path = plots_dir / 'training_history.png'
        plt.savefig(plot_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"Training plots saved to {plot_path}")
    
    def create_evaluation_plots(self, evaluation_results: Dict):
        """Create evaluation visualization plots"""
        
        plots_dir = Path(self.config['paths']['logs_dir']) / 'plots'
        
        # Confusion Matrix
        plt.figure(figsize=(10, 8))
        cm = np.array(evaluation_results['confusion_matrix'])
        class_names = list(self.config['dataset']['class_mapping'].values())
        
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                   xticklabels=class_names, yticklabels=class_names)
        plt.title('Confusion Matrix')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        
        cm_path = plots_dir / 'confusion_matrix.png'
        plt.savefig(cm_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        # Classification Report Heatmap
        if 'classification_report' in evaluation_results:
            report_df = pd.DataFrame(evaluation_results['classification_report']).transpose()
            
            plt.figure(figsize=(12, 8))
            sns.heatmap(report_df.iloc[:-1, :-1].astype(float), annot=True, cmap='RdYlBu_r')
            plt.title('Classification Report')
            
            report_path = plots_dir / 'classification_report.png'
            plt.savefig(report_path, dpi=300, bbox_inches='tight')
            plt.close()
        
        logger.info(f"Evaluation plots saved to {plots_dir}")
    
    def save_evaluation_results(self, results: Dict):
        """Save evaluation results to file"""
        
        results_path = Path(self.config['paths']['logs_dir']) / 'evaluation_results.json'
        
        # Convert numpy arrays to lists for JSON serialization
        serializable_results = {}
        for key, value in results.items():
            if isinstance(value, np.ndarray):
                serializable_results[key] = value.tolist()
            elif isinstance(value, np.float32) or isinstance(value, np.float64):
                serializable_results[key] = float(value)
            else:
                serializable_results[key] = value
        
        with open(results_path, 'w') as f:
            json.dump(serializable_results, f, indent=2)
        
        logger.info(f"Evaluation results saved to {results_path}")
    
    def generate_training_report(self, test_results: Dict, training_time) -> Dict:
        """Generate comprehensive training report"""
        
        report = {
            'model_config': self.config['model'],
            'training_config': self.config['training'],
            'training_time': str(training_time),
            'model_parameters': self.model.count_params(),
            'test_results': test_results,
            'best_model_path': str(self.best_model_path) if self.best_model_path else None,
            'timestamp': datetime.now().isoformat()
        }
        
        # Save report
        report_path = Path(self.config['paths']['logs_dir']) / 'training_report.json'
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Training report saved to {report_path}")
        
        return report
    
    def save_final_model(self, model_name: str = None):
        """Save the final trained model"""
        
        if self.model is None:
            logger.warning("No model to save")
            return
        
        model_name = model_name or f"stampede_detector_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Save in multiple formats
        model_dir = Path(self.config['paths']['models_dir'])
        
        # Keras format
        keras_path = model_dir / f"{model_name}.h5"
        self.model.save(keras_path)
        
        # SavedModel format
        savedmodel_path = model_dir / f"{model_name}_savedmodel"
        self.model.save(savedmodel_path, save_format='tf')
        
        # Save model architecture as JSON
        architecture_path = model_dir / f"{model_name}_architecture.json"
        with open(architecture_path, 'w') as f:
            f.write(self.model.to_json())
        
        # Save weights separately
        weights_path = model_dir / f"{model_name}_weights.h5"
        self.model.save_weights(weights_path)
        
        logger.info(f"Model saved to {model_dir}")
        
        return {
            'keras_model': str(keras_path),
            'savedmodel': str(savedmodel_path),
            'architecture': str(architecture_path),
            'weights': str(weights_path)
        }

# Custom Callbacks
class CustomMetricsCallback(Callback):
    """Custom callback for additional metrics tracking"""
    
    def __init__(self, validation_data):
        super().__init__()
        self.validation_data = validation_data
        
    def on_epoch_end(self, epoch, logs=None):
        # Add custom metrics calculation here
        pass

class GradientClippingCallback(Callback):
    """Callback for gradient clipping"""
    
    def __init__(self, clip_norm=1.0):
        super().__init__()
        self.clip_norm = clip_norm
        
    def on_train_batch_begin(self, batch, logs=None):
        # Gradient clipping is handled by the optimizer in TF 2.x
        pass

class ModelBackupCallback(Callback):
    """Callback to backup model periodically"""
    
    def __init__(self, backup_dir, backup_frequency=10):
        super().__init__()
        self.backup_dir = Path(backup_dir)
        self.backup_frequency = backup_frequency
        
    def on_epoch_end(self, epoch, logs=None):
        if (epoch + 1) % self.backup_frequency == 0:
            backup_path = self.backup_dir / f"backup_epoch_{epoch+1:03d}.h5"
            self.model.save_weights(backup_path)
            logger.info(f"Model backup saved to {backup_path}")

def CosineRestartSchedule(first_decay_steps, t_mul=2.0, m_mul=1.0, alpha=0.0):
    """Cosine annealing with warm restarts"""
    def schedule(epoch):
        return tf.keras.experimental.CosineDecayRestarts(
            initial_learning_rate=1e-4,
            first_decay_steps=first_decay_steps,
            t_mul=t_mul,
            m_mul=m_mul,
            alpha=alpha
        )(epoch)
    return schedule

# Factory function
def create_training_pipeline(config: Dict = None) -> AdvancedTrainingPipeline:
    """Factory function to create training pipeline"""
    return AdvancedTrainingPipeline(config)

# Example usage
if __name__ == "__main__":
    # Create training pipeline
    trainer = create_training_pipeline()
    
    # Start training
    data_path = "path/to/your/dataset"
    results = trainer.train_model(data_path)
    
    print("Training completed!")
    print(f"Final test accuracy: {results['test_results']['accuracy']:.4f}")
