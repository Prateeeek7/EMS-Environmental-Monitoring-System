"""
Prediction API Endpoints
Provides endpoints for ML predictions
"""

from flask import Blueprint, request, jsonify
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

predictions_bp = Blueprint('predictions', __name__)

# Initialize prediction service (with error handling)
try:
    from ml.predict import PredictionService
    prediction_service = PredictionService(db_path='sensor_data.db')
except Exception as e:
    print(f"Warning: Could not initialize prediction service: {e}")
    prediction_service = None

@predictions_bp.route('/predict/temperature', methods=['GET'])
def predict_temperature():
    """Predict future temperature values"""
    if prediction_service is None:
        return jsonify({
            'error': 'Prediction service not available',
            'message': 'ML models are not available. Please check dependencies.'
        }), 503
    try:
        hours = int(request.args.get('hours', 24))
        hours = max(1, min(hours, 168))  # Limit to 1-168 hours (1 week)
        
        result = prediction_service.get_prediction_summary('temperature', hours=hours)
        if result is None:
            return jsonify({
                'error': 'Model not available or insufficient data',
                'message': 'Please train the model first'
            }), 404
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@predictions_bp.route('/predict/humidity', methods=['GET'])
def predict_humidity():
    """Predict future humidity values"""
    if prediction_service is None:
        return jsonify({
            'error': 'Prediction service not available',
            'message': 'ML models are not available. Please check dependencies.'
        }), 503
    try:
        hours = int(request.args.get('hours', 24))
        hours = max(1, min(hours, 168))
        
        result = prediction_service.get_prediction_summary('humidity', hours=hours)
        if result is None:
            return jsonify({
                'error': 'Model not available or insufficient data',
                'message': 'Please train the model first'
            }), 404
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@predictions_bp.route('/predict/gas', methods=['GET'])
def predict_gas():
    """Predict future gas level values"""
    if prediction_service is None:
        return jsonify({
            'error': 'Prediction service not available',
            'message': 'ML models are not available. Please check dependencies.'
        }), 503
    try:
        hours = int(request.args.get('hours', 24))
        hours = max(1, min(hours, 168))
        
        result = prediction_service.get_prediction_summary('gas_analog', hours=hours)
        if result is None:
            return jsonify({
                'error': 'Model not available or insufficient data',
                'message': 'Please train the model first'
            }), 404
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@predictions_bp.route('/anomalies', methods=['GET'])
def get_anomalies():
    """Get detected anomalies"""
    if prediction_service is None:
        return jsonify({
            'error': 'Prediction service not available',
            'message': 'ML models are not available. Please check dependencies.'
        }), 503
    try:
        window_hours = int(request.args.get('window', 24))
        window_hours = max(1, min(window_hours, 168))
        
        anomalies = prediction_service.detect_anomalies(window_hours=window_hours)
        if anomalies is None:
            return jsonify({
                'error': 'Model not available or insufficient data',
                'message': 'Please train the model first'
            }), 404
        
        return jsonify({
            'count': len(anomalies),
            'anomalies': anomalies
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
