# Setup Guide - Predictive Model and React Dashboard

This guide provides step-by-step instructions to set up and run the complete EMD system with ML predictions and React dashboard.

## Prerequisites

- Python 3.8+ with pip
- Node.js 16+ with npm
- ESP8266 device with firmware already flashed
- SQLite database with sensor data (at least 1000+ samples for ML training)

## Backend Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Note**: TensorFlow is optional. If not available, the system will use simpler models for predictions.

### 2. Verify Database

Make sure `backend/sensor_data.db` exists and contains sensor data:

```bash
cd backend
sqlite3 sensor_data.db "SELECT COUNT(*) FROM sensor_readings;"
```

### 3. Train ML Models (Optional but Recommended)

Train models after collecting sufficient data (1000+ samples):

```bash
cd backend/ml
python train_model.py
```

This will create trained models in `backend/ml/models/`:
- `lstm_temperature.h5`
- `lstm_humidity.h5`
- `lstm_gas_analog.h5`
- `anomaly_detector.pkl`
- Associated scaler files

**Note**: Training requires TensorFlow. If TensorFlow is not available, predictions will not work, but other features will function.

### 4. Start Backend Server

```bash
cd backend
python server.py
```

The server will start on `http://0.0.0.0:5001`

## Frontend Setup

### 1. Install Node Dependencies

```bash
cd frontend
npm install
```

This will install:
- React and React DOM
- Plotly.js and react-plotly.js
- Material-UI components
- React Router
- Axios
- Date pickers
- PDF generation libraries
- Icons (lucide-react)

### 2. Configure API URL (if needed)

If backend runs on different port, update `frontend/src/services/api.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
```

### 3. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage

### Dashboard

1. Navigate to `http://localhost:3000`
2. View real-time sensor data
3. Monitor current readings and statistics
4. View interactive charts (Plotly)

### Analysis Reports

1. Navigate to Reports section
2. Select time period (start and end dates)
3. Click "Generate Report"
4. View comprehensive statistics and visualizations
5. Export as PDF (click "Export PDF" button)

### Predictions

1. Navigate to Predictions section
2. Set prediction horizon (hours: 1-168)
3. Click "Generate Predictions"
4. View predicted values for temperature, humidity, and gas levels

### Alerts

1. Navigate to Alerts section
2. Configure thresholds for each sensor
3. Click "Save Thresholds"
4. View detected anomalies in the table

## Troubleshooting

### Backend Issues

**Import Errors:**
- Make sure you're running from the `backend/` directory
- Check that all dependencies are installed: `pip install -r requirements.txt`

**Model Training Fails:**
- Ensure sufficient data (1000+ samples)
- Check TensorFlow installation: `pip install tensorflow`
- Verify database contains sensor data

**Predictions Not Working:**
- Train models first: `cd backend/ml && python train_model.py`
- Check model files exist in `backend/ml/models/`
- Verify TensorFlow is installed

### Frontend Issues

**Build Errors:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (16+ required)

**API Connection Errors:**
- Verify backend is running on port 5001
- Check CORS settings in backend
- Verify API URL in `frontend/src/services/api.js`

**Chart Not Rendering:**
- Check browser console for errors
- Verify Plotly.js is installed: `npm list plotly.js`
- Ensure data is being fetched correctly

**Date Picker Issues:**
- Check @mui/x-date-pickers is installed: `npm list @mui/x-date-pickers`
- Verify AdapterDateFns is installed: `npm list @mui/x-date-pickers`

## File Structure

```
EMD Final/
├── backend/
│   ├── ml/
│   │   ├── preprocessing.py
│   │   ├── train_model.py
│   │   ├── predict.py
│   │   └── models/ (trained models)
│   ├── api/
│   │   ├── predictions.py
│   │   ├── analytics.py
│   │   └── reports.py
│   ├── server.py
│   ├── requirements.txt
│   └── sensor_data.db
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── SETUP_GUIDE.md
```

## Notes

1. **ML Models**: Require TensorFlow. Training takes time (5-10 minutes with 1000+ samples)
2. **Predictions**: Work best with 1000+ historical data points
3. **Reports**: Generate comprehensive analysis with visualizations for any time period
4. **Design**: Monotone theme (grayscale UI, colors only in charts)
5. **Icons**: Custom SVG icons (lucide-react), no emojis

## Next Steps

1. Collect more sensor data for better ML predictions
2. Train models periodically with new data
3. Customize thresholds for your specific use case
4. Extend features as needed (multi-zone, additional sensors, etc.)

For more details, see `IMPLEMENTATION_SUMMARY.md`.
