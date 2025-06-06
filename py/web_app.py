#!/usr/bin/env python3
"""
Web-based GUI for Power Grid Builder - Flask Application
Provides an interactive web interface for the power grid simulation game.
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
import json
import uuid
from typing import Dict, Any
from power_grid_game import PowerGridGame
from grid_types import Point

app = Flask(__name__)
app.secret_key = 'power-grid-game-secret-key'

# Global game instance
game = PowerGridGame()

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
    """Get current game status"""
    stats = game.get_stats()
    return jsonify({
        'budget': stats.budget,
        'totalGeneration': stats.total_generation,
        'totalLoad': stats.total_load,
        'loadServed': stats.load_served,
        'efficiency': stats.efficiency,
        'reliability': stats.reliability,
        'components': len(game.components),
        'lines': len(game.lines),
        'nodes': len(game.grid_nodes)
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
