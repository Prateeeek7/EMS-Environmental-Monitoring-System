"""
Data Preprocessing Module for ML Training
Handles feature engineering, normalization, and time-series formatting
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path to import database module
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from database.db import Database

class DataPreprocessor:
    """Preprocess sensor data for ML model training"""
    
    def __init__(self, db_path=None):
        """
        Initialize preprocessor
        
        Args:
            db_path: Deprecated - kept for backward compatibility. 
                    Database is now accessed via Database abstraction layer.
        """
        self.scaler_temp = StandardScaler()
        self.scaler_humidity = StandardScaler()
        self.scaler_gas = StandardScaler()
        self.feature_scaler = StandardScaler()
        self.db = Database()
        
    def load_data(self, start_date=None, end_date=None, limit=None):
        """Load sensor data from database"""
        df = self.db.load_dataframe(
            start_date=start_date,
            end_date=end_date,
            limit=limit
        )
        return df
    
    def create_features(self, df):
        """Create additional features from sensor data"""
        df = df.copy()
        
        # Time-based features
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['day_of_month'] = df['timestamp'].dt.day
        df['month'] = df['timestamp'].dt.month
        
        # Rolling statistics
        window = 10
        df['temp_rolling_mean'] = df['temperature'].rolling(window=window, min_periods=1).mean()
        df['temp_rolling_std'] = df['temperature'].rolling(window=window, min_periods=1).std()
        df['humidity_rolling_mean'] = df['humidity'].rolling(window=window, min_periods=1).mean()
        df['gas_rolling_mean'] = df['gas_analog'].rolling(window=window, min_periods=1).mean()
        
        # Fill NaN values from rolling stats
        df['temp_rolling_mean'] = df['temp_rolling_mean'].fillna(df['temperature'])
        df['temp_rolling_std'] = df['temp_rolling_std'].fillna(0)
        df['humidity_rolling_mean'] = df['humidity_rolling_mean'].fillna(df['humidity'])
        df['gas_rolling_mean'] = df['gas_rolling_mean'].fillna(df['gas_analog'])
        
        # Rate of change
        df['temp_change'] = df['temperature'].diff().fillna(0)
        df['humidity_change'] = df['humidity'].diff().fillna(0)
        df['gas_change'] = df['gas_analog'].diff().fillna(0)
        
        # Interaction features
        df['temp_humidity_interaction'] = df['temperature'] * df['humidity']
        df['gas_temp_interaction'] = df['gas_analog'] * df['temperature']
        
        return df
    
    def prepare_time_series(self, df, target_column, sequence_length=60, prediction_horizon=1):
        """
        Prepare time-series data for LSTM/GRU models
        
        Args:
            df: DataFrame with sensor data
            target_column: Column to predict (temperature, humidity, gas_analog)
            sequence_length: Number of time steps to use as input
            prediction_horizon: Number of steps ahead to predict
        """
        if df.empty:
            return None, None, None
            
        df = self.create_features(df)
        
        # Select features
        feature_columns = ['temperature', 'humidity', 'gas_analog', 'hour', 'day_of_week',
                          'temp_rolling_mean', 'humidity_rolling_mean', 'gas_rolling_mean',
                          'temp_change', 'humidity_change', 'gas_change']
        
        # Ensure all columns exist
        available_features = [col for col in feature_columns if col in df.columns]
        
        X_data = df[available_features].values
        y_data = df[target_column].values
        
        # Normalize features
        X_scaled = self.feature_scaler.fit_transform(X_data)
        y_scaled = StandardScaler().fit_transform(y_data.reshape(-1, 1)).flatten()
        
        X_sequences = []
        y_sequences = []
        
        for i in range(sequence_length, len(X_scaled) - prediction_horizon + 1):
            X_sequences.append(X_scaled[i-sequence_length:i])
            y_sequences.append(y_scaled[i + prediction_horizon - 1])
        
        if len(X_sequences) == 0:
            return None, None, None
            
        X_sequences = np.array(X_sequences)
        y_sequences = np.array(y_sequences)
        
        # Split into train and test (80/20)
        split_index = int(len(X_sequences) * 0.8)
        X_train = X_sequences[:split_index]
        X_test = X_sequences[split_index:]
        y_train = y_sequences[:split_index]
        y_test = y_sequences[split_index:]
        
        return (X_train, y_train), (X_test, y_test), self.feature_scaler
    
    def prepare_anomaly_data(self, df):
        """Prepare data for anomaly detection"""
        if df.empty:
            return None
            
        df = self.create_features(df)
        
        # Select features for anomaly detection
        feature_columns = ['temperature', 'humidity', 'gas_analog',
                          'temp_rolling_mean', 'humidity_rolling_mean', 'gas_rolling_mean',
                          'temp_change', 'humidity_change', 'gas_change']
        
        available_features = [col for col in feature_columns if col in df.columns]
        
        X_data = df[available_features].values
        
        # Normalize
        X_scaled = self.feature_scaler.fit_transform(X_data)
        
        return X_scaled
    
    def normalize_sensor_data(self, df, fit=True):
        """Normalize sensor data columns"""
        df = df.copy()
        
        if fit:
            self.scaler_temp.fit(df[['temperature']])
            self.scaler_humidity.fit(df[['humidity']])
            self.scaler_gas.fit(df[['gas_analog']])
        
        df['temperature_normalized'] = self.scaler_temp.transform(df[['temperature']]).flatten()
        df['humidity_normalized'] = self.scaler_humidity.transform(df[['humidity']]).flatten()
        df['gas_normalized'] = self.scaler_gas.transform(df[['gas_analog']]).flatten()
        
        return df
