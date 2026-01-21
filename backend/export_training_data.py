"""
Export Training Data to JSON
Exports all sensor data from database to JSON file for model training
"""

import sqlite3
import json
from datetime import datetime

DB_PATH = 'sensor_data.db'
OUTPUT_FILE = 'training_data.json'

def export_training_data():
    """Export all sensor data to JSON file"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Fetch all data
    cursor.execute('''
        SELECT 
            id,
            timestamp,
            device_id,
            temperature,
            humidity,
            gas_analog,
            gas_digital
        FROM sensor_readings
        ORDER BY timestamp ASC
    ''')
    
    rows = cursor.fetchall()
    conn.close()
    
    # Convert to list of dictionaries
    data = []
    for row in rows:
        data.append({
            'id': row[0],
            'timestamp': row[1],
            'device_id': row[2],
            'temperature': row[3],
            'humidity': row[4],
            'gas_analog': row[5],
            'gas_digital': row[6]
        })
    
    # Create output structure with metadata
    output = {
        'metadata': {
            'export_date': datetime.now().isoformat(),
            'total_records': len(data),
            'description': 'Sensor training data - 4 days of readings (1 per minute)',
            'ranges': {
                'temperature': {'min': 19.7, 'max': 26.3, 'unit': 'Celsius'},
                'humidity': {'min': 38, 'max': 61, 'unit': 'percent'},
                'gas_analog': {'min': 61, 'max': 94, 'unit': 'analog_reading'}
            }
        },
        'data': data
    }
    
    # Write to JSON file
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output, f, indent=2, default=str)
    
    print("="*50)
    print("Training Data Export Complete!")
    print("="*50)
    print(f"Output file: {OUTPUT_FILE}")
    print(f"Total records: {len(data)}")
    if data:
        print(f"First record: {data[0]['timestamp']}")
        print(f"Last record: {data[-1]['timestamp']}")
    print("="*50)
    print(f"\n✅ Data exported successfully to {OUTPUT_FILE}")

if __name__ == '__main__':
    export_training_data()
