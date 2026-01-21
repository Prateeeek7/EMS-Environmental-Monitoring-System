"""
ML Model Training Script
Trains LSTM models for prediction and Isolation Forest for anomaly detection
"""

import os
import pickle
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# Try to import TensorFlow/Keras, fall back to simple models if not available
try:
    from tensorflow import keras
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    from tensorflow.keras.optimizers import Adam
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    print("TensorFlow not available. Will use simpler models.")

from ml.preprocessing import DataPreprocessor

MODEL_DIR = 'models'

class ModelTrainer:
    """Train ML models for sensor data prediction and anomaly detection"""
    
    def __init__(self, db_path=None):
        """
        Initialize model trainer
        
        Args:
            db_path: Deprecated - kept for backward compatibility.
                    Database is now accessed via Database abstraction layer.
        """
        self.preprocessor = DataPreprocessor(db_path)
        os.makedirs(MODEL_DIR, exist_ok=True)
        
    def train_lstm_model(self, target_column, sequence_length=60, epochs=50, batch_size=32):
        """Train LSTM model for time-series prediction"""
        if not TENSORFLOW_AVAILABLE:
            print("TensorFlow not available. Skipping LSTM training.")
            return None
            
        print(f"Training LSTM model for {target_column}...")
        
        # Load and prepare data
        df = self.preprocessor.load_data()
        if df.empty or len(df) < sequence_length + 100:
            print(f"Insufficient data for training. Need at least {sequence_length + 100} samples.")
            return None
        
        train_data, test_data, scaler = self.preprocessor.prepare_time_series(
            df, target_column, sequence_length=sequence_length
        )
        
        if train_data is None:
            print("Failed to prepare time-series data.")
            return None
            
        X_train, y_train = train_data
        X_test, y_test = test_data
        
        print(f"Training samples: {len(X_train)}, Test samples: {len(X_test)}")
        
        # Build LSTM model
        model = Sequential([
            LSTM(50, return_sequences=True, input_shape=(sequence_length, X_train.shape[2])),
            Dropout(0.2),
            LSTM(50, return_sequences=False),
            Dropout(0.2),
            Dense(25),
            Dense(1)
        ])
        
        model.compile(optimizer=Adam(learning_rate=0.001), loss='mse', metrics=['mae'])
        
        # Train model
        history = model.fit(
            X_train, y_train,
            batch_size=batch_size,
            epochs=epochs,
            validation_data=(X_test, y_test),
            verbose=1
        )
        
        # Evaluate
        train_loss = model.evaluate(X_train, y_train, verbose=0)
        test_loss = model.evaluate(X_test, y_test, verbose=0)
        
        print(f"Train Loss: {train_loss[0]:.4f}, Test Loss: {test_loss[0]:.4f}")
        
        # Save model
        model_path = os.path.join(MODEL_DIR, f'lstm_{target_column}.h5')
        model.save(model_path)
        print(f"Model saved to {model_path}")
        
        # Save scaler
        scaler_path = os.path.join(MODEL_DIR, f'scaler_{target_column}.pkl')
        with open(scaler_path, 'wb') as f:
            pickle.dump(scaler, f)
        
        return {
            'model_path': model_path,
            'scaler_path': scaler_path,
            'train_loss': train_loss[0],
            'test_loss': test_loss[0],
            'sequence_length': sequence_length
        }
    
    def train_anomaly_detector(self, contamination=0.1):
        """Train Isolation Forest for anomaly detection"""
        print("Training anomaly detection model...")
        
        # Load and prepare data
        df = self.preprocessor.load_data()
        if df.empty:
            print("No data available for training.")
            return None
            
        X_scaled = self.preprocessor.prepare_anomaly_data(df)
        if X_scaled is None:
            print("Failed to prepare anomaly detection data.")
            return None
        
        print(f"Training on {len(X_scaled)} samples...")
        
        # Train Isolation Forest
        model = IsolationForest(contamination=contamination, random_state=42, n_estimators=100)
        model.fit(X_scaled)
        
        # Evaluate
        predictions = model.predict(X_scaled)
        n_anomalies = (predictions == -1).sum()
        anomaly_rate = n_anomalies / len(predictions)
        
        print(f"Detected {n_anomalies} anomalies ({anomaly_rate*100:.2f}%)")
        
        # Save model
        model_path = os.path.join(MODEL_DIR, 'anomaly_detector.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        
        # Save scaler
        scaler_path = os.path.join(MODEL_DIR, 'anomaly_scaler.pkl')
        with open(scaler_path, 'wb') as f:
            pickle.dump(self.preprocessor.feature_scaler, f)
        
        return {
            'model_path': model_path,
            'scaler_path': scaler_path,
            'anomaly_rate': anomaly_rate
        }
    
    def train_all_models(self):
        """Train all models"""
        results = {}
        
        # Train prediction models
        for target in ['temperature', 'humidity', 'gas_analog']:
            try:
                result = self.train_lstm_model(target, epochs=30, batch_size=32)
                if result:
                    results[target] = result
            except Exception as e:
                print(f"Error training {target} model: {e}")
        
        # Train anomaly detector
        try:
            result = self.train_anomaly_detector()
            if result:
                results['anomaly'] = result
        except Exception as e:
            print(f"Error training anomaly detector: {e}")
        
        return results

if __name__ == '__main__':
    trainer = ModelTrainer()
    results = trainer.train_all_models()
    print("\nTraining complete!")
    print("Results:", results)
