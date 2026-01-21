"""
Comparison API
Endpoints for multi-device comparison
"""

from flask import Blueprint, request, jsonify
from flask_cors import CORS
import sqlite3
import pandas as pd
import numpy as np
import sys
import os
from datetime import datetime

# Add ml directory to path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml'))

from ml.statistical_tests import t_test

comparison_bp = Blueprint('comparison', __name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'sensor_data.db')

def get_device_data(device_id, start_date=None, end_date=None):
    """Fetch sensor data for a specific device"""
    conn = sqlite3.connect(DB_PATH)
    
    query = "SELECT timestamp, device_id, temperature, humidity, gas_analog, gas_digital FROM sensor_readings WHERE device_id = ?"
    params = [device_id]
    
    if start_date:
        query += " AND timestamp >= ?"
        params.append(start_date)
    if end_date:
        query += " AND timestamp <= ?"
        params.append(end_date)
    
    query += " ORDER BY timestamp ASC"
    
    df = pd.read_sql_query(query, conn, params=params)
    conn.close()
    
    return df

@comparison_bp.route('/comparison/devices', methods=['GET'])
def compare_devices():
    """Compare data from multiple devices"""
    try:
        device_ids = request.args.get('device_ids', '').split(',')
        device_ids = [d.strip() for d in device_ids if d.strip()]
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not device_ids or len(device_ids) < 2:
            return jsonify({'error': 'At least 2 device_ids are required'}), 400
        
        # Get data for each device
        devices_data = {}
        for device_id in device_ids:
            df = get_device_data(device_id, start_date, end_date)
            if not df.empty:
                devices_data[device_id] = {
                    'temperature': df['temperature'].dropna().tolist(),
                    'humidity': df['humidity'].dropna().tolist(),
                    'gas_analog': df['gas_analog'].dropna().tolist(),
                    'timestamps': df['timestamp'].tolist()
                }
        
        if len(devices_data) < 2:
            return jsonify({'error': 'Insufficient data for comparison'}), 400
        
        # Calculate statistics for each device
        statistics = {}
        for device_id, data in devices_data.items():
            statistics[device_id] = {
                'temperature': {
                    'mean': float(np.mean(data['temperature'])) if data['temperature'] else None,
                    'std': float(np.std(data['temperature'])) if data['temperature'] else None,
                    'min': float(np.min(data['temperature'])) if data['temperature'] else None,
                    'max': float(np.max(data['temperature'])) if data['temperature'] else None
                },
                'humidity': {
                    'mean': float(np.mean(data['humidity'])) if data['humidity'] else None,
                    'std': float(np.std(data['humidity'])) if data['humidity'] else None,
                    'min': float(np.min(data['humidity'])) if data['humidity'] else None,
                    'max': float(np.max(data['humidity'])) if data['humidity'] else None
                },
                'gas_analog': {
                    'mean': float(np.mean(data['gas_analog'])) if data['gas_analog'] else None,
                    'std': float(np.std(data['gas_analog'])) if data['gas_analog'] else None,
                    'min': float(np.min(data['gas_analog'])) if data['gas_analog'] else None,
                    'max': float(np.max(data['gas_analog'])) if data['gas_analog'] else None
                }
            }
        
        # Prepare data for visualization (time series)
        time_series = {}
        for device_id, data in devices_data.items():
            time_series[device_id] = {
                'timestamps': data['timestamps'],
                'temperature': data['temperature'],
                'humidity': data['humidity'],
                'gas_analog': data['gas_analog']
            }
        
        return jsonify({
            'device_ids': list(devices_data.keys()),
            'statistics': statistics,
            'time_series': time_series,
            'period': {
                'start_date': start_date,
                'end_date': end_date
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@comparison_bp.route('/comparison/statistical', methods=['POST'])
def statistical_comparison():
    """Perform statistical comparison between devices"""
    try:
        data = request.get_json()
        
        device_ids = data.get('device_ids', [])
        metric = data.get('metric', 'temperature')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        method = data.get('method', 't-test')  # 't-test' or 'anova'
        
        if not device_ids or len(device_ids) < 2:
            return jsonify({'error': 'At least 2 device_ids are required'}), 400
        
        # Get data for each device
        device_data_groups = []
        device_info = []
        for device_id in device_ids:
            df = get_device_data(device_id, start_date, end_date)
            if not df.empty and metric in df.columns:
                metric_data = df[metric].dropna().values
                device_data_groups.append(metric_data)
                device_info.append({
                    'device_id': device_id,
                    'n': len(metric_data),
                    'mean': float(np.mean(metric_data)) if len(metric_data) > 0 else None
                })
        
        if len(device_data_groups) < 2:
            return jsonify({'error': 'Insufficient data for statistical comparison'}), 400
        
        if method == 't-test' and len(device_data_groups) == 2:
            # Perform t-test
            result = t_test(device_data_groups[0], device_data_groups[1])
            return jsonify({
                'method': 't-test',
                'metric': metric,
                'devices': device_info,
                'result': result
            }), 200
        else:
            # For ANOVA or more than 2 devices
            from ml.statistical_tests import anova_test
            result = anova_test(device_data_groups)
            return jsonify({
                'method': 'anova',
                'metric': metric,
                'devices': device_info,
                'result': result
            }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
