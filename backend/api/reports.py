"""
Report Generation API Endpoints
Provides endpoints for generating PDF reports with charts
"""

from flask import Blueprint, request, jsonify, send_file
import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime
import io
import base64
import warnings
warnings.filterwarnings('ignore')

# Try to import plotly for chart generation
try:
    import plotly.graph_objects as go
    import plotly.express as px
    PLOTLY_AVAILABLE = True
except ImportError:
    PLOTLY_AVAILABLE = False

# Try to import PDF generation libraries
try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

reports_bp = Blueprint('reports', __name__)

DB_PATH = 'sensor_data.db'

def generate_chart_images(df, start_date, end_date):
    """Generate chart images for PDF report"""
    if not PLOTLY_AVAILABLE:
        return None
    
    charts = {}
    
    try:
        # Time series chart
        fig = go.Figure()
        
        fig.add_trace(go.Scatter(
            x=df['timestamp'],
            y=df['temperature'],
            name='Temperature',
            line=dict(color='#ff6b6b', width=2),
            mode='lines'
        ))
        
        fig.add_trace(go.Scatter(
            x=df['timestamp'],
            y=df['humidity'],
            name='Humidity',
            line=dict(color='#4ecdc4', width=2),
            mode='lines',
            yaxis='y2'
        ))
        
        fig.update_layout(
            title='Sensor Readings Over Time',
            xaxis_title='Time',
            yaxis=dict(title='Temperature (°C)', side='left', color='#ff6b6b'),
            yaxis2=dict(title='Humidity (%)', side='right', overlaying='y', color='#4ecdc4'),
            height=400,
            template='plotly_white',
            showlegend=True
        )
        
        charts['time_series'] = fig.to_image(format='png', width=800, height=400)
        
        # Correlation heatmap
        corr_matrix = df[['temperature', 'humidity', 'gas_analog']].corr()
        
        fig2 = go.Figure(data=go.Heatmap(
            z=corr_matrix.values,
            x=['Temperature', 'Humidity', 'Gas Level'],
            y=['Temperature', 'Humidity', 'Gas Level'],
            colorscale='RdBu',
            zmid=0,
            text=corr_matrix.values,
            texttemplate='%{text:.2f}',
            textfont={"size": 14},
            colorbar=dict(title="Correlation")
        ))
        
        fig2.update_layout(
            title='Sensor Correlation Matrix',
            height=400,
            template='plotly_white'
        )
        
        charts['correlation'] = fig2.to_image(format='png', width=600, height=400)
        
        # Distribution charts
        fig3 = go.Figure()
        
        fig3.add_trace(go.Histogram(
            x=df['temperature'],
            name='Temperature',
            nbinsx=30,
            opacity=0.7
        ))
        
        fig3.update_layout(
            title='Temperature Distribution',
            xaxis_title='Temperature (°C)',
            yaxis_title='Frequency',
            height=300,
            template='plotly_white'
        )
        
        charts['temp_dist'] = fig3.to_image(format='png', width=600, height=300)
        
        return charts
    except Exception as e:
        print(f"Error generating charts: {e}")
        return None

@reports_bp.route('/generate', methods=['POST'])
def generate_report():
    """Generate PDF report with charts"""
    try:
        data = request.get_json()
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        format_type = data.get('format', 'json')  # 'json' or 'pdf'
        
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
        
        # Generate report data
        report_data = {
            'period': {
                'start': start_date,
                'end': end_date
            },
            'statistics': stats,
            'correlation': corr_matrix.to_dict(),
            'total_readings': len(df)
        }
        
        if format_type == 'pdf' and REPORTLAB_AVAILABLE:
            # Generate PDF report
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            elements = []
            
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#000000'),
                spaceAfter=30,
                alignment=1  # Center
            )
            
            # Title
            elements.append(Paragraph('Environmental Monitoring Report', title_style))
            elements.append(Spacer(1, 0.2*inch))
            
            # Period
            period_text = f"Period: {start_date} to {end_date}"
            elements.append(Paragraph(period_text, styles['Normal']))
            elements.append(Spacer(1, 0.2*inch))
            
            # Statistics table
            data = [
                ['Metric', 'Count', 'Mean', 'Median', 'Std Dev', 'Min', 'Max']
            ]
            
            for sensor in ['temperature', 'humidity', 'gas_analog']:
                s = stats[sensor]
                data.append([
                    sensor.capitalize(),
                    str(s['count']),
                    f"{s['mean']:.2f}",
                    f"{s['median']:.2f}",
                    f"{s['std']:.2f}",
                    f"{s['min']:.2f}",
                    f"{s['max']:.2f}"
                ])
            
            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            elements.append(table)
            elements.append(Spacer(1, 0.3*inch))
            
            # Build PDF
            doc.build(elements)
            buffer.seek(0)
            
            return send_file(
                buffer,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=f'report_{start_date}_{end_date}.pdf'
            )
        else:
            # Return JSON report
            return jsonify(report_data), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
