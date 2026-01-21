"""
Experiment Models
Database models for experiment tracking
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'sensor_data.db')

def init_experiments_tables():
    """Initialize experiments and annotations tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create experiments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS experiments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            start_date DATETIME NOT NULL,
            end_date DATETIME NOT NULL,
            tags TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT,
            conditions TEXT
        )
    ''')
    
    # Create experiment_annotations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS experiment_annotations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            experiment_id INTEGER NOT NULL,
            timestamp DATETIME NOT NULL,
            note TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE
        )
    ''')
    
    # Create indexes
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_experiments_dates 
        ON experiments(start_date, end_date)
    ''')
    
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_annotations_experiment 
        ON experiment_annotations(experiment_id)
    ''')
    
    conn.commit()
    conn.close()

def create_experiment(title, description, start_date, end_date, tags=None, created_by=None, conditions=None):
    """Create a new experiment"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO experiments (title, description, start_date, end_date, tags, created_by, conditions)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (title, description, start_date, end_date, tags, created_by, conditions))
    
    experiment_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return experiment_id

def get_experiments(start_date=None, end_date=None, tags=None):
    """Get experiments with optional filtering"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    query = "SELECT * FROM experiments WHERE 1=1"
    params = []
    
    if start_date:
        query += " AND start_date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND end_date <= ?"
        params.append(end_date)
    if tags:
        query += " AND tags LIKE ?"
        params.append(f'%{tags}%')
    
    query += " ORDER BY created_at DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    experiments = []
    for row in rows:
        experiments.append({
            'id': row[0],
            'title': row[1],
            'description': row[2],
            'start_date': row[3],
            'end_date': row[4],
            'tags': row[5],
            'created_at': row[6],
            'created_by': row[7],
            'conditions': row[8]
        })
    
    return experiments

def get_experiment(experiment_id):
    """Get a single experiment by ID"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM experiments WHERE id = ?', (experiment_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            'id': row[0],
            'title': row[1],
            'description': row[2],
            'start_date': row[3],
            'end_date': row[4],
            'tags': row[5],
            'created_at': row[6],
            'created_by': row[7],
            'conditions': row[8]
        }
    return None

def update_experiment(experiment_id, title=None, description=None, start_date=None, end_date=None, tags=None, conditions=None):
    """Update an experiment"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    updates = []
    params = []
    
    if title is not None:
        updates.append("title = ?")
        params.append(title)
    if description is not None:
        updates.append("description = ?")
        params.append(description)
    if start_date is not None:
        updates.append("start_date = ?")
        params.append(start_date)
    if end_date is not None:
        updates.append("end_date = ?")
        params.append(end_date)
    if tags is not None:
        updates.append("tags = ?")
        params.append(tags)
    if conditions is not None:
        updates.append("conditions = ?")
        params.append(conditions)
    
    if updates:
        params.append(experiment_id)
        query = f"UPDATE experiments SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, params)
        conn.commit()
    
    conn.close()
    return True

def delete_experiment(experiment_id):
    """Delete an experiment and its annotations"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM experiments WHERE id = ?', (experiment_id,))
    conn.commit()
    conn.close()
    
    return True

def add_annotation(experiment_id, timestamp, note):
    """Add an annotation to an experiment"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO experiment_annotations (experiment_id, timestamp, note)
        VALUES (?, ?, ?)
    ''', (experiment_id, timestamp, note))
    
    annotation_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return annotation_id

def get_annotations(experiment_id):
    """Get all annotations for an experiment"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM experiment_annotations 
        WHERE experiment_id = ? 
        ORDER BY timestamp ASC
    ''', (experiment_id,))
    
    rows = cursor.fetchall()
    conn.close()
    
    annotations = []
    for row in rows:
        annotations.append({
            'id': row[0],
            'experiment_id': row[1],
            'timestamp': row[2],
            'note': row[3],
            'created_at': row[4]
        })
    
    return annotations

def delete_annotation(annotation_id):
    """Delete an annotation"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM experiment_annotations WHERE id = ?', (annotation_id,))
    conn.commit()
    conn.close()
    
    return True
