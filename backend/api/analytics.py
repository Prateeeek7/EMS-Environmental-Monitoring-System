"""
Analytics API Endpoints
Provides statistical analysis and correlation endpoints
"""

from flask import Blueprint, request, jsonify
import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)

DB_PATH = 'sensor_data.db'

@analytics_bp.route('/statistics', methods=['GET'])
def get_statistics():
    """Get statistical analysis for sensor data"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        conn = sqlite3.connect(DB_PATH)
        
        query = "SELECT timestamp, temperature, humidity, gas_analog FROM sensor_readings"
        conditions = []
        
        if start_date:
            conditions.append(f"timestamp >= '{start_date}'")
        if end_date:
            conditions.append(f"timestamp <= '{end_date}'")
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        query += " ORDER BY timestamp ASC"
        
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        if df.empty:
            return jsonify({'error': 'No data available'}), 404
        
        # Calculate statistics
        stats = {
            'temperature': {
                'count': int(df['temperature'].count()),
                'mean': float(df['temperature'].mean()),
                'median': float(df['temperature'].median()),
                'std': float(df['temperature'].std()),
                'min': float(df['temperature'].min()),
                'max': float(df['temperature'].max()),
                'q25': float(df['temperature'].quantile(0.25)),
                'q75': float(df['temperature'].quantile(0.75))
            },
            'humidity': {
                'count': int(df['humidity'].count()),
                'mean': float(df['humidity'].mean()),
                'median': float(df['humidity'].median()),
                'std': float(df['humidity'].std()),
                'min': float(df['humidity'].min()),
                'max': float(df['humidity'].max()),
                'q25': float(df['humidity'].quantile(0.25)),
                'q75': float(df['humidity'].quantile(0.75))
            },
            'gas_analog': {
                'count': int(df['gas_analog'].count()),
                'mean': float(df['gas_analog'].mean()),
                'median': float(df['gas_analog'].median()),
                'std': float(df['gas_analog'].std()),
                'min': float(df['gas_analog'].min()),
                'max': float(df['gas_analog'].max()),
                'q25': float(df['gas_analog'].quantile(0.25)),
                'q75': float(df['gas_analog'].quantile(0.75))
            }
        }
        
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/correlation', methods=['GET'])
def get_correlation():
    """Get correlation matrix between sensors"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        conn = sqlite3.connect(DB_PATH)
        
        query = "SELECT temperature, humidity, gas_analog FROM sensor_readings"
        conditions = []
        
        if start_date:
            conditions.append(f"timestamp >= '{start_date}'")
        if end_date:
            conditions.append(f"timestamp <= '{end_date}'")
            
        if conditions:
            query = f"SELECT timestamp, temperature, humidity, gas_analog FROM sensor_readings WHERE " + " AND ".join(conditions)
        else:
            query = f"SELECT timestamp, temperature, humidity, gas_analog FROM sensor_readings"
        
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        if df.empty:
            return jsonify({'error': 'No data available'}), 404
        
        # Calculate correlation
        corr_matrix = df[['temperature', 'humidity', 'gas_analog']].corr()
        
        return jsonify({
            'correlation_matrix': corr_matrix.to_dict(),
            'labels': ['temperature', 'humidity', 'gas_analog']
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/baseline', methods=['GET'])
def get_baseline():
    """Get baseline statistics for comparison"""
    try:
        baseline_days = int(request.args.get('days', 7))
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=baseline_days)
        
        conn = sqlite3.connect(DB_PATH)
        
        query = f"""
            SELECT AVG(temperature) as avg_temp, AVG(humidity) as avg_humidity, AVG(gas_analog) as avg_gas,
                   STDDEV(temperature) as std_temp, STDDEV(humidity) as std_humidity, STDDEV(gas_analog) as std_gas
            FROM sensor_readings
            WHERE timestamp >= '{start_date.strftime('%Y-%m-%d %H:%M:%S')}'
            AND timestamp <= '{end_date.strftime('%Y-%m-%d %H:%M:%S')}'
        """
        
        cursor = conn.cursor()
        cursor.execute(query)
        row = cursor.fetchone()
        conn.close()
        
        if row[0] is None:
            return jsonify({'error': 'No baseline data available'}), 404
        
        baseline = {
            'temperature': {
                'mean': float(row[0]) if row[0] else 0,
                'std': float(row[3]) if row[3] else 0
            },
            'humidity': {
                'mean': float(row[1]) if row[1] else 0,
                'std': float(row[4]) if row[4] else 0
            },
            'gas_analog': {
                'mean': float(row[2]) if row[2] else 0,
                'std': float(row[5]) if row[5] else 0
            },
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'days': baseline_days
            }
        }
        
        return jsonify(baseline), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/report', methods=['GET'])
def generate_report():
    """Generate comprehensive analysis report"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            return jsonify({'error': 'start_date and end_date are required'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        
        query = f"""
            SELECT timestamp, temperature, humidity, gas_analog
            FROM sensor_readings
            WHERE timestamp >= '{start_date}' AND timestamp <= '{end_date}'
            ORDER BY timestamp ASC
        """
        
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        if df.empty:
            return jsonify({'error': 'No data available for the specified period'}), 404
        
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Calculate statistics
        stats = {
            'temperature': {
                'count': int(df['temperature'].count()),
                'mean': float(df['temperature'].mean()),
                'median': float(df['temperature'].median()),
                'std': float(df['temperature'].std()),
                'min': float(df['temperature'].min()),
                'max': float(df['temperature'].max())
            },
            'humidity': {
                'count': int(df['humidity'].count()),
                'mean': float(df['humidity'].mean()),
                'median': float(df['humidity'].median()),
                'std': float(df['humidity'].std()),
                'min': float(df['humidity'].min()),
                'max': float(df['humidity'].max())
            },
            'gas_analog': {
                'count': int(df['gas_analog'].count()),
                'mean': float(df['gas_analog'].mean()),
                'median': float(df['gas_analog'].median()),
                'std': float(df['gas_analog'].std()),
                'min': float(df['gas_analog'].min()),
                'max': float(df['gas_analog'].max())
            }
        }
        
        # Calculate correlation
        corr_matrix = df[['temperature', 'humidity', 'gas_analog']].corr()
        
        # Time series data for charts
        time_series = {
            'timestamps': df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S').tolist(),
            'temperature': df['temperature'].tolist(),
            'humidity': df['humidity'].tolist(),
            'gas_analog': df['gas_analog'].tolist()
        }
        
        report = {
            'period': {
                'start': start_date,
                'end': end_date
            },
            'statistics': stats,
            'correlation': corr_matrix.to_dict(),
            'time_series': time_series,
            'total_readings': len(df)
        }
        
        return jsonify(report), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
