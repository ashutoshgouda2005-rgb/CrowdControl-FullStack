"""
CrowdControl AI Model Configuration
Centralized configuration for training, validation, and inference
"""

import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
LOGS_DIR = BASE_DIR / "logs"
CHECKPOINTS_DIR = BASE_DIR / "checkpoints"

# Create directories if they don't exist
for dir_path in [DATA_DIR, MODELS_DIR, LOGS_DIR, CHECKPOINTS_DIR]:
    dir_path.mkdir(exist_ok=True)

# Model architecture configuration
MODEL_CONFIG = {
    'input_shape': (224, 224, 3),  # Standard input size for modern CNNs
    'num_classes': 3,  # Normal, Crowded, Stampede Risk
    'backbone': 'efficientnet_b0',  # Efficient and accurate backbone
    'dropout_rate': 0.3,
    'l2_regularization': 1e-4,
    'use_attention': True,  # Add attention mechanism for better focus
    'use_temporal': False,  # Set to True for video sequences
}

# Training configuration
TRAINING_CONFIG = {
    'batch_size': 32,
    'epochs': 100,
    'learning_rate': 1e-4,
    'weight_decay': 1e-5,
    'patience': 15,  # Early stopping patience
    'min_lr': 1e-7,  # Minimum learning rate for scheduler
    'warmup_epochs': 5,
    'mixed_precision': True,  # Use mixed precision for faster training
    'gradient_clip_norm': 1.0,
}

# Data augmentation configuration
AUGMENTATION_CONFIG = {
    'rotation_range': 15,
    'width_shift_range': 0.1,
    'height_shift_range': 0.1,
    'shear_range': 0.1,
    'zoom_range': 0.1,
    'horizontal_flip': True,
    'brightness_range': [0.8, 1.2],
    'contrast_range': [0.8, 1.2],
    'saturation_range': [0.8, 1.2],
    'hue_range': 0.1,
    'noise_std': 0.01,
    'blur_probability': 0.1,
    'cutout_probability': 0.2,
    'mixup_alpha': 0.2,
    'cutmix_alpha': 1.0,
}

# Validation configuration
VALIDATION_CONFIG = {
    'validation_split': 0.2,
    'test_split': 0.1,
    'stratify': True,  # Ensure balanced splits
    'random_seed': 42,
}

# Inference configuration
INFERENCE_CONFIG = {
    'confidence_threshold': 0.7,
    'nms_threshold': 0.5,
    'max_detections': 100,
    'batch_size': 8,
    'tta_enabled': True,  # Test Time Augmentation
    'ensemble_models': 3,  # Number of models for ensemble
}

# Crowd analysis thresholds
CROWD_THRESHOLDS = {
    'normal_max_people': 5,
    'crowded_max_people': 15,
    'stampede_min_people': 20,
    'density_threshold': 0.3,  # People per square meter
    'movement_threshold': 0.5,  # Movement velocity threshold
    'panic_indicators': {
        'rapid_movement': 0.8,
        'clustering': 0.7,
        'direction_chaos': 0.6,
    }
}

# Logging configuration
LOGGING_CONFIG = {
    'level': 'INFO',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'file_handler': True,
    'console_handler': True,
    'max_bytes': 10 * 1024 * 1024,  # 10MB
    'backup_count': 5,
}

# Hardware configuration
HARDWARE_CONFIG = {
    'use_gpu': True,
    'gpu_memory_growth': True,
    'mixed_precision': True,
    'num_workers': 4,
    'prefetch_factor': 2,
}

# Model paths
MODEL_PATHS = {
    'best_model': MODELS_DIR / "best_stampede_detector.h5",
    'latest_checkpoint': CHECKPOINTS_DIR / "latest_checkpoint.h5",
    'ensemble_models': MODELS_DIR / "ensemble",
    'onnx_model': MODELS_DIR / "stampede_detector.onnx",
    'tflite_model': MODELS_DIR / "stampede_detector.tflite",
}

# Dataset configuration
DATASET_CONFIG = {
    'crowd_datasets': [
        'UCF-QNRF',  # Ultra high density crowd counting
        'ShanghaiTech',  # Crowd counting dataset
        'UCSD',  # Pedestrian dataset
        'Mall',  # Mall dataset
        'Custom_Stampede',  # Custom collected stampede data
    ],
    'data_sources': {
        'images': DATA_DIR / "images",
        'annotations': DATA_DIR / "annotations",
        'videos': DATA_DIR / "videos",
        'synthetic': DATA_DIR / "synthetic",
    },
    'class_mapping': {
        0: 'normal',
        1: 'crowded', 
        2: 'stampede_risk'
    }
}

# Performance metrics configuration
METRICS_CONFIG = {
    'primary_metric': 'f1_score',
    'monitor_metrics': [
        'accuracy',
        'precision',
        'recall',
        'f1_score',
        'auc_roc',
        'confusion_matrix',
        'classification_report'
    ],
    'class_weights': {
        0: 1.0,  # normal
        1: 1.5,  # crowded (slightly more important)
        2: 3.0,  # stampede_risk (most important - safety critical)
    }
}

# Real-time inference configuration
REALTIME_CONFIG = {
    'max_fps': 30,
    'target_latency_ms': 100,  # Target inference time
    'buffer_size': 5,  # Frame buffer for temporal analysis
    'skip_frames': 2,  # Process every nth frame for performance
    'roi_detection': True,  # Focus on regions of interest
    'multi_scale': True,  # Multi-scale detection
}

# Alert system configuration
ALERT_CONFIG = {
    'alert_levels': {
        'info': {'threshold': 0.3, 'color': 'green'},
        'warning': {'threshold': 0.6, 'color': 'yellow'},
        'danger': {'threshold': 0.8, 'color': 'red'},
        'critical': {'threshold': 0.9, 'color': 'red', 'blink': True}
    },
    'cooldown_seconds': 30,  # Minimum time between alerts
    'escalation_threshold': 3,  # Number of consecutive alerts to escalate
    'notification_channels': ['email', 'sms', 'webhook', 'dashboard']
}

# Environment variables with defaults
def get_env_config():
    """Get configuration from environment variables with fallbacks"""
    return {
        'DEBUG': os.getenv('DEBUG', 'False').lower() == 'true',
        'MODEL_VERSION': os.getenv('MODEL_VERSION', 'v1.0'),
        'API_KEY': os.getenv('CROWDCONTROL_API_KEY', ''),
        'DATABASE_URL': os.getenv('DATABASE_URL', 'sqlite:///crowdcontrol.db'),
        'REDIS_URL': os.getenv('REDIS_URL', 'redis://localhost:6379'),
        'SENTRY_DSN': os.getenv('SENTRY_DSN', ''),
        'LOG_LEVEL': os.getenv('LOG_LEVEL', 'INFO'),
    }

# Combine all configurations
CONFIG = {
    'model': MODEL_CONFIG,
    'training': TRAINING_CONFIG,
    'augmentation': AUGMENTATION_CONFIG,
    'validation': VALIDATION_CONFIG,
    'inference': INFERENCE_CONFIG,
    'crowd_thresholds': CROWD_THRESHOLDS,
    'logging': LOGGING_CONFIG,
    'hardware': HARDWARE_CONFIG,
    'paths': MODEL_PATHS,
    'dataset': DATASET_CONFIG,
    'metrics': METRICS_CONFIG,
    'realtime': REALTIME_CONFIG,
    'alerts': ALERT_CONFIG,
    'env': get_env_config(),
}
