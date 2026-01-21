"""
Prediction Service Module
Handles predictions using trained ML models
"""

import os
import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import sqlite3
import warnings
warnings.filterwarnings('ignore')

# Try to import TensorFlow/Keras
try:
    from tensorflow import keras
    TENSORFLOW_AVAILABLE = True
except (ImportError, ModuleNotFoundError, Exception) as e:
    print(f"Warning: TensorFlow not available ({type(e).__name__}). ML predictions will be disabled.")
    TENSORFLOW_AVAILABLE = False
    keras = None

from ml.preprocessing import DataPreprocessor

MODEL_DIR = 'models'

class PredictionService:
    """Service for making predictions using trained models"""
    
    def __init__(self, db_path=None):
        """
        Initialize prediction service
        
        Args:
            db_path: Deprecated - kept for backward compatibility.
                    Database is now accessed via Database abstraction layer.
        """
        self.preprocessor = DataPreprocessor(db_path)
        self.models = {}
        self.scalers = {}
        self.load_models()
        
    def load_models(self):
        """Load trained models and scalers"""
        # Load prediction models
        for target in ['temperature', 'humidity', 'gas_analog']:
            model_path = os.path.join(MODEL_DIR, f'lstm_{target}.h5')
            scaler_path = os.path.join(MODEL_DIR, f'scaler_{target}.pkl')
            
            if os.path.exists(model_path) and os.path.exists(scaler_path) and TENSORFLOW_AVAILABLE:
                try:
                    self.models[target] = keras.models.load_model(model_path)
                    with open(scaler_path, 'rb') as f:
                        self.scalers[target] = pickle.load(f)
                    print(f"Loaded {target} model")
                except Exception as e:
                    print(f"Error loading {target} model: {e}")
        
        # Load anomaly detector
        anomaly_model_path = os.path.join(MODEL_DIR, 'anomaly_detector.pkl')
        anomaly_scaler_path = os.path.join(MODEL_DIR, 'anomaly_scaler.pkl')
        
        if os.path.exists(anomaly_model_path) and os.path.exists(anomaly_scaler_path):
            try:
                with open(anomaly_model_path, 'rb') as f:
                    self.models['anomaly'] = pickle.load(f)
                with open(anomaly_scaler_path, 'rb') as f:
                    self.scalers['anomaly'] = pickle.load(f)
                print("Loaded anomaly detection model")
            except Exception as e:
                print(f"Error loading anomaly model: {e}")
    
    def predict_future(self, target_column, hours=24, sequence_length=60):
        """
        Predict future values for a target column
        
        Args:
            target_column: Column to predict (temperature, humidity, gas_analog)
            hours: Number of hours to predict ahead
            sequence_length: Sequence length for LSTM model
        """
        if target_column not in self.models or not TENSORFLOW_AVAILABLE:
            return None, None, None
        
        # Load recent data
        df = self.preprocessor.load_data(limit=sequence_length + 100)
        if df.empty or len(df) < sequence_length:
            return None, None, None
        
        model = self.models[target_column]
        scaler = self.scalers[target_column]
        
        # Prepare features
        df = self.preprocessor.create_features(df)
        feature_columns = ['temperature', 'humidity', 'gas_analog', 'hour', 'day_of_week',
                          'temp_rolling_mean', 'humidity_rolling_mean', 'gas_rolling_mean',
                          'temp_change', 'humidity_change', 'gas_change']
        available_features = [col for col in feature_columns if col in df.columns]
        
        # Get recent data
        recent_data = df[available_features].values[-sequence_length:]
        
        # Normalize
        recent_scaled = scaler.transform(recent_data)
        recent_scaled = recent_scaled.reshape(1, sequence_length, len(available_features))
        
        # Predict
        predictions = []
        confidence_intervals = []
        current_input = recent_scaled
        
        # Predict step by step
        for _ in range(min(hours, 24)):  # Limit to 24 steps
            pred = model.predict(current_input, verbose=0)
            predictions.append(pred[0, 0])
            
            # Update input (simplified - in practice, use predicted values)
            # For now, use last known values
            new_row = recent_data[-1:].copy()
            new_scaled = scaler.transform(new_row)
            current_input = np.concatenate([current_input[:, 1:, :], new_scaled.reshape(1, 1, -1)], axis=1)
            
            # Simple confidence interval (std of recent predictions)
            if len(predictions) > 1:
                std = np.std(predictions[-10:]) if len(predictions) > 10 else np.std(predictions)
                confidence_intervals.append(std)
            else:
                confidence_intervals.append(0)
        
        # Inverse transform predictions (simplified - need proper inverse transform)
        # For now, return scaled predictions
        predictions = np.array(predictions)
        confidence_intervals = np.array(confidence_intervals)
        
        # Generate timestamps
        last_timestamp = df['timestamp'].iloc[-1]
        timestamps = [last_timestamp + timedelta(hours=i+1) for i in range(len(predictions))]
        
        return predictions, timestamps, confidence_intervals
    
    def detect_anomalies(self, window_hours=24):
        """
        Detect anomalies in recent sensor data
        
        Args:
            window_hours: Number of hours of data to analyze
        """
        if 'anomaly' not in self.models:
            return None
        
        # Load recent data
        end_date = datetime.now()
        start_date = end_date - timedelta(hours=window_hours)
        
        df = self.preprocessor.load_data(
            start_date=start_date.strftime('%Y-%m-%d %H:%M:%S'),
            end_date=end_date.strftime('%Y-%m-%d %H:%M:%S')
        )
        
        if df.empty:
            return None
        
        # Prepare data
        X_scaled = self.preprocessor.prepare_anomaly_data(df)
        if X_scaled is None:
            return None
        
        # Predict anomalies
        model = self.models['anomaly']
        predictions = model.predict(X_scaled)
        anomaly_scores = model.score_samples(X_scaled)
        
        # Create results
        df['is_anomaly'] = predictions == -1
        df['anomaly_score'] = anomaly_scores
        
        # Filter anomalies
        anomalies = df[df['is_anomaly']].copy()
        
        return anomalies[['timestamp', 'temperature', 'humidity', 'gas_analog', 'anomaly_score']].to_dict('records')
    
    def get_prediction_summary(self, target_column, hours=24):
        """Get prediction summary with statistics"""
        predictions, timestamps, confidences = self.predict_future(target_column, hours)
        
        if predictions is None:
            return None
        
        return {
            'predictions': predictions.tolist() if isinstance(predictions, np.ndarray) else predictions,
            'timestamps': [ts.isoformat() if hasattr(ts, 'isoformat') else str(ts) for ts in timestamps],
            'mean': float(np.mean(predictions)),
            'min': float(np.min(predictions)),
            'max': float(np.max(predictions)),
            'std': float(np.std(predictions)),
            'confidence_intervals': confidences.tolist() if isinstance(confidences, np.ndarray) else confidences
        }

if __name__ == '__main__':
    service = PredictionService()
    
    # Test predictions
    for target in ['temperature', 'humidity', 'gas_analog']:
        result = service.get_prediction_summary(target, hours=12)
        if result:
            print(f"\n{target} predictions:")
            print(f"Mean: {result['mean']:.2f}, Min: {result['min']:.2f}, Max: {result['max']:.2f}")
    
    # Test anomaly detection
    anomalies = service.detect_anomalies(window_hours=24)
    if anomalies:
        print(f"\nDetected {len(anomalies)} anomalies")
