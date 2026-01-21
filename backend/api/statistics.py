"""
Statistics API
Endpoints for statistical analysis (t-tests, ANOVA, regression, distribution)
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

from ml.statistical_tests import (
    t_test,
    anova_test,
    linear_regression,
    polynomial_regression,
    distribution_analysis,
    confidence_interval
)

statistics_bp = Blueprint('statistics', __name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'sensor_data.db')

def get_sensor_data(start_date=None, end_date=None, device_id=None, metric=None):
    """Fetch sensor data for analysis"""
    conn = sqlite3.connect(DB_PATH)
    
    query = f"SELECT timestamp, {metric} FROM sensor_readings WHERE 1=1"
    params = []
    
    if start_date:
        query += " AND timestamp >= ?"
        params.append(start_date)
    if end_date:
        query += " AND timestamp <= ?"
        params.append(end_date)
    if device_id:
        query += " AND device_id = ?"
        params.append(device_id)
    
    query += " ORDER BY timestamp ASC"
    
    df = pd.read_sql_query(query, conn, params=params)
    conn.close()
    
    # Remove null values
    df = df.dropna(subset=[metric])
    
    return df[metric].values

@statistics_bp.route('/statistics/t-test', methods=['POST'])
def perform_t_test():
    """Perform t-test comparing two time periods"""
    try:
        data = request.get_json()
        
        metric = data.get('metric')
        period1_start = data.get('period1_start')
        period1_end = data.get('period1_end')
        period2_start = data.get('period2_start')
        period2_end = data.get('period2_end')
        device_id = data.get('device_id')
        
        if not metric or not period1_start or not period1_end or not period2_start or not period2_end:
            return jsonify({'error': 'metric, period1_start, period1_end, period2_start, period2_end are required'}), 400
        
        # Get data for both periods
        data1 = get_sensor_data(period1_start, period1_end, device_id, metric)
        data2 = get_sensor_data(period2_start, period2_end, device_id, metric)
        
        if len(data1) == 0 or len(data2) == 0:
            return jsonify({'error': 'Insufficient data for t-test'}), 400
        
        result = t_test(data1, data2)
        
        return jsonify({
            'test_type': 't-test',
            'metric': metric,
            'period1': {'start': period1_start, 'end': period1_end, 'n': len(data1)},
            'period2': {'start': period2_start, 'end': period2_end, 'n': len(data2)},
            'result': result
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@statistics_bp.route('/statistics/anova', methods=['POST'])
def perform_anova():
    """Perform ANOVA comparing multiple time periods"""
    try:
        data = request.get_json()
        
        metric = data.get('metric')
        periods = data.get('periods')  # List of {start, end} dicts
        device_id = data.get('device_id')
        
        if not metric or not periods or len(periods) < 2:
            return jsonify({'error': 'metric and periods (at least 2) are required'}), 400
        
        # Get data for each period
        groups = []
        period_info = []
        for period in periods:
            period_data = get_sensor_data(period['start'], period['end'], device_id, metric)
            groups.append(period_data)
            period_info.append({
                'start': period['start'],
                'end': period['end'],
                'n': len(period_data)
            })
        
        if any(len(g) == 0 for g in groups):
            return jsonify({'error': 'Insufficient data for ANOVA'}), 400
        
        result = anova_test(groups)
        
        return jsonify({
            'test_type': 'ANOVA',
            'metric': metric,
            'periods': period_info,
            'result': result
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@statistics_bp.route('/statistics/regression', methods=['POST'])
def perform_regression():
    """Perform regression analysis"""
    try:
        data = request.get_json()
        
        x_metric = data.get('x_metric')
        y_metric = data.get('y_metric')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        device_id = data.get('device_id')
        regression_type = data.get('type', 'linear')  # 'linear' or 'polynomial'
        degree = data.get('degree', 2)
        
        if not x_metric or not y_metric:
            return jsonify({'error': 'x_metric and y_metric are required'}), 400
        
        # Get data
        conn = sqlite3.connect(DB_PATH)
        query = f"SELECT {x_metric}, {y_metric} FROM sensor_readings WHERE 1=1"
        params = []
        
        if start_date:
            query += " AND timestamp >= ?"
            params.append(start_date)
        if end_date:
            query += " AND timestamp <= ?"
            params.append(end_date)
        if device_id:
            query += " AND device_id = ?"
            params.append(device_id)
        
        query += " ORDER BY timestamp ASC"
        
        df = pd.read_sql_query(query, conn, params=params)
        conn.close()
        
        # Remove null values
        df = df.dropna(subset=[x_metric, y_metric])
        
        if len(df) == 0:
            return jsonify({'error': 'No data available for regression'}), 400
        
        x = df[x_metric].values
        y = df[y_metric].values
        
        if regression_type == 'linear':
            result = linear_regression(x, y)
        else:
            result = polynomial_regression(x, y, degree)
        
        return jsonify({
            'regression_type': regression_type,
            'x_metric': x_metric,
            'y_metric': y_metric,
            'n': len(df),
            'result': result
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@statistics_bp.route('/statistics/distribution', methods=['GET', 'POST'])
def analyze_distribution():
    """Analyze distribution of a metric"""
    try:
        if request.method == 'POST':
            data = request.get_json()
            metric = data.get('metric')
            start_date = data.get('start_date')
            end_date = data.get('end_date')
            device_id = data.get('device_id')
            confidence = data.get('confidence', 0.95)
        else:
            metric = request.args.get('metric')
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            device_id = request.args.get('device_id')
            confidence = float(request.args.get('confidence', 0.95))
        
        if not metric:
            return jsonify({'error': 'metric is required'}), 400
        
        data_values = get_sensor_data(start_date, end_date, device_id, metric)
        
        if len(data_values) == 0:
            return jsonify({'error': 'No data available'}), 400
        
        result = distribution_analysis(data_values)
        ci = confidence_interval(data_values, confidence)
        result['confidence_interval'] = ci
        
        return jsonify({
            'metric': metric,
            'n': len(data_values),
            'result': result
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
