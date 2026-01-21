"""
Migrate data from SQLite to Supabase
"""
import os
from dotenv import load_dotenv
from database.db import Database
import sqlite3

load_dotenv()

def migrate_data():
    """Migrate all data from SQLite to Supabase"""
    sqlite_path = os.getenv('DB_PATH', 'sensor_data.db')
    
    if not os.path.exists(sqlite_path):
        print(f"Error: {sqlite_path} not found")
        return
    
    # Connect to SQLite
    print(f"Reading data from SQLite: {sqlite_path}")
    sqlite_db = sqlite3.connect(sqlite_path)
    cursor = sqlite_db.cursor()
    
    # Get all data
    cursor.execute('''
        SELECT device_id, timestamp, temperature, humidity, gas_analog, gas_digital
        FROM sensor_readings
        ORDER BY timestamp ASC
    ''')
    rows = cursor.fetchall()
    sqlite_db.close()
    
    print(f"Found {len(rows)} records to migrate")
    
    if len(rows) == 0:
        print("No data to migrate")
        return
    
    # Connect to Supabase
    print("Connecting to Supabase...")
    supabase_db = Database(use_supabase=True)
    
    # Insert in batches
    batch_size = 100
    imported = 0
    errors = 0
    
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        for row in batch:
            try:
                supabase_db.insert_sensor_reading(
                    device_id=row[0] or 'ESP8266_001',
                    temperature=row[2],
                    humidity=row[3],
                    gas_analog=row[4] or 0,
                    gas_digital=row[5] or 0,
                    timestamp=row[1] if row[1] else None
                )
                imported += 1
            except Exception as e:
                print(f"Error inserting row {i}: {e}")
                errors += 1
        
        print(f"Progress: {min(i+batch_size, len(rows))}/{len(rows)} records processed ({imported} imported, {errors} errors)")
    
    print(f"\n✓ Migration complete!")
    print(f"  Total records: {len(rows)}")
    print(f"  Successfully migrated: {imported}")
    print(f"  Errors: {errors}")

if __name__ == '__main__':
    migrate_data()
