## Environmental Monitoring System

An end-to-end IoT system for monitoring environmental conditions (temperature, humidity, gas level, light level, and soil moisture) using ESP8266-based sensor nodes, a Python/Flask backend, relational storage (SQLite or Supabase), and a Streamlit dashboard for analytics.

This repository contains:
- **Embedded firmware** for ESP8266.
- **Backend services** for data ingestion, storage, analytics, and ML.
- **Dashboard** for real-time monitoring and historical analysis.

---

## Key Features

- **Multi-sensor data collection**
  - Temperature and humidity (DHT11).
  - Gas/LPG levels (MQ-6).
  - Light level and soil moisture (when connected).
  - On-device LCD showing rotating status screens.

- **Networked data ingestion**
  - ESP8266 connects to Wi-Fi and periodically sends JSON payloads over HTTP.
  - Configurable upload interval (default ~10 seconds).

- **Backend services**
  - Flask REST API for receiving and querying sensor data.
  - SQLite as default local database; optional Supabase cloud backend via a unified `Database` abstraction.
  - Statistics endpoints for 24-hour aggregates and basic analytics.

- **Dashboard**
  - Streamlit dashboard with Plotly charts for:
    - Real-time sensor traces.
    - Historical trends and correlation views.
    - Basic statistics summary and CSV export.

- **Machine learning and statistics**
  - Time-series forecasting models (LSTM) for key parameters.
  - Isolation Forest-based anomaly detection.
  - Statistical tests and regression utilities for multi-device comparison.

---

## System Architecture

- **Sensor node (edge)**
  - ESP8266 microcontroller reads DHT11, MQ-6, and optional light/soil sensors.
  - Measurements are batched into a JSON structure.
  - Data is transmitted to the backend via HTTP POST to `/api/sensor-data`.

- **Backend**
  - Flask application (`backend/server.py`).
  - Data access through `backend/database/db.py`, which supports:
    - Local SQLite database (`sensor_data.db`).
    - Supabase table `sensor_readings` when configured via environment.
  - Additional API blueprints for:
    - Predictions (`backend/api/predictions.py`).
    - Multi-device comparison and statistical analysis (`backend/api/comparison.py`).

- **Storage**
  - SQLite schema defined and maintained via `Database._ensure_table_exists`.
  - Supabase schema mirrored in `backend/database/supabase_schema.sql`.

- **Dashboard**
  - Streamlit app in `dashboard/streamlit_app.py`.
  - Fetches data via the backend REST API and renders interactive charts using Plotly.

---

## Models and Algorithms

The project includes a small analytics/ML layer in `backend/ml`:

- **Time-series forecasting (per parameter)**
  - LSTM neural networks implemented with TensorFlow/Keras in `ml/train_model.py`.
  - One model per target (temperature, humidity, gas_analog, light_level, soil_moisture).
  - Sequence preparation, feature engineering, and scaling handled by `ml/preprocessing.py` (`DataPreprocessor`).
  - Inference served via `ml/predict.py` (`PredictionService`) and exposed through `backend/api/predictions.py`.

- **Anomaly detection**
  - Isolation Forest (`sklearn.ensemble.IsolationForest`) trained on engineered features in `ModelTrainer.train_anomaly_detector`.
  - Used by `PredictionService.detect_anomalies` and exposed via `/api/anomalies`.

- **Feature engineering and scaling**
  - Rolling means and standard deviations.
  - First differences (rate of change).
  - Interaction terms between key variables.
  - Standardization via `sklearn.preprocessing.StandardScaler` for both inputs and targets.

- **Fallback forecasting (no TensorFlow available)**
  - When LSTM models are unavailable or invalid, `PredictionService.predict_future` falls back to:
    - Baseline equal to the mean of a recent window.
    - Linear trend extrapolation estimated with `numpy.polyfit`.

- **Statistical analysis**
  - Implemented in `ml/statistical_tests.py`:
    - Independent-samples t-test (`scipy.stats.ttest_ind`).
    - One-way ANOVA (`scipy.stats.f_oneway`).
    - Linear regression and polynomial regression (scikit-learn).
    - Distribution analysis (skewness, kurtosis, normality tests).
    - Confidence interval computation using t-distribution.
  - Used by `backend/api/comparison.py` for multi-device comparison endpoints.

---

## Project Structure

High-level layout (simplified):

```bash
.
├── esp8266_wifi_cloud.ino        # ESP8266 Arduino sketch
├── platformio.ini                # PlatformIO configuration
├── README.md                     # Project documentation (this file)
├── CLOUD_SETUP_GUIDE.md          # Additional cloud/deployment notes
├── WIRING_CONNECTIONS.md         # Hardware wiring documentation
├── backend/
│   ├── server.py                 # Flask API entrypoint
│   ├── requirements.txt          # Backend Python dependencies
│   ├── database/
│   │   ├── db.py                 # SQLite/Supabase database abstraction
│   │   └── supabase_schema.sql   # Supabase table and policies
│   ├── api/
│   │   ├── predictions.py        # Prediction and anomaly endpoints
│   │   └── comparison.py         # Multi-device comparison/statistics
│   ├── ml/
│   │   ├── preprocessing.py      # Feature engineering and scaling
│   │   ├── train_model.py        # LSTM and anomaly model training
│   │   ├── predict.py            # Prediction service
│   │   └── statistical_tests.py  # Statistical utilities
│   └── sensor_data.db            # SQLite database (created at runtime)
├── dashboard/
│   ├── streamlit_app.py          # Analytics dashboard
│   └── requirements.txt          # Dashboard Python dependencies
└── src/
    └── main.cpp                  # Compiled ESP8266 firmware (PlatformIO)
```

---

## Hardware Setup (Summary)

For complete wiring details, refer to `WIRING_CONNECTIONS.md`. In summary:

- **ESP8266**
  - Provides Wi-Fi connectivity and runs the main firmware.

- **Sensors**
  - DHT11:
    - Data: GPIO2 (D4).
    - Power: 3.3 V and GND.
  - MQ-6:
    - Analog output: A0.
    - Digital output: D5.
    - Power: 5 V and GND.
  - LCD (JHD 162A with I2C backpack):
    - SDA: D2 (GPIO4).
    - SCL: D1 (GPIO5).
    - Power: 3.3 V and GND.

---

## Software Setup

### Prerequisites

- Python 3.10+ recommended.
- PlatformIO for ESP8266 firmware (VS Code extension or CLI).
- Virtual environment support (`venv`) for backend and dashboard.

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python server.py                 # Runs on http://localhost:5001
```

If using Supabase instead of local SQLite, configure the following environment variables before starting the server:

- `USE_SUPABASE=true`
- `SUPABASE_URL`
- `SUPABASE_KEY`

### Dashboard

```bash
cd dashboard
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run streamlit_app.py   # Default: http://localhost:8501
```

### ESP8266 Firmware

Using PlatformIO:

```bash
pio run --target upload
```

Before flashing, update Wi-Fi credentials and backend URL in `esp8266_wifi_cloud.ino`:

```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://<backend-ip>:5001/api/sensor-data";
```

---

## REST API Summary

Core endpoints (paths may be mounted under a base prefix in `server.py`):

- **Sensor data**
  - **POST** `/api/sensor-data`  
    - Description: Ingest a new sensor reading from ESP8266.  
    - Request body: JSON with device_id, temperature, humidity, gas_analog, gas_digital, and optional light/soil fields.  
    - Response: HTTP 201 on success.

  - **GET** `/api/sensor-data?limit=N`  
    - Description: Retrieve the latest N readings (default limit defined in backend).  
    - Response: JSON array of readings.

  - **GET** `/api/latest`  
    - Description: Retrieve the most recent reading.  
    - Response: Single JSON object.

  - **GET** `/api/stats`  
    - Description: Basic 24-hour statistics (count, average, min, max, etc.).  
    - Response: JSON with aggregated metrics.

- **Health**
  - **GET** `/health`  
    - Description: Lightweight health check for the backend service.

- **Prediction endpoints** (in `backend/api/predictions.py`)
  - **GET** `/predict/temperature?hours=H`  
  - **GET** `/predict/humidity?hours=H`  
  - **GET** `/predict/gas?hours=H`  
  - **GET** `/predict/light?hours=H`  
  - **GET** `/predict/soil?hours=H`  
    - Description: Forecast specified parameter for the next `H` hours (1–168).  
    - Response: JSON with predicted values, timestamps, basic statistics, and confidence values where applicable.  
    - Notes: If models are not trained, the endpoint returns an error indicating that training is required.

- **Anomaly detection**
  - **GET** `/anomalies?window=H`  
    - Description: Detect anomalies in the last `H` hours of data using the Isolation Forest model.  
    - Response: JSON with list of anomalous readings and associated scores.

- **Device comparison and statistics** (in `backend/api/comparison.py`)
  - **GET** `/comparison/devices?device_ids=id1,id2&start_date=...&end_date=...`  
    - Description: Multi-device comparison with summary statistics and aligned time series.
  - **POST** `/comparison/statistical`  
    - Description: Perform statistical tests (t-test or ANOVA) across devices for a selected metric.  
    - Request body: JSON specifying device_ids, metric, date range, and method.

---

## Training and Using ML Models

### Training

ML training scripts are located in `backend/ml` and are designed to run against data available in the configured database.

Basic usage:

```bash
cd backend
source .venv/bin/activate         # if using a virtualenv
python -m ml.train_model
```

The trainer will:
- Inspect available columns in `sensor_readings`.
- Train LSTM models for each parameter with sufficient data.
- Train an Isolation Forest anomaly detector.
- Persist models and scalers under `backend/models/`.

For TensorFlow issues on macOS (e.g., `ml_dtypes`/`float8_e3m4`), see `backend/TRAIN_LSTM.md`.

### Inference

The backend loads available models on startup via `PredictionService`. Prediction and anomaly endpoints will automatically:
- Use LSTM forecasts when models and TensorFlow are available and outputs are valid.
- Fall back to trend-based predictions when necessary.

---

## Libraries and Dependencies (Summary)

- **Embedded**
  - `ESP8266WiFi`, `ESP8266HTTPClient`, `DHT`, `LiquidCrystal_I2C`, `Wire`.

- **Backend**
  - Flask, flask-cors, requests, pandas, numpy.
  - scikit-learn (Isolation Forest, regression, scalers).
  - SciPy (statistical tests, distribution analysis).
  - TensorFlow/Keras (LSTM models; optional but recommended for forecasting).

- **Frontend**
  - React.
  - Plotly.

For exact versions, refer to the respective `requirements.txt` files.

---

## License

This project is licensed under the MIT License. 

---
Pratik Kumar
