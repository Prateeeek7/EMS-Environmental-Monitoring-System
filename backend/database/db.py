"""
Database Abstraction Layer
Supports both SQLite (local) and Supabase (cloud)
"""
import os
from typing import Optional, List, Dict, Any
from datetime import datetime
import pandas as pd

# Try to import Supabase
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("Supabase not available. Using SQLite only.")

import sqlite3

class Database:
    """Unified database interface for SQLite and Supabase"""
    
    def __init__(self, use_supabase: bool = None):
        """
        Initialize database connection
        
        Args:
            use_supabase: If True, use Supabase; If False, use SQLite; If None, auto-detect from env
        """
        self.use_supabase = use_supabase
        
        if use_supabase is None:
            # Auto-detect from environment
            self.use_supabase = os.getenv('USE_SUPABASE', 'false').lower() == 'true'
        
        if self.use_supabase and SUPABASE_AVAILABLE:
            self._init_supabase()
        else:
            self._init_sqlite()
    
    def _init_supabase(self):
        """Initialize Supabase connection"""
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment")
        
        self.client: Client = create_client(supabase_url, supabase_key)
        self.db_type = 'supabase'
        print("✓ Connected to Supabase")
    
    def _init_sqlite(self):
        """Initialize SQLite connection"""
        self.db_path = os.getenv('DB_PATH', 'sensor_data.db')
        self.db_type = 'sqlite'
        self._ensure_table_exists()
        print(f"✓ Connected to SQLite: {self.db_path}")
    
    def _ensure_table_exists(self):
        """Ensure SQLite table exists"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sensor_readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                device_id TEXT,
                temperature REAL,
                humidity REAL,
                gas_analog INTEGER,
                gas_digital INTEGER
            )
        ''')
        conn.commit()
        conn.close()
    
    def insert_sensor_reading(self, device_id: str, temperature: float, 
                             humidity: float, gas_analog: int, gas_digital: int,
                             timestamp: Optional[str] = None) -> Dict[str, Any]:
        """Insert a new sensor reading"""
        if timestamp is None:
            timestamp = datetime.now().isoformat()
        
        data = {
            'device_id': device_id,
            'temperature': temperature,
            'humidity': humidity,
            'gas_analog': gas_analog,
            'gas_digital': gas_digital,
            'timestamp': timestamp
        }
        
        if self.use_supabase and SUPABASE_AVAILABLE:
            result = self.client.table('sensor_readings').insert(data).execute()
            return result.data[0] if result.data else None
        else:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            if timestamp:
                cursor.execute('''
                    INSERT INTO sensor_readings 
                    (device_id, temperature, humidity, gas_analog, gas_digital, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (device_id, temperature, humidity, gas_analog, gas_digital, timestamp))
            else:
                cursor.execute('''
                    INSERT INTO sensor_readings 
                    (device_id, temperature, humidity, gas_analog, gas_digital)
                    VALUES (?, ?, ?, ?, ?)
                ''', (device_id, temperature, humidity, gas_analog, gas_digital))
            conn.commit()
            reading_id = cursor.lastrowid
            conn.close()
            
            # Fetch the inserted record
            return self.get_sensor_reading_by_id(reading_id)
    
    def get_sensor_readings(self, limit: int = 100, start_date: Optional[str] = None, 
                           end_date: Optional[str] = None, device_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get sensor readings with optional filters"""
        if self.use_supabase and SUPABASE_AVAILABLE:
            query = self.client.table('sensor_readings').select('*')
            
            if device_id:
                query = query.eq('device_id', device_id)
            if start_date:
                query = query.gte('timestamp', start_date)
            if end_date:
                query = query.lte('timestamp', end_date)
            
            query = query.order('timestamp', desc=True).limit(limit)
            result = query.execute()
            return result.data if result.data else []
        else:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            conditions = []
            params = []
            
            if device_id:
                conditions.append("device_id = ?")
                params.append(device_id)
            if start_date:
                conditions.append("timestamp >= ?")
                params.append(start_date)
            if end_date:
                conditions.append("timestamp <= ?")
                params.append(end_date)
            
            where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
            query = f'''
                SELECT id, timestamp, device_id, temperature, humidity, gas_analog, gas_digital
                FROM sensor_readings
                {where_clause}
                ORDER BY timestamp DESC
                LIMIT ?
            '''
            params.append(limit)
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            conn.close()
            
            return [{
                'id': row[0],
                'timestamp': row[1],
                'device_id': row[2],
                'temperature': row[3],
                'humidity': row[4],
                'gas_analog': row[5],
                'gas_digital': row[6]
            } for row in rows]
    
    def get_latest_reading(self, device_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get the latest sensor reading"""
        readings = self.get_sensor_readings(limit=1, device_id=device_id)
        return readings[0] if readings else None
    
    def get_statistics(self, hours: int = 24) -> Dict[str, Any]:
        """Get statistics for the last N hours"""
        from datetime import datetime, timedelta
        start_date = (datetime.now() - timedelta(hours=hours)).isoformat()
        
        if self.use_supabase and SUPABASE_AVAILABLE:
            result = self.client.table('sensor_readings').select('temperature, humidity, gas_analog').gte('timestamp', start_date).execute()
            data = result.data if result.data else []
        else:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('''
                SELECT temperature, humidity, gas_analog
                FROM sensor_readings
                WHERE timestamp >= ?
            ''', (start_date,))
            data = [{'temperature': r[0], 'humidity': r[1], 'gas_analog': r[2]} 
                   for r in cursor.fetchall()]
            conn.close()
        
        if not data:
            return {
                'total_readings': 0,
                'temperature': {'average': 0, 'min': 0, 'max': 0},
                'humidity': {'average': 0, 'min': 0, 'max': 0},
                'gas': {'average': 0, 'max': 0}
            }
        
        df = pd.DataFrame(data)
        return {
            'total_readings': len(df),
            'temperature': {
                'average': round(df['temperature'].mean(), 1),
                'min': round(df['temperature'].min(), 1),
                'max': round(df['temperature'].max(), 1)
            },
            'humidity': {
                'average': round(df['humidity'].mean(), 1),
                'min': round(df['humidity'].min(), 1),
                'max': round(df['humidity'].max(), 1)
            },
            'gas': {
                'average': round(df['gas_analog'].mean(), 1),
                'max': round(df['gas_analog'].max(), 1)
            }
        }
    
    def get_sensor_reading_by_id(self, reading_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific reading by ID"""
        if self.use_supabase and SUPABASE_AVAILABLE:
            result = self.client.table('sensor_readings').select('*').eq('id', reading_id).execute()
            return result.data[0] if result.data else None
        else:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, timestamp, device_id, temperature, humidity, gas_analog, gas_digital
                FROM sensor_readings
                WHERE id = ?
            ''', (reading_id,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return {
                    'id': row[0],
                    'timestamp': row[1],
                    'device_id': row[2],
                    'temperature': row[3],
                    'humidity': row[4],
                    'gas_analog': row[5],
                    'gas_digital': row[6]
                }
            return None
    
    def load_dataframe(self, start_date: Optional[str] = None, 
                      end_date: Optional[str] = None, 
                      limit: Optional[int] = None) -> pd.DataFrame:
        """Load data as pandas DataFrame (for ML training)"""
        if self.use_supabase and SUPABASE_AVAILABLE:
            query = self.client.table('sensor_readings').select('timestamp, temperature, humidity, gas_analog, gas_digital')
            
            if start_date:
                query = query.gte('timestamp', start_date)
            if end_date:
                query = query.lte('timestamp', end_date)
            
            query = query.order('timestamp', desc=False)
            if limit:
                query = query.limit(limit)
            
            result = query.execute()
            df = pd.DataFrame(result.data if result.data else [])
        else:
            conn = sqlite3.connect(self.db_path)
            query = "SELECT timestamp, temperature, humidity, gas_analog, gas_digital FROM sensor_readings"
            conditions = []
            
            if start_date:
                conditions.append(f"timestamp >= '{start_date}'")
            if end_date:
                conditions.append(f"timestamp <= '{end_date}'")
            
            if conditions:
                query += " WHERE " + " AND ".join(conditions)
            
            query += " ORDER BY timestamp ASC"
            if limit:
                query += f" LIMIT {limit}"
            
            df = pd.read_sql_query(query, conn)
            conn.close()
        
        if not df.empty:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.sort_values('timestamp').reset_index(drop=True)
        
        return df
