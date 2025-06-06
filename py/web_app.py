#!/usr/bin/env python3
"""
Web-based GUI for Power Grid Builder - Flask Application
Provides an interactive web interface for the power grid simulation game.
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
import json
import uuid
import threading
import time
from typing import Dict, Any
from power_grid_game import PowerGridGame
from grid_types import Point
from european_grid_game import EuropeanGridGame

app = Flask(__name__)
app.secret_key = 'power-grid-game-secret-key'

# Global game instances
game = PowerGridGame()  # Original game
european_game = EuropeanGridGame()  # New realistic European game

# Game simulation thread
simulation_running = False
simulation_thread = None

def run_simulation():
    """Background simulation thread for European game"""
    global simulation_running
    while simulation_running:
        european_game.step(1.0)  # 1 second time step
        time.sleep(1)  # Real-time simulation

@app.route('/')
def index():
    """Serve the main game interface"""
    return render_template('index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

@app.route('/api/game/status')
def get_game_status():
    """Get current European game status"""
    status = european_game.get_game_status()
    return jsonify({
        'budget': status['budget'],
        'frequency': status['frequency'],
        'frequency_deviation_mhz': status['frequency_deviation_mhz'],
        'system_state': status['system_state'],
        'load_demand': status['load_demand'],
        'generation_capacity': status['generation_capacity'],
        'fcr_available': status['fcr_available'],
        'frr_available': status['frr_available'],
        'reliability_score': status['stats'].reliability_score,
        'compliance_score': status['stats'].compliance_score,
        'efficiency_score': status['stats'].efficiency_score,
        'components_count': status['components_count'],
        'lines_count': status['lines_count'],
        'time_elapsed': status['time_elapsed']
    })

@app.route('/api/game/components')
def get_components():
    """Get all grid components"""
    components_data = []
    for comp in game.components.values():
        components_data.append({
            'id': comp.id,
            'type': comp.type,
            'position': {'x': comp.position.x, 'y': comp.position.y},
            'capacity': comp.capacity,
            'cost': comp.cost,
            'voltage': comp.voltage,
            'isActive': comp.is_active
        })
    return jsonify(components_data)

@app.route('/api/game/lines')
def get_lines():
    """Get all power lines"""
    lines_data = []
    for line in game.lines.values():
        lines_data.append({
            'id': line.id,
            'type': line.type,
            'from': line.from_id,
            'to': line.to_id,
            'length': line.length,
            'capacity': line.capacity,
            'cost': line.cost,
            'isActive': line.is_active
        })
    return jsonify(lines_data)

@app.route('/api/game/nodes')
def get_nodes():
    """Get all grid nodes"""
    nodes_data = []
    for node in game.grid_nodes.values():
        nodes_data.append({
            'id': node.id,
            'position': {'x': node.position.x, 'y': node.position.y},
            'voltage': node.voltage,
            'connectedComponents': node.connected_components,
            'connectedLines': node.connected_lines,
            'isVisible': node.is_visible
        })
    return jsonify(nodes_data)

@app.route('/api/game/place-component', methods=['POST'])
def place_component():
    """Place a new component on the grid"""
    data = request.json
    try:
        position = Point(x=data['x'], y=data['y'])
        component_type = data['type']
        
        success = game.place_component(component_type, position)
        
        if success:
            return jsonify({'success': True, 'message': f'{component_type.title()} placed successfully'})
        else:
            return jsonify({'success': False, 'message': 'Failed to place component (insufficient budget?)'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

@app.route('/api/game/place-line', methods=['POST'])
def place_line():
    """Place a new transmission line"""
    data = request.json
    try:
        line_type = data['type']
        from_id = data['from']
        to_id = data['to']
        
        success = game.place_line(line_type, from_id, to_id)
        
        if success:
            return jsonify({'success': True, 'message': f'{line_type.replace("-", " ").title()} placed successfully'})
        else:
            return jsonify({'success': False, 'message': 'Failed to place line (insufficient budget or invalid connection?)'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

@app.route('/api/game/place-node', methods=['POST'])
def place_node():
    """Place a new grid node"""
    data = request.json
    try:
        position = Point(x=data['x'], y=data['y'])
        voltage = data.get('voltage', 110)
        
        success = game.place_grid_node(position, voltage)
        
        if success:
            return jsonify({'success': True, 'message': 'Grid node placed successfully'})
        else:
            return jsonify({'success': False, 'message': 'Failed to place node'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

@app.route('/api/game/simulate', methods=['POST'])
def run_simulation():
    """Run grid simulation"""
    try:
        result = game.simulate()
        
        return jsonify({
            'success': result.success,
            'loadServed': result.load_served,
            'efficiency': result.efficiency,
            'reliability': result.reliability,
            'powerFlow': result.power_flow,
            'voltages': result.voltages,
            'errors': result.errors,
            'warnings': result.warnings,
            'frequency': result.frequency,
            'systemStability': result.system_stability,
            'totalLosses': result.total_losses,
            'convergence': result.convergence,
            'iterations': result.iterations,
            'n1Analysis': [
                {
                    'contingencyLine': analysis.contingency_line,
                    'success': analysis.success,
                    'overloadedLines': analysis.overloaded_lines,
                    'voltageViolations': analysis.voltage_violations,
                    'loadShed': analysis.load_shed
                } for analysis in result.n1_analysis
            ]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Simulation error: {str(e)}'})

@app.route('/api/game/undo', methods=['POST'])
def undo_action():
    """Undo last action"""
    try:
        success = game.undo()
        return jsonify({'success': success, 'message': 'Action undone' if success else 'Nothing to undo'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

@app.route('/api/game/redo', methods=['POST'])
def redo_action():
    """Redo last undone action"""
    try:
        success = game.redo()
        return jsonify({'success': success, 'message': 'Action redone' if success else 'Nothing to redo'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

@app.route('/api/game/reset', methods=['POST'])
def reset_game():
    """Reset the game to initial state"""
    try:
        global game
        game = PowerGridGame()
        return jsonify({'success': True, 'message': 'Game reset successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

@app.route('/api/game/info')
def get_game_info():
    """Get game information and component costs"""
    return jsonify({
        'componentCosts': game.component_config,
        'lineCosts': {
            'transmission-line': 1000,
            'distribution-line': 500,
            'hvdc-line': 2000
        },
        'voltageSettings': {
            'generator': [220, 400],
            'substation': [110, 220],
            'load': [10, 20, 50]
        },
        'help': {
            'components': {
                'generator': 'Generates electrical power (50-150 MW)',
                'substation': 'Transforms voltage levels (200 MW capacity)',
                'load': 'Consumes electrical power (20-100 MW)'
            },
            'lines': {
                'transmission-line': 'High-voltage transmission (300 MW capacity)',
                'distribution-line': 'Medium-voltage distribution (100 MW capacity)',
                'hvdc-line': 'High-voltage DC transmission (500 MW capacity)'
            }
        }
    })

@app.route('/api/european/status')
def get_european_status():
    """Get detailed European grid status with SO GL compliance"""
    status = european_game.get_game_status()
    return jsonify(status)

@app.route('/api/european/standards')
def get_european_standards():
    """Get Continental Europe SO GL standards summary"""
    return jsonify({
        'summary': european_game.standards.get_grid_code_summary(),
        'frequency_standards': {
            'nominal': european_game.standards.frequency.nominal_frequency,
            'standard_range': european_game.standards.frequency.standard_frequency_range * 1000,  # mHz
            'alert_limit': european_game.standards.frequency.max_steady_state_frequency_deviation * 1000,  # mHz
            'emergency_limit': european_game.standards.frequency.max_instantaneous_frequency_deviation * 1000,  # mHz
            'fcr_activation_time': european_game.standards.frequency.fcr_full_activation_time,
            'time_to_restore': european_game.standards.frequency.time_to_restore_frequency
        },
        'voltage_standards': {
            'voltage_110_300_min': european_game.standards.voltage.voltage_110_300kv_min,
            'voltage_110_300_max': european_game.standards.voltage.voltage_110_300kv_max,
            'voltage_300_400_min': european_game.standards.voltage.voltage_300_400kv_min,
            'voltage_300_400_max': european_game.standards.voltage.voltage_300_400kv_max
        }
    })

@app.route('/api/european/components')
def get_european_components():
    """Get available European component types"""
    return jsonify({
        'types': european_game.component_types,
        'current_components': european_game.components
    })

@app.route('/api/european/add_component', methods=['POST'])
def add_european_component():
    """Add a component to the European grid"""
    data = request.get_json()
    component_type = data.get('type')
    x = data.get('x', 0)
    y = data.get('y', 0)
    
    component_id = european_game.add_component(component_type, x, y)
    if component_id:
        return jsonify({
            'success': True,
            'component_id': component_id,
            'budget_remaining': european_game.budget
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Insufficient budget or invalid component type'
        }), 400

@app.route('/api/european/add_line', methods=['POST'])
def add_european_line():
    """Add a transmission line to the European grid"""
    data = request.get_json()
    from_comp = data.get('from')
    to_comp = data.get('to')
    voltage_level = data.get('voltage_level', 400)
    
    line_id = european_game.add_transmission_line(from_comp, to_comp, voltage_level)
    if line_id:
        return jsonify({
            'success': True,
            'line_id': line_id,
            'budget_remaining': european_game.budget
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Invalid components or insufficient budget'
        }), 400

@app.route('/api/european/compliance')
def get_compliance_status():
    """Get SO GL compliance status"""
    return jsonify({
        'summary': european_game.get_so_gl_summary(),
        'compliance_details': european_game.standards.check_so_gl_compliance({
            'frequency_deviation': european_game.frequency_deviation,
            'voltages': {},
            'fcr_available': european_game.fcr_available,
            'n_minus_1_secure': european_game.check_n_minus_1_security()
        })
    })

@app.route('/api/european/start_simulation', methods=['POST'])
def start_european_simulation():
    """Start the European grid simulation"""
    global simulation_running, simulation_thread
    
    if not simulation_running:
        simulation_running = True
        simulation_thread = threading.Thread(target=run_simulation)
        simulation_thread.daemon = True
        simulation_thread.start()
        return jsonify({'success': True, 'message': 'Simulation started'})
    else:
        return jsonify({'success': False, 'message': 'Simulation already running'})

@app.route('/api/european/stop_simulation', methods=['POST'])
def stop_european_simulation():
    """Stop the European grid simulation"""
    global simulation_running
    simulation_running = False
    return jsonify({'success': True, 'message': 'Simulation stopped'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
