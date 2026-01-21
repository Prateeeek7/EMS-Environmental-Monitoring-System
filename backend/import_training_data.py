"""
Import training data from training_data.json to database (SQLite or Supabase)
"""
import json
import os
from dotenv import load_dotenv
from database.db import Database
from datetime import datetime

load_dotenv()

def import_training_data():
    """Import all data from training_data.json to the database"""
    json_file = 'training_data.json'
    
    if not os.path.exists(json_file):
        print(f"Error: {json_file} not found")
        return
    
    print(f"Loading data from {json_file}...")
    with open(json_file, 'r') as f:
        data = json.load(f)
    
    records = data.get('data', [])
    metadata = data.get('metadata', {})
    
    print(f"Found {len(records)} records to import")
    print(f"Metadata: {metadata.get('description', 'N/A')}")
    
    # Initialize database
    db = Database()
    print(f"Using database: {db.db_type}")
    
    # Import in batches
    batch_size = 100
    imported = 0
    errors = 0
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        for record in batch:
            try:
                # Parse timestamp if it's a string
                timestamp = record.get('timestamp')
                if isinstance(timestamp, str):
                    # Convert to ISO format if needed
                    try:
                        dt = datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S')
                        timestamp = dt.isoformat()
                    except:
                        pass  # Keep as is if parsing fails
                
                db.insert_sensor_reading(
                    device_id=record.get('device_id', 'ESP8266_001'),
                    temperature=record.get('temperature'),
                    humidity=record.get('humidity'),
                    gas_analog=record.get('gas_analog', 0),
                    gas_digital=record.get('gas_digital', 0),
                    timestamp=timestamp
                )
                imported += 1
            except Exception as e:
                print(f"Error importing record {record.get('id', 'unknown')}: {e}")
                errors += 1
        
        print(f"Progress: {min(i+batch_size, len(records))}/{len(records)} records processed ({imported} imported, {errors} errors)")
    
    print(f"\n✓ Import complete!")
    print(f"  Total records: {len(records)}")
    print(f"  Successfully imported: {imported}")
    print(f"  Errors: {errors}")

if __name__ == '__main__':
    import_training_data()
