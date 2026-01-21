# Data Storage and Training Pipeline

## Data Flow Overview

```
ESP8266 Device → Flask Backend → SQLite Database → ML Preprocessing → Model Training → Saved Models
```

## 1. Data Storage Location

### Primary Storage: SQLite Database
- **Location**: `backend/sensor_data.db`
- **Table**: `sensor_readings`
- **Schema**:
  ```sql
  CREATE TABLE sensor_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      device_id TEXT,
      temperature REAL,
      humidity REAL,
      gas_analog INTEGER,
      gas_digital INTEGER
  )
  ```

### Data Collection Flow:
1. **ESP8266 Device** sends sensor data via HTTP POST to Flask backend
2. **Flask Backend** (`backend/server.py`) receives data at `/api/sensor-data`
3. **Data is stored** in SQLite database with timestamp
4. **Data accumulates** over time for ML training

## 2. Data Processing for Training

### Location: `backend/ml/preprocessing.py`

The `DataPreprocessor` class handles all data processing:

#### Data Loading:
- Reads from SQLite database: `backend/sensor_data.db`
- Can filter by date range or limit number of records
- Converts timestamps to datetime format

#### Feature Engineering:
- **Time-based features**: hour, day_of_week, day_of_month, month
- **Rolling statistics**: 
  - Rolling mean (10-sample window)
  - Rolling standard deviation
- **Rate of change**: temp_change, humidity_change, gas_change
- **Interaction features**: temp_humidity_interaction, gas_temp_interaction

#### Data Normalization:
- Uses `StandardScaler` for feature normalization
- Separate scalers for each sensor type
- Prepares data for LSTM/neural network models

## 3. Model Training Process

### Location: `backend/ml/train_model.py`

#### Training Flow:
1. **Load Data**: Reads from SQLite database via `DataPreprocessor`
2. **Preprocess**: Feature engineering and normalization
3. **Prepare Sequences**: Creates time-series sequences (60 timesteps default)
4. **Train Models**:
   - **LSTM Models**: For temperature, humidity, gas_analog predictions
   - **Isolation Forest**: For anomaly detection
5. **Save Models**: Trained models saved to `backend/ml/models/`

### Model Storage Location:
```
backend/ml/models/
├── lstm_temperature.h5          # LSTM model for temperature prediction
├── lstm_humidity.h5              # LSTM model for humidity prediction
├── lstm_gas_analog.h5            # LSTM model for gas prediction
├── scaler_temperature.pkl        # Scaler for temperature model
├── scaler_humidity.pkl          # Scaler for humidity model
├── scaler_gas_analog.pkl        # Scaler for gas model
├── anomaly_detector.pkl          # Isolation Forest for anomaly detection
└── anomaly_scaler.pkl            # Scaler for anomaly detection
```

## 4. Training Requirements

### Minimum Data Requirements:
- **LSTM Training**: At least 160+ samples (60 sequence length + 100 for training)
- **Recommended**: 1000+ samples for better model accuracy
- **Anomaly Detection**: Can work with fewer samples (100+)

### Training Command:
```bash
cd backend/ml
python train_model.py
```

This will:
1. Load all data from `backend/sensor_data.db`
2. Process and create features
3. Train LSTM models for each sensor
4. Train Isolation Forest for anomaly detection
5. Save all models to `backend/ml/models/`

## 5. Data Usage in Predictions

### Location: `backend/ml/predict.py`

When making predictions:
1. **Load Recent Data**: Reads last 60+ samples from SQLite
2. **Preprocess**: Same feature engineering as training
3. **Load Models**: Loads trained models from `backend/ml/models/`
4. **Generate Predictions**: Uses models to predict future values
5. **Return Results**: Predictions sent to frontend via API

## 6. Current Data Status

Check your current data:
```bash
cd backend
sqlite3 sensor_data.db "SELECT COUNT(*) as total, MIN(timestamp) as first, MAX(timestamp) as last FROM sensor_readings;"
```

## 7. Data Flow Diagram

```
┌─────────────┐
│  ESP8266    │
│   Device    │
└──────┬──────┘
       │ HTTP POST
       │ (every 10s)
       ▼
┌─────────────┐
│ Flask API   │
│ /api/sensor │
│   -data     │
└──────┬──────┘
       │ Store
       ▼
┌─────────────┐
│ SQLite DB   │
│ sensor_data │
│    .db      │
└──────┬──────┘
       │ Read
       ▼
┌─────────────┐
│ ML Preproc  │
│ Feature Eng │
│ Normalize   │
└──────┬──────┘
       │ Process
       ▼
┌─────────────┐
│ Train Model │
│ LSTM/IF     │
└──────┬──────┘
       │ Save
       ▼
┌─────────────┐
│ ml/models/  │
│ .h5 / .pkl  │
└─────────────┘
```

## Summary

- **Storage**: `backend/sensor_data.db` (SQLite database)
- **Processing**: `backend/ml/preprocessing.py` (feature engineering)
- **Training**: `backend/ml/train_model.py` (model training)
- **Model Storage**: `backend/ml/models/` (saved models)
- **Predictions**: `backend/ml/predict.py` (uses trained models)

All data flows from ESP8266 → Database → ML Pipeline → Trained Models → Predictions
