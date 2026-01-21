"""
Flask Backend Server for ESP8266 IoT Sensor Data
Receives sensor data via HTTP POST and stores in database (SQLite or Supabase)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add api directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'api'))

# Import API blueprints
try:
    from api.predictions import predictions_bp
    from api.analytics import analytics_bp
    from api.reports import reports_bp
    from api.export import export_bp
    from api.experiments import experiments_bp
    from api.statistics import statistics_bp
    from api.comparison import comparison_bp
except ImportError as e:
    print(f"Warning: Could not import some API modules: {e}")
    predictions_bp = None
    analytics_bp = None
    reports_bp = None
    export_bp = None
    experiments_bp = None
    statistics_bp = None
    comparison_bp = None

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize database (SQLite or Supabase based on environment)
from database.db import Database
db = Database()

def init_database():
    """Initialize database"""
    print(f"✓ Database initialized ({db.db_type})")
    
    # Initialize experiments tables
    try:
        from models.experiments import init_experiments_tables
        init_experiments_tables()
        print("✓ Experiments tables initialized")
    except Exception as e:
        print(f"Warning: Could not initialize experiments tables: {e}")

@app.route('/api/sensor-data', methods=['POST'])
def receive_sensor_data():
    """Receive sensor data from ESP8266"""
    try:
        data = request.get_json()
        
        # Extract data
        device_id = data.get('device_id', 'unknown')
        temperature = data.get('temperature')
        humidity = data.get('humidity')
        gas_analog = data.get('gas_analog')
        gas_digital = data.get('gas_digital')
        
        # Store in database using abstraction layer
        reading = db.insert_sensor_reading(
            device_id=device_id,
            temperature=temperature,
            humidity=humidity,
            gas_analog=gas_analog,
            gas_digital=gas_digital
        )
        
        print(f"✓ Data received: T={temperature}°C, H={humidity}%, Gas={gas_analog}")
        
        return jsonify({
            'status': 'success',
            'message': 'Data stored successfully',
            'reading': reading
        }), 201
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

@app.route('/api/sensor-data', methods=['GET'])
def get_sensor_data():
    """Get sensor data for dashboard"""
    try:
        limit = request.args.get('limit', 100, type=int)
        device_id = request.args.get('device_id', None)
        start_date = request.args.get('start_date', None)
        end_date = request.args.get('end_date', None)
        
        data = db.get_sensor_readings(
            limit=limit,
            device_id=device_id,
            start_date=start_date,
            end_date=end_date
        )
        
        return jsonify(data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/latest', methods=['GET'])
def get_latest():
    """Get latest sensor reading"""
    try:
        device_id = request.args.get('device_id', None)
        reading = db.get_latest_reading(device_id=device_id)
        
        if reading:
            return jsonify({
                'timestamp': reading['timestamp'],
                'temperature': reading['temperature'],
                'humidity': reading['humidity'],
                'gas_analog': reading['gas_analog'],
                'gas_digital': reading['gas_digital']
            }), 200
        else:
            return jsonify({'message': 'No data available'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get statistics for dashboard"""
    try:
        hours = request.args.get('hours', 24, type=int)
        stats = db.get_statistics(hours=hours)
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ESP8266 IoT Backend',
        'timestamp': datetime.now().isoformat()
    }), 200

# Register API blueprints
if predictions_bp:
    app.register_blueprint(predictions_bp, url_prefix='/api')
if analytics_bp:
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
if reports_bp:
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
if export_bp:
    app.register_blueprint(export_bp, url_prefix='/api/export')
if experiments_bp:
    app.register_blueprint(experiments_bp, url_prefix='/api')
if statistics_bp:
    app.register_blueprint(statistics_bp, url_prefix='/api/statistics')
if comparison_bp:
    app.register_blueprint(comparison_bp, url_prefix='/api')

if __name__ == '__main__':
    init_database()
    
    print("\n" + "=" * 50)
    print("ESP8266 IoT Backend Server")
    print("=" * 50)
    print("Server starting on http://0.0.0.0:5001")
    print("API Endpoints:")
    print("  POST /api/sensor-data  - Receive sensor data")
    print("  GET  /api/sensor-data  - Get historical data")
    print("  GET  /api/latest       - Get latest reading")
    print("  GET  /api/stats        - Get statistics")
    print("  GET  /api/predict/temperature  - Predict temperature")
    print("  GET  /api/predict/humidity     - Predict humidity")
    print("  GET  /api/predict/gas          - Predict gas levels")
    print("  GET  /api/anomalies            - Get anomalies")
    print("  GET  /api/analytics/statistics - Statistical analysis")
    print("  GET  /api/analytics/correlation - Correlation matrix")
    print("  GET  /api/analytics/baseline   - Baseline comparison")
    print("  GET  /api/analytics/report     - Generate analysis report")
    print("  POST /api/reports/generate     - Generate PDF report")
    print("  GET  /api/export/csv           - Export data as CSV")
    print("  GET  /api/export/json          - Export data as JSON")
    print("  POST /api/export/excel         - Export data as Excel")
    print("  GET  /health           - Health check")
    print("=" * 50 + "\n")
    
    app.run(host='0.0.0.0', port=5001, debug=True)

