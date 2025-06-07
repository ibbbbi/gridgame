#!/usr/bin/env python3
"""
Enhanced Web Application for European Power Grid Builder v2.0
Includes Flask-SocketIO for real-time WebSocket communication
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit
import json
import uuid
import threading
import time
from typing import Dict, Any

# Import existing game engines
try:
    from power_grid_game import PowerGridGame
    from grid_types import Point
    from european_grid_game import EuropeanGridGame
    from websocket_handler import GridWebSocketHandler
except ImportError as e:
    print(f"Warning: Could not import some modules: {e}")
    # Create placeholder classes for development
    class PowerGridGame:
        def __init__(self):
            self.components = {}
            self.lines = {}
            self.grid_nodes = {}
        
        def place_component(self, comp_type, position):
            return True
        
        def simulate(self):
            from types import SimpleNamespace
            return SimpleNamespace(success=True, load_served=100, efficiency=85)
    
    class EuropeanGridGame:
        def __init__(self):
            self.budget = 500000
            self.components = {}
            self.component_types = {}
        
        def get_game_status(self):
            from types import SimpleNamespace
            stats = SimpleNamespace(
                compliance_score=95.0,
                reliability_score=92.0,
                efficiency_score=88.0,
                frequency_violations=0,
                voltage_violations=0,
                n_minus_1_failures=0
            )
            return {
                'budget': self.budget,
                'frequency': 50.000,
                'frequency_deviation_mhz': 5.0,
                'system_state': 'normal',
                'load_demand': 1200,
                'generation_capacity': 1400,
                'fcr_available': 3000,
                'frr_available': 1500,
                'stats': stats,
                'components_count': len(self.components),
                'lines_count': 0,
                'time_elapsed': time.time()
            }
    
    class GridWebSocketHandler:
        def __init__(self, game):
            self.game = game
    
    Point = lambda x, y: type('Point', (), {'x': x, 'y': y})

app = Flask(__name__)
app.config['SECRET_KEY'] = 'power-grid-game-secret-key'

# Initialize SocketIO with CORS support
socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

# Global game instances
game = PowerGridGame()
european_game = EuropeanGridGame()
ws_handler = GridWebSocketHandler(european_game)

# Simulation control
simulation_running = False
simulation_thread = None

def run_simulation():
    """Background simulation thread for European game"""
    global simulation_running
    while simulation_running:
        try:
            # Step the European game simulation
            # european_game.step(1.0)  # Commented out if method doesn't exist yet
            
            # Emit real-time data to all connected clients
            if hasattr(european_game, 'get_game_status'):
                status = european_game.get_game_status()
                socketio.emit('realtime_update', {
                    'frequency': status['frequency'],
                    'frequency_deviation_mhz': status['frequency_deviation_mhz'],
                    'system_state': status['system_state'],
                    'fcr_available': status['fcr_available'],
                    'frr_available': status['frr_available'],
                    'compliance_score': status['stats'].compliance_score,
                    'timestamp': time.time()
                })
            
            time.sleep(0.1)  # 100ms update rate
        except Exception as e:
            print(f"Simulation error: {e}")
            time.sleep(1)

@app.route('/')
def index():
    """Serve the main game interface"""
    return render_template('index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

# Basic game API endpoints
@app.route('/api/game/status')
def get_game_status():
    """Get current game status"""
    status = european_game.get_game_status()
    return jsonify(status)

@app.route('/api/game/components')
def get_components():
    """Get all grid components"""
    components_data = []
    for comp in game.components.values():
        components_data.append({
            'id': getattr(comp, 'id', 'unknown'),
            'type': getattr(comp, 'type', 'unknown'),
            'position': {'x': getattr(comp.position, 'x', 0), 'y': getattr(comp.position, 'y', 0)},
            'capacity': getattr(comp, 'capacity', 0),
            'cost': getattr(comp, 'cost', 0),
            'voltage': getattr(comp, 'voltage', 0),
            'isActive': getattr(comp, 'is_active', True)
        })
    return jsonify(components_data)

@app.route('/api/game/lines')
def get_lines():
    """Get all power lines"""
    lines_data = []
    for line in game.lines.values():
        lines_data.append({
            'id': getattr(line, 'id', 'unknown'),
            'type': getattr(line, 'type', 'unknown'),
            'from': getattr(line, 'from_id', ''),
            'to': getattr(line, 'to_id', ''),
            'length': getattr(line, 'length', 0),
            'capacity': getattr(line, 'capacity', 0),
            'cost': getattr(line, 'cost', 0),
            'isActive': getattr(line, 'is_active', True)
        })
    return jsonify(lines_data)

@app.route('/api/game/nodes')
def get_nodes():
    """Get all grid nodes"""
    nodes_data = []
    for node in game.grid_nodes.values():
        nodes_data.append({
            'id': getattr(node, 'id', 'unknown'),
            'position': {'x': getattr(node.position, 'x', 0), 'y': getattr(node.position, 'y', 0)},
            'voltage': getattr(node, 'voltage', 0),
            'connectedComponents': getattr(node, 'connected_components', []),
            'connectedLines': getattr(node, 'connected_lines', []),
            'isVisible': getattr(node, 'is_visible', True)
        })
    return jsonify(nodes_data)

# European grid API endpoints
@app.route('/api/european/status')
def get_european_status():
    """Get detailed European grid status"""
    return jsonify(european_game.get_game_status())

@app.route('/api/european/realtime')
def get_european_realtime():
    """Get real-time European grid data"""
    status = european_game.get_game_status()
    return jsonify({
        'frequency': status['frequency'],
        'frequency_deviation_mhz': status['frequency_deviation_mhz'],
        'system_state': status['system_state'],
        'fcr_available': status['fcr_available'],
        'frr_available': status['frr_available'],
        'fcr_activation': 0,  # Will be populated by actual game logic
        'frr_activation': 0,  # Will be populated by actual game logic
        'compliance_score': status['stats'].compliance_score,
        'active_events': [],  # Will be populated by actual game logic
        'voltage_violations': status['stats'].voltage_violations,
        'thermal_violations': 0,  # Will be populated by actual game logic
        'timestamp': status['time_elapsed']
    })

@app.route('/api/european/components')
def get_european_components():
    """Get European component specifications"""
    return jsonify(european_game.component_types)

@app.route('/api/european/start_simulation', methods=['POST'])
def start_european_simulation():
    """Start European grid simulation"""
    global simulation_running, simulation_thread
    
    if simulation_running:
        return jsonify({'success': False, 'message': 'Simulation already running'})
    
    try:
        simulation_running = True
        simulation_thread = threading.Thread(target=run_simulation, daemon=True)
        simulation_thread.start()
        
        return jsonify({'success': True, 'message': 'European simulation started'})
    except Exception as e:
        simulation_running = False
        return jsonify({'success': False, 'message': f'Failed to start simulation: {str(e)}'})

@app.route('/api/european/stop_simulation', methods=['POST'])
def stop_european_simulation():
    """Stop European grid simulation"""
    global simulation_running
    simulation_running = False
    return jsonify({'success': True, 'message': 'European simulation stopped'})

# WebSocket Events
@socketio.on('connect')
def handle_connect():
    """Handle WebSocket connection"""
    print('Client connected')
    emit('status', {'message': 'Connected to European Power Grid Builder v2.0'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection"""
    print('Client disconnected')

@socketio.on('get_status')
def handle_get_status():
    """Send current game status via WebSocket"""
    status = european_game.get_game_status()
    emit('status_update', status)

@socketio.on('start_simulation')
def handle_start_simulation():
    """Start simulation via WebSocket"""
    global simulation_running, simulation_thread
    
    if not simulation_running:
        simulation_running = True
        simulation_thread = threading.Thread(target=run_simulation, daemon=True)
        simulation_thread.start()
        emit('simulation_started', {'success': True})
    else:
        emit('simulation_started', {'success': False, 'message': 'Already running'})

@socketio.on('stop_simulation')
def handle_stop_simulation():
    """Stop simulation via WebSocket"""
    global simulation_running
    simulation_running = False
    emit('simulation_stopped', {'success': True})

@socketio.on('place_component')
def handle_place_component(data):
    """Handle component placement via WebSocket"""
    try:
        # Extract data
        comp_type = data.get('type')
        x = data.get('x', 0)
        y = data.get('y', 0)
        
        # Use Point class if available
        position = Point(x, y) if 'Point' in globals() else type('Point', (), {'x': x, 'y': y})
        
        # Place component
        success = game.place_component(comp_type, position)
        
        if success:
            emit('component_placed', {
                'success': True, 
                'message': f'{comp_type.title()} placed successfully'
            })
        else:
            emit('component_placed', {
                'success': False, 
                'message': 'Failed to place component'
            })
    except Exception as e:
        emit('component_placed', {
            'success': False, 
            'message': f'Error: {str(e)}'
        })

@socketio.on('n1_analysis')
def handle_n1_analysis():
    """Handle N-1 analysis request via WebSocket"""
    try:
        # Placeholder N-1 analysis results
        results = [
            {
                'contingency_id': 'LINE_001',
                'component_type': 'transmission_line',
                'component_id': 'line_001',
                'converged': True,
                'max_voltage_violation': 0.02,
                'max_thermal_violation': 85.5,
                'load_shed': 0,
                'critical': False
            },
            {
                'contingency_id': 'GEN_001',
                'component_type': 'generator',
                'component_id': 'gen_001',
                'converged': True,
                'max_voltage_violation': 0.05,
                'max_thermal_violation': 95.2,
                'load_shed': 50,
                'critical': False
            }
        ]
        
        emit('n1_analysis_results', results)
    except Exception as e:
        emit('n1_analysis_results', {'error': f'N-1 analysis failed: {str(e)}'})

@socketio.on('get_compliance_report')
def handle_get_compliance_report():
    """Get compliance report via WebSocket"""
    try:
        status = european_game.get_game_status()
        stats = status['stats']
        
        report = {
            'frequency_control': {
                'fcr_activation_time': 'N/A',
                'frr_activation_time': 'N/A',
                'frequency_violations': stats.frequency_violations,
                'worst_frequency_deviation': 0.0
            },
            'voltage_quality': {
                'voltage_violations': stats.voltage_violations,
                'worst_voltage': 1.0
            },
            'system_security': {
                'n1_secure': stats.n_minus_1_failures == 0,
                'thermal_violations': 0,
                'last_n1_analysis': None
            },
            'overall': {
                'compliance_score': stats.compliance_score,
                'reliability_score': stats.reliability_score,
                'efficiency_score': stats.efficiency_score
            },
            'timestamp': status['time_elapsed']
        }
        
        emit('compliance_report', report)
    except Exception as e:
        emit('compliance_report', {'error': f'Failed to generate compliance report: {str(e)}'})

if __name__ == '__main__':
    print("Starting European Power Grid Builder v2.0 Web Server...")
    print("WebSocket support enabled")
    print("Access the application at: http://localhost:5000")
    
    # Run with SocketIO
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
