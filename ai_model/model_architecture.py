"""
Advanced Stampede Detection Model Architecture
Modern CNN with attention mechanisms, multi-scale features, and temporal analysis
"""

import tensorflow as tf
from tensorflow.keras import layers, Model, regularizers
from tensorflow.keras.applications import EfficientNetB0, ResNet50V2, MobileNetV3Large
import numpy as np
from typing import Tuple, Optional, Dict, List
import logging

from config import CONFIG

logger = logging.getLogger(__name__)

class AttentionBlock(layers.Layer):
    """Spatial and Channel Attention Block"""
    
    def __init__(self, filters: int, reduction_ratio: int = 8, **kwargs):
        super(AttentionBlock, self).__init__(**kwargs)
        self.filters = filters
        self.reduction_ratio = reduction_ratio
        
        # Channel attention
        self.global_avg_pool = layers.GlobalAveragePooling2D()
        self.global_max_pool = layers.GlobalMaxPooling2D()
        self.dense1 = layers.Dense(filters // reduction_ratio, activation='relu')
        self.dense2 = layers.Dense(filters, activation='sigmoid')
        
        # Spatial attention
        self.conv_spatial = layers.Conv2D(1, 7, padding='same', activation='sigmoid')
        
    def call(self, inputs):
        # Channel attention
        avg_pool = self.global_avg_pool(inputs)
        max_pool = self.global_max_pool(inputs)
        
        avg_pool = self.dense1(avg_pool)
        avg_pool = self.dense2(avg_pool)
        
        max_pool = self.dense1(max_pool)
        max_pool = self.dense2(max_pool)
        
        channel_attention = tf.expand_dims(tf.expand_dims(avg_pool + max_pool, 1), 1)
        channel_refined = inputs * channel_attention
        
        # Spatial attention
        avg_pool_spatial = tf.reduce_mean(channel_refined, axis=-1, keepdims=True)
        max_pool_spatial = tf.reduce_max(channel_refined, axis=-1, keepdims=True)
        spatial_input = tf.concat([avg_pool_spatial, max_pool_spatial], axis=-1)
        spatial_attention = self.conv_spatial(spatial_input)
        
        return channel_refined * spatial_attention

class MultiScaleFeatureExtractor(layers.Layer):
    """Multi-scale feature extraction for crowd analysis"""
    
    def __init__(self, filters: int, **kwargs):
        super(MultiScaleFeatureExtractor, self).__init__(**kwargs)
        self.filters = filters
        
        # Different scale convolutions
        self.conv1x1 = layers.Conv2D(filters // 4, 1, padding='same', activation='relu')
        self.conv3x3 = layers.Conv2D(filters // 4, 3, padding='same', activation='relu')
        self.conv5x5 = layers.Conv2D(filters // 4, 5, padding='same', activation='relu')
        
        # Dilated convolution for larger receptive field
        self.conv_dilated = layers.Conv2D(filters // 4, 3, padding='same', 
                                        dilation_rate=2, activation='relu')
        
        self.batch_norm = layers.BatchNormalization()
        self.dropout = layers.Dropout(0.1)
        
    def call(self, inputs, training=None):
        # Apply different scale convolutions
        conv1 = self.conv1x1(inputs)
        conv3 = self.conv3x3(inputs)
        conv5 = self.conv5x5(inputs)
        conv_dilated = self.conv_dilated(inputs)
        
        # Concatenate multi-scale features
        concatenated = tf.concat([conv1, conv3, conv5, conv_dilated], axis=-1)
        
        # Normalize and regularize
        output = self.batch_norm(concatenated, training=training)
        output = self.dropout(output, training=training)
        
        return output

class CrowdDensityHead(layers.Layer):
    """Specialized head for crowd density estimation"""
    
    def __init__(self, **kwargs):
        super(CrowdDensityHead, self).__init__(**kwargs)
        
        self.conv1 = layers.Conv2D(64, 3, padding='same', activation='relu')
        self.conv2 = layers.Conv2D(32, 3, padding='same', activation='relu')
        self.conv3 = layers.Conv2D(1, 1, padding='same', activation='relu')
        
        self.global_pool = layers.GlobalAveragePooling2D()
        self.dense = layers.Dense(1, activation='linear', name='density_output')
        
    def call(self, inputs):
        x = self.conv1(inputs)
        x = self.conv2(x)
        density_map = self.conv3(x)
        
        # Global density estimate
        density_value = self.global_pool(density_map)
        density_value = self.dense(density_value)
        
        return density_value, density_map

class StampedeDetectionModel:
    """
    Advanced Stampede Detection Model with multiple components:
    1. Backbone CNN for feature extraction
    2. Multi-scale feature processing
    3. Attention mechanisms
    4. Crowd density estimation
    5. Classification head
    """
    
    def __init__(self, config: Dict = None):
        self.config = config or CONFIG
        self.input_shape = self.config['model']['input_shape']
        self.num_classes = self.config['model']['num_classes']
        self.backbone_name = self.config['model']['backbone']
        self.dropout_rate = self.config['model']['dropout_rate']
        self.l2_reg = self.config['model']['l2_regularization']
        
        self.model = None
        self.backbone = None
        
    def _create_backbone(self) -> Model:
        """Create and configure backbone CNN"""
        
        input_tensor = layers.Input(shape=self.input_shape, name='input_image')
        
        if self.backbone_name == 'efficientnet_b0':
            backbone = EfficientNetB0(
                weights='imagenet',
                include_top=False,
                input_tensor=input_tensor
            )
        elif self.backbone_name == 'resnet50v2':
            backbone = ResNet50V2(
                weights='imagenet',
                include_top=False,
                input_tensor=input_tensor
            )
        elif self.backbone_name == 'mobilenetv3':
            backbone = MobileNetV3Large(
                weights='imagenet',
                include_top=False,
                input_tensor=input_tensor
            )
        else:
            raise ValueError(f"Unsupported backbone: {self.backbone_name}")
        
        # Make backbone trainable but freeze early layers
        backbone.trainable = True
        for layer in backbone.layers[:len(backbone.layers)//3]:
            layer.trainable = False
            
        logger.info(f"Created {self.backbone_name} backbone with {len(backbone.layers)} layers")
        return backbone
    
    def _add_feature_processing(self, backbone_output):
        """Add multi-scale feature processing and attention"""
        
        # Multi-scale feature extraction
        multi_scale = MultiScaleFeatureExtractor(512)(backbone_output)
        
        # Attention mechanism
        if self.config['model']['use_attention']:
            attention_output = AttentionBlock(512)(multi_scale)
        else:
            attention_output = multi_scale
        
        # Additional feature processing
        x = layers.Conv2D(256, 3, padding='same', activation='relu',
                         kernel_regularizer=regularizers.l2(self.l2_reg))(attention_output)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(self.dropout_rate)(x)
        
        return x
    
    def _create_classification_head(self, features):
        """Create classification head for stampede detection"""
        
        # Global feature pooling
        global_features = layers.GlobalAveragePooling2D()(features)
        
        # Dense layers with regularization
        x = layers.Dense(512, activation='relu',
                        kernel_regularizer=regularizers.l2(self.l2_reg))(global_features)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(self.dropout_rate)(x)
        
        x = layers.Dense(256, activation='relu',
                        kernel_regularizer=regularizers.l2(self.l2_reg))(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(self.dropout_rate)(x)
        
        # Final classification layer
        classification_output = layers.Dense(
            self.num_classes,
            activation='softmax',
            name='classification_output'
        )(x)
        
        return classification_output
    
    def _create_auxiliary_heads(self, features):
        """Create auxiliary prediction heads"""
        
        auxiliary_outputs = {}
        
        # Crowd density estimation head
        density_head = CrowdDensityHead()
        density_value, density_map = density_head(features)
        auxiliary_outputs['density'] = density_value
        
        # People counting head (regression)
        count_features = layers.GlobalAveragePooling2D()(features)
        count_features = layers.Dense(128, activation='relu')(count_features)
        count_features = layers.Dropout(0.3)(count_features)
        people_count = layers.Dense(1, activation='relu', name='people_count')(count_features)
        auxiliary_outputs['people_count'] = people_count
        
        return auxiliary_outputs
    
    def build_model(self) -> Model:
        """Build the complete stampede detection model"""
        
        # Create backbone
        backbone = self._create_backbone()
        backbone_output = backbone.output
        
        # Add feature processing
        processed_features = self._add_feature_processing(backbone_output)
        
        # Create main classification head
        classification_output = self._create_classification_head(processed_features)
        
        # Create auxiliary heads for multi-task learning
        auxiliary_outputs = self._create_auxiliary_heads(processed_features)
        
        # Combine all outputs
        outputs = [classification_output]
        outputs.extend(auxiliary_outputs.values())
        
        # Create final model
        self.model = Model(
            inputs=backbone.input,
            outputs=outputs,
            name='stampede_detection_model'
        )
        
        logger.info(f"Built model with {self.model.count_params():,} parameters")
        return self.model
    
    def compile_model(self, 
                     learning_rate: float = 1e-4,
                     class_weights: Optional[Dict] = None) -> Model:
        """Compile model with appropriate loss functions and metrics"""
        
        if self.model is None:
            self.build_model()
        
        # Define loss functions
        losses = {
            'classification_output': 'categorical_crossentropy',
            'density': 'mse',
            'people_count': 'mse'
        }
        
        # Loss weights (classification is most important)
        loss_weights = {
            'classification_output': 1.0,
            'density': 0.3,
            'people_count': 0.2
        }
        
        # Metrics for each output
        metrics = {
            'classification_output': ['accuracy', 'precision', 'recall'],
            'density': ['mae'],
            'people_count': ['mae']
        }
        
        # Optimizer with learning rate scheduling
        optimizer = tf.keras.optimizers.AdamW(
            learning_rate=learning_rate,
            weight_decay=self.config['training']['weight_decay']
        )
        
        # Compile model
        self.model.compile(
            optimizer=optimizer,
            loss=losses,
            loss_weights=loss_weights,
            metrics=metrics
        )
        
        logger.info("Model compiled successfully")
        return self.model
    
    def create_ensemble_model(self, num_models: int = 3) -> List[Model]:
        """Create ensemble of models with different initializations"""
        
        ensemble_models = []
        
        for i in range(num_models):
            # Create model with different random seed
            tf.random.set_seed(42 + i)
            model = self.build_model()
            model = self.compile_model()
            ensemble_models.append(model)
            
        logger.info(f"Created ensemble of {num_models} models")
        return ensemble_models
    
    def get_model_summary(self) -> str:
        """Get detailed model summary"""
        
        if self.model is None:
            self.build_model()
        
        summary_lines = []
        self.model.summary(print_fn=lambda x: summary_lines.append(x))
        return '\n'.join(summary_lines)
    
    def visualize_model(self, save_path: str = 'model_architecture.png'):
        """Visualize model architecture"""
        
        if self.model is None:
            self.build_model()
        
        try:
            tf.keras.utils.plot_model(
                self.model,
                to_file=save_path,
                show_shapes=True,
                show_layer_names=True,
                rankdir='TB',
                expand_nested=True,
                dpi=150
            )
            logger.info(f"Model architecture saved to {save_path}")
        except Exception as e:
            logger.warning(f"Could not save model visualization: {e}")

def create_stampede_model(config: Dict = None) -> StampedeDetectionModel:
    """Factory function to create stampede detection model"""
    return StampedeDetectionModel(config)

# Custom loss functions for improved training
class FocalLoss(tf.keras.losses.Loss):
    """Focal Loss for handling class imbalance"""
    
    def __init__(self, alpha=1.0, gamma=2.0, **kwargs):
        super().__init__(**kwargs)
        self.alpha = alpha
        self.gamma = gamma
    
    def call(self, y_true, y_pred):
        # Compute focal loss
        ce_loss = tf.keras.losses.categorical_crossentropy(y_true, y_pred)
        pt = tf.exp(-ce_loss)
        focal_loss = self.alpha * (1 - pt) ** self.gamma * ce_loss
        return focal_loss

class LabelSmoothingLoss(tf.keras.losses.Loss):
    """Label smoothing for better generalization"""
    
    def __init__(self, smoothing=0.1, **kwargs):
        super().__init__(**kwargs)
        self.smoothing = smoothing
    
    def call(self, y_true, y_pred):
        # Apply label smoothing
        num_classes = tf.cast(tf.shape(y_true)[-1], tf.float32)
        smooth_labels = y_true * (1 - self.smoothing) + self.smoothing / num_classes
        return tf.keras.losses.categorical_crossentropy(smooth_labels, y_pred)

# Example usage
if __name__ == "__main__":
    # Create and build model
    model_builder = create_stampede_model()
    model = model_builder.build_model()
    
    # Print model summary
    print(model_builder.get_model_summary())
    
    # Compile model
    compiled_model = model_builder.compile_model()
    
    print(f"Model created with {compiled_model.count_params():,} parameters")
