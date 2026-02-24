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
        """Load trained models and scalers (all 5 parameters when available)"""
        for target in ['temperature', 'humidity', 'gas_analog', 'light_level', 'soil_moisture']:
            model_path = os.path.join(MODEL_DIR, f'lstm_{target}.h5')
            scaler_path = os.path.join(MODEL_DIR, f'scaler_{target}.pkl')
            if os.path.exists(model_path) and os.path.exists(scaler_path) and TENSORFLOW_AVAILABLE:
                try:
                    self.models[target] = keras.models.load_model(model_path)
                    with open(scaler_path, 'rb') as f:
                        s = pickle.load(f)
                    # Support both old (single scaler) and new (dict with X, y) format
                    self.scalers[target] = s if isinstance(s, dict) else {'X': s, 'y': None}
                    print(f"Loaded {target} LSTM model")
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
        # Use LSTM with real database data when model is available.
        # If LSTM output is invalid (NaN / Inf), gracefully fall back to simple trend instead
        if target_column in self.models and TENSORFLOW_AVAILABLE:
            try:
                df = self.preprocessor.load_data(limit=sequence_length + 100)
                if df.empty or len(df) < sequence_length:
                    raise ValueError("Not enough data for LSTM sequence")
                if target_column not in df.columns:
                    raise ValueError(f"Target '{target_column}' not in dataframe")

                model = self.models[target_column]
                scaler_dict = self.scalers[target_column]
                scaler_x = scaler_dict.get('X', scaler_dict)
                scaler_y = scaler_dict.get('y')

                df = self.preprocessor.create_features(df)
                feature_columns = [
                    'temperature', 'humidity', 'gas_analog', 'hour', 'day_of_week',
                    'temp_rolling_mean', 'humidity_rolling_mean', 'gas_rolling_mean',
                    'temp_change', 'humidity_change', 'gas_change'
                ]
                if 'light_level' in df.columns:
                    feature_columns.extend(['light_level', 'light_rolling_mean', 'light_change'])
                if 'soil_moisture' in df.columns:
                    feature_columns.extend(['soil_moisture', 'soil_rolling_mean', 'soil_change'])
                available_features = [col for col in feature_columns if col in df.columns]

                recent_data = df[available_features].values[-sequence_length:]
                recent_scaled = scaler_x.transform(recent_data)
                recent_scaled = recent_scaled.reshape(1, sequence_length, len(available_features))

                predictions = []
                confidence_intervals = []
                current_input = recent_scaled
                steps = min(hours, 168)

                for step in range(steps):
                    pred_scaled = model.predict(current_input, verbose=0)
                    pred_scaled_val = float(pred_scaled[0, 0])
                    # Convert to real units for API and for next-step input
                    if scaler_y is not None:
                        pred_val = float(scaler_y.inverse_transform([[pred_scaled_val]])[0, 0])
                    else:
                        pred_val = pred_scaled_val
                    predictions.append(pred_val)

                    # Roll input: use real-unit predicted value in new row for autoregressive step
                    new_row = recent_data[-1:].copy()
                    if target_column in available_features:
                        idx = available_features.index(target_column)
                        new_row[0, idx] = pred_val
                    new_scaled = scaler_x.transform(new_row)
                    current_input = np.concatenate(
                        [current_input[:, 1:, :], new_scaled.reshape(1, 1, -1)],
                        axis=1
                    )
                    recent_data = np.concatenate([recent_data[1:], new_row], axis=0)

                    if len(predictions) > 1:
                        std = np.std(predictions[-10:]) if len(predictions) > 10 else np.std(predictions)
                        confidence_intervals.append(float(std))
                    else:
                        confidence_intervals.append(0.0)

                predictions = np.array(predictions, dtype=float)
                confidence_intervals = np.array(confidence_intervals)

                # If LSTM output is invalid (all NaN/Inf), fall back to simple trend
                if not np.isfinite(predictions).any():
                    print(f"Warning: LSTM predictions for '{target_column}' are invalid (all NaN/Inf). Falling back to trend-based predictions.")
                else:
                    now = datetime.now()
                    timestamps = [now + timedelta(hours=i + 1) for i in range(len(predictions))]
                    return predictions, timestamps, confidence_intervals
            except Exception as e:
                print(f"Warning: LSTM prediction failed for '{target_column}': {e}. Falling back to trend-based predictions.")
        
        # Fallback: use only real data from database (linear trend from recent history)
        df = self.preprocessor.load_data()
        if df.empty or target_column not in df.columns:
            return None, None, None
        series = df[target_column].dropna()
        if series.empty:
            return None, None, None

        window_points = min(len(series), 60 * 24)
        baseline_window = series.tail(window_points)
        baseline = float(baseline_window.mean())
        x = np.arange(len(baseline_window))
        slope = float(np.polyfit(x, baseline_window.values, 1)[0]) if len(baseline_window) > 1 else 0.0
        k = 60  # samples per hour for slope scaling

        steps = hours
        now = datetime.now()
        predictions = [baseline + slope * (i * k) for i in range(1, steps + 1)]
        predictions = np.array(predictions, dtype=float)
        confidences = np.zeros_like(predictions)
        timestamps = [now + timedelta(hours=i) for i in range(1, len(predictions) + 1)]
        return predictions, timestamps, confidences
    
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
        
        if predictions is None or timestamps is None:
            return None
        
        pred_list = predictions.tolist() if isinstance(predictions, np.ndarray) else list(predictions)
        ts_list = [ts.isoformat() if hasattr(ts, 'isoformat') else str(ts) for ts in timestamps]
        # Replace NaN/Inf in predictions so chart and stats work
        pred_list = [float(x) if (np.isscalar(x) and not (isinstance(x, float) and (np.isnan(x) or np.isinf(x)))) else 0.0 for x in pred_list]
        # Compute stats from cleaned list so JSON never has NaN
        mean_val = float(np.mean(pred_list)) if pred_list else 0.0
        min_val = float(min(pred_list)) if pred_list else 0.0
        max_val = float(max(pred_list)) if pred_list else 0.0
        std_val = float(np.std(pred_list)) if len(pred_list) > 1 else 0.0
        conf_list = confidences.tolist() if isinstance(confidences, np.ndarray) else (confidences or [])
        conf_list = [float(x) if np.isscalar(x) and not (isinstance(x, float) and (np.isnan(x) or np.isinf(x))) else 0.0 for x in conf_list]
        
        return {
            'predictions': pred_list,
            'timestamps': ts_list,
            'mean': float(mean_val),
            'min': float(min_val),
            'max': float(max_val),
            'std': std_val,
            'confidence_intervals': conf_list
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
