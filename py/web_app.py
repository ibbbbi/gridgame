#!/usr/bin/env python3
"""
Web-based GUI for Power Grid Builder - Flask Application
Provides an interactive web interface for the power grid simulation game.
Enhanced with WebSocket real-time communication.
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit
import json
import uuid
import threading
import time
from typing import Dict, Any
from power_grid_game import PowerGridGame
from grid_types import Point
from european_grid_game import EuropeanGridGame
from websocket_handler import GridWebSocketHandler

app = Flask(__name__)
app.secret_key = 'power-grid-game-secret-key'

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Global game instances
game = PowerGridGame()  # Original game
european_game = EuropeanGridGame()  # New realistic European game

# WebSocket handler
ws_handler = GridWebSocketHandler(european_game)

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

# Removed duplicate start_simulation function - using the enhanced version below

# Removed duplicate stop_simulation function - using the enhanced version below

# Enhanced European API endpoints
@app.route('/api/european/realtime')
def get_european_realtime():
    """Get real-time European grid data with high precision"""
    if not european_game:
        return jsonify({'error': 'European game not initialized'}), 400
    
    status = european_game.get_game_status()
    
    return jsonify({
        'frequency': status['frequency'],
        'frequency_deviation_mhz': status['frequency_deviation_mhz'],
        'system_state': status['system_state'],
        'fcr_available': status['fcr_available'],
        'frr_available': status['frr_available'],
        'fcr_activation': status.get('fcr_activation', 0),
        'frr_activation': status.get('frr_activation', 0),
        'compliance_score': status['stats'].compliance_score,
        'active_events': getattr(european_game, 'active_events', []),
        'voltage_violations': status['stats'].voltage_violations,
        'thermal_violations': getattr(status['stats'], 'thermal_violations', 0),
        'timestamp': status['time_elapsed']
    })

@app.route('/api/european/start-simulation', methods=['POST'])
def start_european_simulation():
    """Start European grid simulation"""
    global simulation_running, simulation_thread
    
    if simulation_running:
        return jsonify({'success': False, 'message': 'Simulation already running'})
    
    try:
        simulation_running = True
        simulation_thread = threading.Thread(target=run_simulation, daemon=True)
        simulation_thread.start()
        
        return jsonify({
            'success': True, 
            'message': 'European simulation started',
            'realtime': True
        })
    except Exception as e:
        simulation_running = False
        return jsonify({'success': False, 'message': f'Failed to start simulation: {str(e)}'})

@app.route('/api/european/stop-simulation', methods=['POST'])
def stop_european_simulation():
    """Stop European grid simulation"""
    global simulation_running
    
    simulation_running = False
    
    return jsonify({
        'success': True,
        'message': 'European simulation stopped'
    })

@app.route('/api/european/n1-analysis', methods=['POST'])
def run_n1_analysis():
    """Run N-1 contingency analysis"""
    try:
        # Use unified grid engine for N-1 analysis
        from unified_grid_engine import UnifiedGridEngine, GridBus, GridBranch
        
        engine = UnifiedGridEngine()
        
        # Convert European game components to unified engine format
        bus_counter = 1
        for comp_id, comp_data in european_game.components.items():
            # Create bus for each component
            bus_id = f"BUS_{bus_counter}"
            voltage_level = comp_data.get('voltage_level', 400)
            
            bus = GridBus(
                id=bus_id,
                name=f"{comp_data.get('type', 'unknown')}_{comp_id}",
                voltage_level=voltage_level,
                base_voltage=voltage_level
            )
            
            # Set generation or load based on component type
            capacity = comp_data.get('capacity', 0)
            if capacity > 0:  # Generator
                bus.gen_p_max = capacity
                bus.gen_p = capacity * 0.8  # 80% dispatch
                bus.gen_q_max = capacity * 0.5
                bus.is_slack = (bus_counter == 1)  # First generator as slack
            else:  # Load
                bus.load_p = abs(capacity)
                bus.load_q = abs(capacity) * 0.3
            
            engine.add_bus(bus)
            bus_counter += 1
        
        # Add some transmission lines between buses for connectivity
        bus_ids = list(engine.buses.keys())
        if len(bus_ids) >= 2:
            for i in range(len(bus_ids) - 1):
                line_id = f"LINE_{i+1}"
                branch = GridBranch(
                    id=line_id,
                    from_bus=bus_ids[i],
                    to_bus=bus_ids[i+1],
                    resistance=0.01,
                    reactance=0.1,
                    rating_a=500  # MVA
                )
                engine.add_branch(branch)
        
        # Run contingency analysis
        results = engine.run_n1_contingency_analysis(parallel=True)
        
        # Convert results to JSON-serializable format
        analysis_results = []
        for result in results:
            analysis_results.append({
                'contingency_id': result.contingency_id,
                'component_type': result.component_type,
                'component_id': result.component_id,
                'converged': result.converged,
                'max_voltage_violation': result.max_voltage_violation,
                'max_thermal_violation': result.max_thermal_violation,
                'load_shed': result.load_shed,
                'critical': result.critical
            })
        
        return jsonify(analysis_results)
        
    except Exception as e:
        return jsonify({'error': f'N-1 analysis failed: {str(e)}'}), 500

@app.route('/api/european/place-component', methods=['POST'])
def place_european_component():
    """Place European grid component"""
    data = request.json
    try:
        component_type = data['type']
        position = {'x': data['x'], 'y': data['y']}
        
        success = european_game.place_component(component_type, position)
        
        if success:
            return jsonify({
                'success': True, 
                'message': f'{component_type.replace("_", " ").title()} placed successfully',
                'cost': european_game.component_types[component_type]['cost'],
                'remaining_budget': european_game.budget
            })
        else:
            return jsonify({
                'success': False, 
                'message': 'Failed to place component (insufficient budget?)'
            })
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

@app.route('/api/european/place-line', methods=['POST'])
def place_european_line():
    """Place European transmission line"""
    data = request.json
    try:
        line_type = data['type']
        from_id = data['from']
        to_id = data['to']
        
        success = european_game.place_line(line_type, from_id, to_id)
        
        if success:
            return jsonify({
                'success': True, 
                'message': f'{line_type.replace("_", " ").title()} placed successfully',
                'remaining_budget': european_game.budget
            })
        else:
            return jsonify({
                'success': False, 
                'message': 'Failed to place line (insufficient budget or invalid connection?)'
            })
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

@app.route('/api/european/compliance-report')
def get_compliance_report():
    """Get detailed SO GL compliance report"""
    try:
        status = european_game.get_game_status()
        stats = status['stats']
        
        report = {
            'frequency_control': {
                'fcr_activation_time': getattr(european_game, 'fcr_activation_time', 'N/A'),
                'frr_activation_time': getattr(european_game, 'frr_activation_time', 'N/A'),
                'frequency_violations': stats.frequency_violations,
                'worst_frequency_deviation': getattr(european_game, 'worst_frequency_deviation', 0.0)
            },
            'voltage_quality': {
                'voltage_violations': stats.voltage_violations,
                'worst_voltage': getattr(european_game, 'worst_voltage', 1.0)
            },
            'system_security': {
                'n1_secure': stats.n_minus_1_failures == 0,
                'thermal_violations': getattr(stats, 'thermal_violations', 0),
                'last_n1_analysis': getattr(european_game, 'last_n1_analysis', None)
            },
            'overall': {
                'compliance_score': stats.compliance_score,
                'reliability_score': stats.reliability_score,
                'efficiency_score': stats.efficiency_score
            },
            'timestamp': status['time_elapsed']
        }
        
        return jsonify(report)
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate compliance report: {str(e)}'}), 500

@app.route('/api/european/system-events')
def get_system_events():
    """Get system events and disturbances"""
    try:
        events = getattr(european_game, 'event_history', [])
        active_events = getattr(european_game, 'active_events', [])
        
        return jsonify({
            'active_events': active_events,
            'recent_events': events[-50:],  # Last 50 events
            'total_events': len(events)
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get system events: {str(e)}'}), 500

# U/Q Control and Blackstart API Endpoints

@app.route('/api/european/voltage-control/enable', methods=['POST'])
def enable_voltage_control():
    """Enable voltage control for a generator"""
    try:
        data = request.json
        component_id = data.get('component_id')
        voltage_setpoint = data.get('voltage_setpoint', 1.0)
        
        success = european_game.enable_voltage_control(component_id, voltage_setpoint)
        
        if success:
            # Emit real-time update
            socketio.emit('voltage_control_enabled', {
                'component_id': component_id,
                'voltage_setpoint': voltage_setpoint
            })
            
        return jsonify({
            'success': success,
            'message': 'Voltage control enabled' if success else 'Failed to enable voltage control'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/european/blackstart/configure', methods=['POST'])
def configure_blackstart():
    """Configure blackstart capability for a generator"""
    try:
        data = request.json
        component_id = data.get('component_id')
        blackstart_capable = data.get('blackstart_capable', True)
        
        success = european_game.configure_blackstart_capability(component_id, blackstart_capable)
        
        if success:
            # Emit real-time update
            socketio.emit('blackstart_configured', {
                'component_id': component_id,
                'blackstart_capable': blackstart_capable
            })
            
        return jsonify({
            'success': success,
            'message': 'Blackstart capability configured' if success else 'Failed to configure blackstart'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/european/blackstart/assess', methods=['GET'])
def assess_blackstart_capability():
    """Assess current blackstart capability of the grid"""
    try:
        capability_status = european_game.assess_blackstart_capability()
        return jsonify({
            'success': True,
            'blackstart_capability': capability_status
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/european/blackstart/initiate', methods=['POST'])
def initiate_blackstart_scenario():
    """Initiate a blackstart scenario for training"""
    try:
        success = european_game.initiate_blackstart_scenario()
        
        if success:
            # Emit real-time update about blackstart scenario
            socketio.emit('blackstart_scenario_initiated', {
                'restoration_sequence': european_game.restoration_sequence,
                'total_phases': len(european_game.restoration_sequence)
            })
            
        return jsonify({
            'success': success,
            'message': 'Blackstart scenario initiated' if success else 'Insufficient blackstart capability',
            'restoration_sequence': european_game.restoration_sequence if success else None
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/european/blackstart/advance', methods=['POST'])
def advance_restoration():
    """Advance to next step in blackstart restoration sequence"""
    try:
        step = european_game.advance_restoration_sequence()
        
        if step:
            # Emit real-time update about restoration progress
            socketio.emit('restoration_step_completed', {
                'step': step,
                'current_phase': european_game.current_restoration_phase,
                'total_phases': len(european_game.restoration_sequence),
                'completed': european_game.current_restoration_phase >= len(european_game.restoration_sequence)
            })
            
        return jsonify({
            'success': step is not None,
            'step': step,
            'restoration_complete': not european_game.blackstart_scenario_active
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/european/voltage/check-violations', methods=['GET'])
def check_voltage_violations():
    """Check for voltage violations according to European standards"""
    try:
        violations = european_game.check_voltage_violations()
        return jsonify({
            'success': True,
            'violations': violations,
            'violation_count': len(violations)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/european/voltage/apply-control', methods=['POST'])
def apply_voltage_control():
    """Apply automatic voltage control to generators with AVR enabled"""
    try:
        adjustments = european_game.apply_voltage_control()
        
        if adjustments:
            # Emit real-time update about voltage control actions
            socketio.emit('voltage_control_applied', {
                'adjustments': adjustments,
                'timestamp': time.time()
            })
            
        return jsonify({
            'success': True,
            'voltage_adjustments': adjustments,
            'adjustment_count': len(adjustments)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/european/standards/voltage', methods=['GET'])
def get_voltage_standards():
    """Get European voltage standards"""
    try:
        standards = {
            'voltage_110_300kv_min': european_game.standards.voltage.voltage_110_300kv_min,
            'voltage_110_300kv_max': european_game.standards.voltage.voltage_110_300kv_max,
            'voltage_300_400kv_min': european_game.standards.voltage.voltage_300_400kv_min,
            'voltage_300_400kv_max': european_game.standards.voltage.voltage_300_400kv_max,
            'voltage_droop': european_game.standards.voltage.voltage_droop,
            'reactive_power_response_time': european_game.standards.voltage.reactive_power_response_time,
            'voltage_control_accuracy': european_game.standards.voltage.voltage_control_accuracy,
            'avr_time_constant': european_game.standards.voltage.avr_time_constant,
            'excitation_system_ceiling': european_game.standards.voltage.excitation_system_ceiling,
            'excitation_system_floor': european_game.standards.voltage.excitation_system_floor
        }
        return jsonify({'success': True, 'voltage_standards': standards})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/european/standards/blackstart', methods=['GET'])
def get_blackstart_standards():
    """Get European blackstart standards"""
    try:
        standards = {
            'minimum_blackstart_capability': european_game.standards.blackstart.minimum_blackstart_capability,
            'maximum_restoration_time': european_game.standards.blackstart.maximum_restoration_time,
            'blackstart_unit_response_time': european_game.standards.blackstart.blackstart_unit_response_time,
            'generator_priorities': dict(european_game.standards.blackstart.generator_priorities),
            'load_priorities': dict(european_game.standards.blackstart.load_priorities),
            'frequency_restoration_target': european_game.standards.blackstart.frequency_restoration_target,
            'voltage_restoration_target': european_game.standards.blackstart.voltage_restoration_target,
            'load_pickup_increment_max': european_game.standards.blackstart.load_pickup_increment_max,
            'generation_reserve_margin': european_game.standards.blackstart.generation_reserve_margin
        }
        return jsonify({'success': True, 'blackstart_standards': standards})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# WebSocket events
@socketio.on('connect')
def handle_connect():
    """Handle new WebSocket connections"""
    emit('status', {'message': 'Connected to Power Grid Builder WebSocket'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnections"""
    print('Client disconnected')

@socketio.on('get_status')
def handle_get_status():
    """Send current game status to client"""
    status = european_game.get_game_status()
    emit('status_update', {
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

@socketio.on('place_component')
def handle_place_component(data):
    """Handle component placement from client"""
    try:
        position = Point(x=data['x'], y=data['y'])
        component_type = data['type']
        
        success = game.place_component(component_type, position)
        
        if success:
            emit('component_placed', {'success': True, 'message': f'{component_type.title()} placed successfully'})
        else:
            emit('component_placed', {'success': False, 'message': 'Failed to place component (insufficient budget?)'})
    except Exception as e:
        emit('component_placed', {'success': False, 'message': f'Error: {str(e)}'})

@socketio.on('place_line')
def handle_place_line(data):
    """Handle line placement from client"""
    try:
        line_type = data['type']
        from_id = data['from']
        to_id = data['to']
        
        success = game.place_line(line_type, from_id, to_id)
        
        if success:
            emit('line_placed', {'success': True, 'message': f'{line_type.replace("-", " ").title()} placed successfully'})
        else:
            emit('line_placed', {'success': False, 'message': 'Failed to place line (insufficient budget or invalid connection?)'})
    except Exception as e:
        emit('line_placed', {'success': False, 'message': f'Error: {str(e)}'})

@socketio.on('place_node')
def handle_place_node(data):
    """Handle node placement from client"""
    try:
        position = Point(x=data['x'], y=data['y'])
        voltage = data.get('voltage', 110)
        
        success = game.place_grid_node(position, voltage)
        
        if success:
            emit('node_placed', {'success': True, 'message': 'Grid node placed successfully'})
        else:
            emit('node_placed', {'success': False, 'message': 'Failed to place node'})
    except Exception as e:
        emit('node_placed', {'success': False, 'message': f'Error: {str(e)}'})

@socketio.on('run_simulation')
def handle_run_simulation():
    """Handle simulation request from client"""
    try:
        result = game.simulate()
        
        emit('simulation_result', {
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
        emit('simulation_result', {'success': False, 'message': f'Simulation error: {str(e)}'})

@socketio.on('undo')
def handle_undo():
    """Handle undo request from client"""
    try:
        success = game.undo()
        emit('action_undone', {'success': success, 'message': 'Action undone' if success else 'Nothing to undo'})
    except Exception as e:
        emit('action_undone', {'success': False, 'message': f'Error: {str(e)}'})

@socketio.on('redo')
def handle_redo():
    """Handle redo request from client"""
    try:
        success = game.redo()
        emit('action_redone', {'success': success, 'message': 'Action redone' if success else 'Nothing to redo'})
    except Exception as e:
        emit('action_redone', {'success': False, 'message': f'Error: {str(e)}'})

@socketio.on('reset')
def handle_reset():
    """Handle game reset request from client"""
    try:
        global game
        game = PowerGridGame()
        emit('game_reset', {'success': True, 'message': 'Game reset successfully'})
    except Exception as e:
        emit('game_reset', {'success': False, 'message': f'Error: {str(e)}'})

@socketio.on('get_european_status')
def handle_get_european_status():
    """Send current European game status to client"""
    status = european_game.get_game_status()
    emit('european_status_update', status)

@socketio.on('start_european_simulation')
def handle_start_european_simulation():
    """Start European grid simulation via WebSocket"""
    global simulation_running, simulation_thread
    
    if simulation_running:
        emit('simulation_status', {'success': False, 'message': 'Simulation already running'})
        return
    
    try:
        simulation_running = True
        simulation_thread = threading.Thread(target=run_simulation, daemon=True)
        simulation_thread.start()
        
        emit('simulation_status', {'success': True, 'message': 'European simulation started'})
    except Exception as e:
        simulation_running = False
        emit('simulation_status', {'success': False, 'message': f'Failed to start simulation: {str(e)}'})

@socketio.on('stop_european_simulation')
def handle_stop_european_simulation():
    """Stop European grid simulation via WebSocket"""
    global simulation_running
    
    simulation_running = False
    
    emit('simulation_status', {'success': True, 'message': 'European simulation stopped'})

@socketio.on('n1_analysis')
def handle_n1_analysis():
    """Run N-1 contingency analysis via WebSocket"""
    try:
        # Use unified grid engine for N-1 analysis
        from unified_grid_engine import UnifiedGridEngine, GridBus, GridBranch
        
        engine = UnifiedGridEngine()
        
        # Convert European game components to unified engine format
        bus_counter = 1
        for comp_id, comp_data in european_game.components.items():
            # Create bus for each component
            bus_id = f"BUS_{bus_counter}"
            voltage_level = comp_data.get('voltage_level', 400)
            
            bus = GridBus(
                id=bus_id,
                name=f"{comp_data.get('type', 'unknown')}_{comp_id}",
                voltage_level=voltage_level,
                base_voltage=voltage_level
            )
            
            # Set generation or load based on component type
            capacity = comp_data.get('capacity', 0)
            if capacity > 0:  # Generator
                bus.gen_p_max = capacity
                bus.gen_p = capacity * 0.8  # 80% dispatch
                bus.gen_q_max = capacity * 0.5
                bus.is_slack = (bus_counter == 1)  # First generator as slack
            else:  # Load
                bus.load_p = abs(capacity)
                bus.load_q = abs(capacity) * 0.3
            
            engine.add_bus(bus)
            bus_counter += 1
        
        # Add some transmission lines between buses for connectivity
        bus_ids = list(engine.buses.keys())
        if len(bus_ids) >= 2:
            for i in range(len(bus_ids) - 1):
                line_id = f"LINE_{i+1}"
                branch = GridBranch(
                    id=line_id,
                    from_bus=bus_ids[i],
                    to_bus=bus_ids[i+1],
                    resistance=0.01,
                    reactance=0.1,
                    rating_a=500  # MVA
                )
                engine.add_branch(branch)
        
        # Run contingency analysis
        results = engine.run_n1_contingency_analysis(parallel=True)
        
        # Convert results to JSON-serializable format
        analysis_results = []
        for result in results:
            analysis_results.append({
                'contingency_id': result.contingency_id,
                'component_type': result.component_type,
                'component_id': result.component_id,
                'converged': result.converged,
                'max_voltage_violation': result.max_voltage_violation,
                'max_thermal_violation': result.max_thermal_violation,
                'load_shed': result.load_shed,
                'critical': result.critical
            })
        
        emit('n1_analysis_results', analysis_results)
        
    except Exception as e:
        emit('n1_analysis_results', {'error': f'N-1 analysis failed: {str(e)}'})

@socketio.on('get_compliance_report')
def handle_get_compliance_report():
    """Get detailed SO GL compliance report via WebSocket"""
    try:
        status = european_game.get_game_status()
        stats = status['stats']
        
        report = {
            'frequency_control': {
                'fcr_activation_time': getattr(european_game, 'fcr_activation_time', 'N/A'),
                'frr_activation_time': getattr(european_game, 'frr_activation_time', 'N/A'),
                'frequency_violations': stats.frequency_violations,
                'worst_frequency_deviation': getattr(european_game, 'worst_frequency_deviation', 0.0)
            },
            'voltage_quality': {
                'voltage_violations': stats.voltage_violations,
                'worst_voltage': getattr(european_game, 'worst_voltage', 1.0)
            },
            'system_security': {
                'n1_secure': stats.n_minus_1_failures == 0,
                'thermal_violations': getattr(stats, 'thermal_violations', 0),
                'last_n1_analysis': getattr(european_game, 'last_n1_analysis', None)
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

@socketio.on('get_system_events')
def handle_get_system_events():
    """Get system events and disturbances via WebSocket"""
    try:
        events = getattr(european_game, 'event_history', [])
        active_events = getattr(european_game, 'active_events', [])
        
        emit('system_events', {
            'active_events': active_events,
            'recent_events': events[-50:],  # Last 50 events
            'total_events': len(events)
        })
        
    except Exception as e:
        emit('system_events', {'error': f'Failed to get system events: {str(e)}'})

# Additional U/Q Control API Endpoints

@app.route('/api/european/uq-control/mode', methods=['POST'])
def set_voltage_control_mode():
    """Set voltage control mode for the grid"""
    try:
        data = request.json
        mode = data.get('mode', 'automatic')
        
        # Apply mode to all voltage control enabled generators
        mode_set = 0
        for comp_id, component in european_game.components.items():
            if component.get('voltage_control_enabled', False):
                component['voltage_control_mode'] = mode
                mode_set += 1
        
        return jsonify({
            'success': True,
            'mode': mode,
            'generators_affected': mode_set,
            'message': f'Voltage control mode set to {mode} for {mode_set} generators'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/european/uq-control/optimize', methods=['POST'])
def optimize_voltage_control():
    """Optimize voltage control setpoints using European standards"""
    try:
        data = request.json
        target_voltage = data.get('targetVoltage', 1.0)
        
        # Use the European power flow simulator for optimization
        optimization_result = european_game.simulator.optimize_voltage_control(
            list(european_game.components.values()), target_voltage
        )
        
        # Apply optimized setpoints
        adjustments_applied = 0
        for comp_id, new_setpoint in optimization_result.get('optimal_setpoints', {}).items():
            if comp_id in european_game.components:
                european_game.components[comp_id]['voltage_setpoint'] = new_setpoint
                adjustments_applied += 1
        
        # Emit real-time update
        socketio.emit('voltage_optimization_completed', {
            'target_voltage': target_voltage,
            'adjustments_applied': adjustments_applied,
            'optimization_result': optimization_result
        })
        
        return jsonify({
            'success': True,
            'data': optimization_result,
            'adjustments_applied': adjustments_applied,
            'target_voltage': target_voltage
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/european/uq-control/reset-avr', methods=['POST'])
def reset_avr_controllers():
    """Reset all AVR controllers to default settings"""
    try:
        reset_count = 0
        for comp_id, component in european_game.components.items():
            if component.get('avr_enabled', False):
                # Reset AVR parameters to defaults
                component['voltage_setpoint'] = 1.0
                component['reactive_power'] = 0.0
                component.setdefault('reactive_power_limits', {})
                component['reactive_power_limits']['max'] = component['capacity'] * 0.5
                component['reactive_power_limits']['min'] = -component['capacity'] * 0.5
                reset_count += 1
        
        # Emit real-time update
        socketio.emit('avr_controllers_reset', {
            'reset_count': reset_count
        })
        
        return jsonify({
            'success': True,
            'message': f'Reset {reset_count} AVR controllers',
            'data': {'reset_count': reset_count}
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/european/uq-control/sensitivity', methods=['GET'])
def perform_voltage_sensitivity_analysis():
    """Perform voltage sensitivity analysis (dV/dQ)"""
    try:
        # Use the European power flow simulator for sensitivity analysis
        sensitivity_result = european_game.simulator.calculate_voltage_sensitivity_matrix(
            list(european_game.components.values())
        )
        
        return jsonify({
            'success': True,
            'data': {
                'sensitivity_matrix': sensitivity_result.get('dv_dq_matrix', []),
                'bus_voltages': sensitivity_result.get('bus_voltages', []),
                'reactive_powers': sensitivity_result.get('reactive_powers', []),
                'analysis_timestamp': time.time()
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Additional Blackstart API Endpoints

@app.route('/api/european/blackstart/sequence', methods=['POST'])
def generate_restoration_sequence():
    """Generate optimal blackstart restoration sequence"""
    try:
        # Assess blackstart capability first
        capability_status = european_game.assess_blackstart_capability()
        
        if not capability_status['meets_european_standard']:
            return jsonify({
                'success': False,
                'message': 'Insufficient blackstart capability for sequence generation',
                'required_percentage': capability_status['required_percentage'],
                'current_percentage': capability_status['blackstart_percentage'] * 100
            })
        
        # Generate restoration sequence using Fortran backend if available
        try:
            from fortran_interface import FortranInterface
            fortran = FortranInterface()
            
            # Prepare data for Fortran optimization
            generators = []
            loads = []
            for comp_id, component in european_game.components.items():
                if component['capacity'] > 0:  # Generator
                    generators.append({
                        'id': comp_id,
                        'capacity': component['capacity'],
                        'type': component.get('type', 'unknown'),
                        'blackstart_capable': component.get('blackstart_capable', False)
                    })
                else:  # Load
                    loads.append({
                        'id': comp_id,
                        'capacity': abs(component['capacity']),
                        'priority': component.get('priority', 3)
                    })
            
            # Generate optimal sequence using Fortran
            sequence = fortran.generate_blackstart_sequence(generators, loads)
            
        except ImportError:
            # Fall back to Python implementation
            sequence = european_game._generate_restoration_sequence()
        
        # Store sequence in game state
        european_game.restoration_sequence = sequence
        
        # Emit real-time update
        socketio.emit('restoration_sequence_generated', {
            'sequence': sequence,
            'total_steps': len(sequence)
        })
        
        return jsonify({
            'success': True,
            'data': {
                'sequence': sequence,
                'total_steps': len(sequence),
                'estimated_time': sum([step.get('time', 15) for step in sequence])
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/european/blackstart/simulate', methods=['POST'])
def simulate_blackstart_procedure():
    """Simulate blackstart restoration procedure"""
    try:
        if not european_game.restoration_sequence:
            return jsonify({
                'success': False,
                'message': 'No restoration sequence available. Generate sequence first.'
            })
        
        # Initialize blackstart simulation
        simulation_result = {
            'phases': [
                {
                    'name': 'Blackstart Units',
                    'description': 'Starting blackstart capable generators',
                    'duration': 300,  # 5 minutes
                    'progress': 0
                },
                {
                    'name': 'Generation Restoration', 
                    'description': 'Restoring additional generation capacity',
                    'duration': 900,  # 15 minutes
                    'progress': 0
                },
                {
                    'name': 'Load Restoration',
                    'description': 'Gradually restoring system load',
                    'duration': 1200,  # 20 minutes
                    'progress': 0
                }
            ],
            'total_duration': 2400,  # 40 minutes total
            'success': True,
            'sequence': european_game.restoration_sequence
        }
        
        # Mark simulation as active
        european_game.blackstart_scenario_active = True
        european_game.current_restoration_phase = 0
        
        # Emit real-time update
        socketio.emit('blackstart_simulation_started', simulation_result)
        
        return jsonify({
            'success': True,
            'data': simulation_result,
            'message': 'Blackstart simulation initiated successfully'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# WebSocket handlers for real-time U/Q control and blackstart updates
@socketio.on('voltage_control_status_request')
def handle_voltage_control_status():
    """Send voltage control status to client"""
    try:
        voltage_violations = european_game.check_voltage_violations()
        voltage_adjustments = european_game.apply_voltage_control()
        
        emit('voltage_control_status', {
            'violations': voltage_violations,
            'recent_adjustments': voltage_adjustments,
            'active_controllers': len([c for c in european_game.components.values() if c.get('avr_enabled', False)]),
            'timestamp': time.time()
        })
    except Exception as e:
        emit('voltage_control_status', {'error': str(e)})

@socketio.on('blackstart_status_request')
def handle_blackstart_status():
    """Send blackstart status to client"""
    try:
        capability_status = european_game.assess_blackstart_capability()
        
        emit('blackstart_status', {
            'capability': capability_status,
            'scenario_active': european_game.blackstart_scenario_active,
            'current_phase': european_game.current_restoration_phase,
            'sequence_length': len(european_game.restoration_sequence),
            'timestamp': time.time()
        })
    except Exception as e:
        emit('blackstart_status', {'error': str(e)})

# Enhanced periodic status updates for U/Q and blackstart
def enhanced_status_update():
    """Enhanced periodic status update including U/Q and blackstart data"""
    try:
        if simulation_running:
            status = european_game.get_game_status()
            
            # Add U/Q control status
            voltage_violations = european_game.check_voltage_violations()
            active_avr_count = len([c for c in european_game.components.values() if c.get('avr_enabled', False)])
            
            # Add blackstart status
            if not european_game.blackstart_capability_status:
                blackstart_status = european_game.assess_blackstart_capability()
            else:
                blackstart_status = european_game.blackstart_capability_status
            
            enhanced_status = {
                **status,
                'voltage_control': {
                    'violations_count': len(voltage_violations),
                    'active_avr_controllers': active_avr_count,
                    'voltage_control_active': european_game.voltage_control_active
                },
                'blackstart': {
                    'capability_percentage': blackstart_status['blackstart_percentage'] * 100,
                    'meets_standard': blackstart_status['meets_european_standard'],
                    'scenario_active': european_game.blackstart_scenario_active,
                    'restoration_progress': (european_game.current_restoration_phase / max(1, len(european_game.restoration_sequence))) * 100
                }
            }
            
            socketio.emit('enhanced_status_update', enhanced_status)
            
    except Exception as e:
        print(f"Enhanced status update error: {e}")

# Start enhanced status updates timer
import threading

def start_enhanced_updates():
    """Start enhanced status update timer"""
    def update_loop():
        while True:
            if simulation_running:
                enhanced_status_update()
            time.sleep(5)  # Update every 5 seconds
    
    update_thread = threading.Thread(target=update_loop, daemon=True)
    update_thread.start()

if __name__ == '__main__':
    print("Starting European Power Grid Builder v2.0 Web Server...")
    print("Enhanced WebSocket communication enabled")
    print("Access the application at: http://localhost:5000")
    
    # Start enhanced status updates
    start_enhanced_updates()
    
    # Run with SocketIO
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
