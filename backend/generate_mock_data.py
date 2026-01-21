"""
Generate Mock Sensor Data
Creates 4 days of sensor readings (1 per minute) for testing and model training
"""

import sqlite3
import random
from datetime import datetime, timedelta
import math

DB_PATH = 'sensor_data.db'

def generate_mock_data():
    """Generate 4 days of mock sensor data"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Clear existing data (optional - comment out if you want to keep existing data)
    cursor.execute('DELETE FROM sensor_readings')
    conn.commit()
    
    # Generate data for 4 days (4 * 24 * 60 = 5,760 records)
    start_time = datetime.now() - timedelta(days=4)
    device_id = 'ESP8266_001'
    
    # Ranges
    temp_min, temp_max = 19.7, 26.3
    humidity_min, humidity_max = 38, 61
    gas_min, gas_max = 61, 94
    
    print(f"Generating mock data from {start_time} to {datetime.now()}...")
    print(f"Temperature range: {temp_min}-{temp_max}°C")
    print(f"Humidity range: {humidity_min}-{humidity_max}%")
    print(f"Gas range: {gas_min}-{gas_max}")
    
    records = []
    current_time = start_time
    
    # Generate realistic patterns (daily cycles, slight variations)
    while current_time < datetime.now():
        # Daily cycle for temperature (warmer during day, cooler at night)
        hour = current_time.hour
        # Create a sinusoidal pattern for temperature
        daily_temp_variation = math.sin((hour - 6) * math.pi / 12) * 3  # ±3°C variation
        temp_center = (temp_min + temp_max) / 2
        temp = temp_center + daily_temp_variation + random.uniform(-1.5, 1.5)
        temp = max(temp_min, min(temp_max, round(temp, 1)))
        
        # Daily cycle for humidity (lower during day, higher at night)
        daily_humidity_variation = -math.sin((hour - 6) * math.pi / 12) * 8  # ±8% variation
        humidity_center = (humidity_min + humidity_max) / 2
        humidity = humidity_center + daily_humidity_variation + random.uniform(-3, 3)
        humidity = max(humidity_min, min(humidity_max, round(humidity, 1)))
        
        # Gas with slight variations
        gas = random.randint(gas_min, gas_max)
        gas_digital = 1 if gas > 75 else 0  # Digital trigger at 75
        
        records.append((
            device_id,
            temp,
            humidity,
            gas,
            gas_digital,
            current_time.strftime('%Y-%m-%d %H:%M:%S')
        ))
        
        current_time += timedelta(minutes=1)
        
        # Batch insert every 1000 records for performance
        if len(records) >= 1000:
            cursor.executemany('''
                INSERT INTO sensor_readings (device_id, temperature, humidity, gas_analog, gas_digital, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', records)
            conn.commit()
            print(f"Inserted {len(records)} records... (Total: {cursor.execute('SELECT COUNT(*) FROM sensor_readings').fetchone()[0]})")
            records = []
    
    # Insert remaining records
    if records:
        cursor.executemany('''
            INSERT INTO sensor_readings (device_id, temperature, humidity, gas_analog, gas_digital, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', records)
        conn.commit()
    
    total_count = cursor.execute('SELECT COUNT(*) FROM sensor_readings').fetchone()[0]
    
    # Show statistics
    cursor.execute('''
        SELECT 
            MIN(temperature) as min_temp,
            MAX(temperature) as max_temp,
            AVG(temperature) as avg_temp,
            MIN(humidity) as min_hum,
            MAX(humidity) as max_hum,
            AVG(humidity) as avg_hum,
            MIN(gas_analog) as min_gas,
            MAX(gas_analog) as max_gas,
            AVG(gas_analog) as avg_gas
        FROM sensor_readings
    ''')
    
    stats = cursor.fetchone()
    
    print("\n" + "="*50)
    print("Mock Data Generation Complete!")
    print("="*50)
    print(f"Total records: {total_count}")
    print(f"\nTemperature Statistics:")
    print(f"  Min: {stats[0]:.1f}°C")
    print(f"  Max: {stats[1]:.1f}°C")
    print(f"  Avg: {stats[2]:.1f}°C")
    print(f"\nHumidity Statistics:")
    print(f"  Min: {stats[3]:.1f}%")
    print(f"  Max: {stats[4]:.1f}%")
    print(f"  Avg: {stats[5]:.1f}%")
    print(f"\nGas Statistics:")
    print(f"  Min: {stats[6]}")
    print(f"  Max: {stats[7]}")
    print(f"  Avg: {stats[8]:.1f}")
    print("="*50)
    
    conn.close()
    print("\n✅ Mock data generated successfully!")

if __name__ == '__main__':
    generate_mock_data()
