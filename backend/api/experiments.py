"""
Experiments API
Endpoints for experiment tracking and management
"""

from flask import Blueprint, request, jsonify
from flask_cors import CORS
import sys
import os

# Add models directory to path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models'))

from models.experiments import (
    init_experiments_tables,
    create_experiment,
    get_experiments,
    get_experiment,
    update_experiment,
    delete_experiment,
    add_annotation,
    get_annotations,
    delete_annotation
)

experiments_bp = Blueprint('experiments', __name__)

@experiments_bp.route('/experiments', methods=['GET'])
def list_experiments():
    """Get list of experiments"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        tags = request.args.get('tags')
        
        experiments = get_experiments(start_date, end_date, tags)
        return jsonify(experiments), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@experiments_bp.route('/experiments', methods=['POST'])
def create_experiment_endpoint():
    """Create a new experiment"""
    try:
        data = request.get_json()
        
        title = data.get('title')
        description = data.get('description', '')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        tags = data.get('tags')
        created_by = data.get('created_by')
        conditions = data.get('conditions')
        
        if not title or not start_date or not end_date:
            return jsonify({'error': 'Title, start_date, and end_date are required'}), 400
        
        experiment_id = create_experiment(
            title, description, start_date, end_date, 
            tags, created_by, conditions
        )
        
        return jsonify({
            'id': experiment_id,
            'message': 'Experiment created successfully'
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@experiments_bp.route('/experiments/<int:experiment_id>', methods=['GET'])
def get_experiment_endpoint(experiment_id):
    """Get a single experiment"""
    try:
        experiment = get_experiment(experiment_id)
        if experiment:
            # Get annotations
            annotations = get_annotations(experiment_id)
            experiment['annotations'] = annotations
            return jsonify(experiment), 200
        else:
            return jsonify({'error': 'Experiment not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@experiments_bp.route('/experiments/<int:experiment_id>', methods=['PUT'])
def update_experiment_endpoint(experiment_id):
    """Update an experiment"""
    try:
        data = request.get_json()
        
        update_experiment(
            experiment_id,
            title=data.get('title'),
            description=data.get('description'),
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            tags=data.get('tags'),
            conditions=data.get('conditions')
        )
        
        return jsonify({'message': 'Experiment updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@experiments_bp.route('/experiments/<int:experiment_id>', methods=['DELETE'])
def delete_experiment_endpoint(experiment_id):
    """Delete an experiment"""
    try:
        delete_experiment(experiment_id)
        return jsonify({'message': 'Experiment deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@experiments_bp.route('/experiments/<int:experiment_id>/annotations', methods=['POST'])
def add_annotation_endpoint(experiment_id):
    """Add an annotation to an experiment"""
    try:
        data = request.get_json()
        
        timestamp = data.get('timestamp')
        note = data.get('note')
        
        if not timestamp or not note:
            return jsonify({'error': 'timestamp and note are required'}), 400
        
        annotation_id = add_annotation(experiment_id, timestamp, note)
        
        return jsonify({
            'id': annotation_id,
            'message': 'Annotation added successfully'
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@experiments_bp.route('/experiments/<int:experiment_id>/annotations', methods=['GET'])
def get_annotations_endpoint(experiment_id):
    """Get all annotations for an experiment"""
    try:
        annotations = get_annotations(experiment_id)
        return jsonify(annotations), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@experiments_bp.route('/annotations/<int:annotation_id>', methods=['DELETE'])
def delete_annotation_endpoint(annotation_id):
    """Delete an annotation"""
    try:
        delete_annotation(annotation_id)
        return jsonify({'message': 'Annotation deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
