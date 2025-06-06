"""
European Power Grid Game - Realistic simulation using Continental Europe SO GL standards
"""

import math
import random
import time
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from european_grid_standards import EuropeanGridStandards
from european_power_flow_simulator import EuropeanACPowerFlowSimulator

@dataclass
class GridEvent:
    """Grid disturbance event following Continental Europe scenarios"""
    name: str
    type: str  # 'generator_trip', 'load_increase', 'line_outage', 'frequency_event'
    magnitude: float  # MW or Hz deviation
    duration: float  # seconds
    probability: float  # 0-1
    description: str

@dataclass 
class GameStats:
    """Game statistics and performance metrics"""
    frequency_violations: int = 0
    voltage_violations: int = 0
    n_minus_1_failures: int = 0
    fcr_activations: int = 0
    frr_activations: int = 0
    total_cost: float = 0.0
    reliability_score: float = 100.0
    compliance_score: float = 100.0
    efficiency_score: float = 0.0

class EuropeanGridGame:
    """
    Realistic European Power Grid Game using Continental Europe SO GL standards
    """
    
    def __init__(self):
        self.standards = EuropeanGridStandards()
        self.simulator = EuropeanACPowerFlowSimulator()
        self.stats = GameStats()
        
        # Game configuration
        self.budget = 500000  # 500k EUR budget - realistic for regional grid
        self.time_elapsed = 0.0  # Game time in seconds
        self.game_speed = 1.0  # Real-time multiplier
        
        # Grid state
        self.frequency_deviation = 0.0  # Current frequency deviation from 50 Hz
        self.system_state = 'normal'  # 'normal', 'alert', 'emergency'
        self.load_demand = 2000.0  # Current system load in MW
        self.generation_capacity = 0.0  # Available generation
        self.fcr_available = 0.0  # Available FCR in MW
        self.frr_available = 0.0  # Available FRR in MW
        
        # European grid events based on real scenarios
        self.grid_events = [
            GridEvent(
                "Nuclear Unit Trip", "generator_trip", 1400.0, 0.0, 0.001,
                "1400 MW nuclear unit trip - largest single incident type in CE"
            ),
            GridEvent(
                "Coal Plant Trip", "generator_trip", 800.0, 0.0, 0.002,
                "800 MW coal-fired unit trip"
            ),
            GridEvent(
                "HVDC Line Outage", "line_outage", 1000.0, 3600.0, 0.005,
                "1000 MW HVDC interconnector outage"
            ),
            GridEvent(
                "Morning Load Ramp", "load_increase", 500.0, 1800.0, 0.2,
                "Morning demand increase - typical daily pattern"
            ),
            GridEvent(
                "Wind Power Drop", "generator_trip", 600.0, 900.0, 0.1,
                "Wind power output reduction due to weather"
            ),
            GridEvent(
                "AC Line Trip", "line_outage", 2000.0, 0.0, 0.01,
                "400 kV transmission line trip"
            )
        ]
        
        # Component types with European specifications
        self.component_types = {
            'nuclear_plant': {
                'cost': 80000, 'capacity': 1400, 'fcr': 50, 'frr': 200,
                'voltage_level': 400, 'description': 'Large nuclear power plant'
            },
            'coal_plant': {
                'cost': 40000, 'capacity': 800, 'fcr': 40, 'frr': 150,
                'voltage_level': 400, 'description': 'Coal-fired power plant'
            },
            'gas_plant': {
                'cost': 25000, 'capacity': 400, 'fcr': 30, 'frr': 100,
                'voltage_level': 220, 'description': 'Gas turbine power plant'
            },
            'hydro_plant': {
                'cost': 35000, 'capacity': 300, 'fcr': 50, 'frr': 200,
                'voltage_level': 220, 'description': 'Hydroelectric power plant'
            },
            'wind_farm': {
                'cost': 20000, 'capacity': 200, 'fcr': 0, 'frr': 30,
                'voltage_level': 110, 'description': 'Wind power farm'
            },
            'solar_farm': {
                'cost': 15000, 'capacity': 100, 'fcr': 0, 'frr': 20,
                'voltage_level': 110, 'description': 'Solar photovoltaic farm'
            },
            'substation_400': {
                'cost': 15000, 'capacity': 2000, 'fcr': 0, 'frr': 0,
                'voltage_level': 400, 'description': '400 kV substation'
            },
            'substation_220': {
                'cost': 8000, 'capacity': 1000, 'fcr': 0, 'frr': 0,
                'voltage_level': 220, 'description': '220 kV substation'
            },
            'load_center': {
                'cost': 0, 'capacity': -300, 'fcr': 0, 'frr': 0,
                'voltage_level': 110, 'description': 'Urban load center'
            }
        }
        
        self.components = {}
        self.lines = {}
        self.next_id = 1
        
    def add_component(self, component_type: str, x: float = 0, y: float = 0) -> Optional[str]:
        """Add a component to the grid"""
        if component_type not in self.component_types:
            return None
            
        config = self.component_types[component_type]
        if self.budget < config['cost']:
            return None
            
        component_id = f"comp_{self.next_id}"
        self.next_id += 1
        
        self.components[component_id] = {
            'type': component_type,
            'config': config,
            'x': x,
            'y': y,
            'status': 'online',
            'output': config['capacity'] if config['capacity'] > 0 else 0,
            'load': abs(config['capacity']) if config['capacity'] < 0 else 0
        }
        
        self.budget -= config['cost']
        self.stats.total_cost += config['cost']
        
        self._update_grid_parameters()
        return component_id
    
    def add_transmission_line(self, from_comp: str, to_comp: str, voltage_level: int = 400) -> Optional[str]:
        """Add a transmission line between components"""
        if from_comp not in self.components or to_comp not in self.components:
            return None
            
        # Calculate line cost based on distance and voltage level
        comp1 = self.components[from_comp]
        comp2 = self.components[to_comp]
        distance = math.sqrt((comp1['x'] - comp2['x'])**2 + (comp1['y'] - comp2['y'])**2)
        distance = max(distance, 10)  # Minimum 10 km
        
        cost_per_km = {400: 2000, 220: 1200, 110: 800}.get(voltage_level, 1000)
        total_cost = cost_per_km * distance
        
        if self.budget < total_cost:
            return None
            
        line_id = f"line_{self.next_id}"
        self.next_id += 1
        
        # Get line parameters from standards
        line_params = self.standards.calculate_line_parameters(voltage_level, distance)
        
        self.lines[line_id] = {
            'from': from_comp,
            'to': to_comp,
            'voltage_level': voltage_level,
            'distance': distance,
            'cost': total_cost,
            'parameters': line_params,
            'status': 'online',
            'loading': 0.0  # Percentage loading
        }
        
        self.budget -= total_cost
        self.stats.total_cost += total_cost
        
        return line_id
    
    def _update_grid_parameters(self):
        """Update grid parameters after component changes"""
        self.generation_capacity = 0.0
        self.fcr_available = 0.0
        self.frr_available = 0.0
        total_load = 0.0
        
        for comp in self.components.values():
            if comp['status'] == 'online':
                config = comp['config']
                if config['capacity'] > 0:  # Generator
                    self.generation_capacity += comp['output']
                    self.fcr_available += config['fcr']
                    self.frr_available += config['frr']
                else:  # Load
                    total_load += comp['load']
        
        self.load_demand = max(total_load, 1000)  # Minimum base load
    
    def simulate_grid_event(self) -> Optional[GridEvent]:
        """Simulate a grid disturbance event"""
        for event in self.grid_events:
            if random.random() < event.probability * self.game_speed:
                return self._execute_event(event)
        return None
    
    def _execute_event(self, event: GridEvent) -> GridEvent:
        """Execute a grid event and update system state"""
        if event.type == 'generator_trip':
            # Find largest generator and trip it
            generators = [(id, comp) for id, comp in self.components.items() 
                         if comp['config']['capacity'] > 0 and comp['status'] == 'online']
            if generators:
                # Trip generator closest to event magnitude
                best_match = min(generators, 
                               key=lambda x: abs(x[1]['config']['capacity'] - event.magnitude))
                best_match[1]['status'] = 'offline'
                self.frequency_deviation -= event.magnitude / 20000  # Simplified frequency response
                
        elif event.type == 'load_increase':
            self.load_demand += event.magnitude
            self.frequency_deviation -= event.magnitude / 30000  # Load increase decreases frequency
            
        elif event.type == 'line_outage':
            # Trip a random transmission line
            online_lines = [id for id, line in self.lines.items() if line['status'] == 'online']
            if online_lines:
                line_id = random.choice(online_lines)
                self.lines[line_id]['status'] = 'offline'
        
        self._update_grid_parameters()
        return event
    
    def activate_fcr(self, frequency_deviation: float) -> float:
        """Activate FCR based on Continental Europe standards"""
        activation = self.standards.calculate_fcr_activation(frequency_deviation)
        fcr_response = activation * self.fcr_available
        
        if abs(activation) > 0.1:  # Significant FCR activation
            self.stats.fcr_activations += 1
            
        return fcr_response
    
    def activate_frr(self, frequency_deviation: float) -> float:
        """Activate FRR if needed"""
        if abs(frequency_deviation) > self.standards.frequency.standard_frequency_range:
            frr_needed = abs(frequency_deviation) * 10000  # Simplified calculation
            frr_activated = min(frr_needed, self.frr_available * 0.8)  # 80% availability
            
            if frr_activated > 50:  # Significant FRR activation
                self.stats.frr_activations += 1
                
            return frr_activated if frequency_deviation < 0 else -frr_activated
        
        return 0.0
    
    def update_frequency(self, dt: float):
        """Update system frequency based on generation-load balance"""
        # Simplified frequency dynamics
        generation = sum(comp['output'] for comp in self.components.values() 
                        if comp['status'] == 'online' and comp['config']['capacity'] > 0)
        
        imbalance = generation - self.load_demand
        
        # Natural frequency response (simplified)
        self.frequency_deviation += imbalance / 50000 * dt
        
        # FCR activation
        fcr_response = self.activate_fcr(self.frequency_deviation)
        self.frequency_deviation -= fcr_response / 50000 * dt
        
        # FRR activation (slower response)
        if self.time_elapsed % 30 < dt:  # Check every 30 seconds
            frr_response = self.activate_frr(self.frequency_deviation)
            self.frequency_deviation -= frr_response / 50000 * dt
        
        # Update system state
        self.system_state = self.standards.get_system_state(self.frequency_deviation)
        
        # Check violations
        if abs(self.frequency_deviation) > self.standards.frequency.standard_frequency_range:
            self.stats.frequency_violations += 1
            self.stats.reliability_score = max(0, self.stats.reliability_score - 0.1)
    
    def check_n_minus_1_security(self) -> bool:
        """Check N-1 security criterion"""
        # Simplified N-1 check - ensure generation margin
        generation = sum(comp['output'] for comp in self.components.values() 
                        if comp['status'] == 'online' and comp['config']['capacity'] > 0)
        
        # Find largest generator
        max_gen = 0
        for comp in self.components.values():
            if comp['status'] == 'online' and comp['config']['capacity'] > 0:
                max_gen = max(max_gen, comp['config']['capacity'])
        
        # N-1 secure if we can lose largest generator and still serve load
        n_minus_1_secure = (generation - max_gen) >= self.load_demand * 1.1  # 10% margin
        
        if not n_minus_1_secure:
            self.stats.n_minus_1_failures += 1
            
        return n_minus_1_secure
    
    def step(self, dt: float = 1.0):
        """Advance simulation by one time step"""
        self.time_elapsed += dt
        
        # Check for grid events
        event = self.simulate_grid_event()
        if event:
            print(f"⚡ Grid Event: {event.name} - {event.description}")
        
        # Update frequency
        self.update_frequency(dt)
        
        # Update statistics
        self.stats.efficiency_score = self._calculate_efficiency()
        compliance = self.standards.check_so_gl_compliance({
            'frequency_deviation': self.frequency_deviation,
            'voltages': {},  # Simplified - no detailed voltage analysis
            'fcr_available': self.fcr_available,
            'n_minus_1_secure': self.check_n_minus_1_security()
        })
        
        self.stats.compliance_score = sum(compliance.values()) / len(compliance) * 100
    
    def _calculate_efficiency(self) -> float:
        """Calculate grid efficiency score"""
        if self.stats.total_cost == 0:
            return 0.0
            
        # Efficiency based on capacity per euro spent
        total_capacity = sum(comp['config']['capacity'] for comp in self.components.values() 
                           if comp['config']['capacity'] > 0)
        
        efficiency = (total_capacity / self.stats.total_cost) * 1000000  # Scale factor
        return min(efficiency, 100.0)
    
    def get_game_status(self) -> Dict:
        """Get current game status"""
        return {
            'budget': self.budget,
            'time_elapsed': self.time_elapsed,
            'frequency': 50.0 + self.frequency_deviation,
            'frequency_deviation_mhz': self.frequency_deviation * 1000,
            'system_state': self.system_state,
            'load_demand': self.load_demand,
            'generation_capacity': self.generation_capacity,
            'fcr_available': self.fcr_available,
            'frr_available': self.frr_available,
            'stats': self.stats,
            'components_count': len(self.components),
            'lines_count': len(self.lines)
        }
    
    def get_so_gl_summary(self) -> str:
        """Get SO GL compliance summary"""
        status = self.get_game_status()
        freq_dev_mhz = abs(status['frequency_deviation_mhz'])
        
        if freq_dev_mhz <= 50:
            freq_status = "✅ NORMAL - Within standard range (±50 mHz)"
        elif freq_dev_mhz <= 200:
            freq_status = "⚠️  ALERT - Outside standard range (±200 mHz limit)"
        else:
            freq_status = "🚨 EMERGENCY - Critical frequency deviation!"
        
        return f"""
Continental Europe SO GL Compliance Status:
==========================================
System Frequency: {status['frequency']:.3f} Hz ({status['frequency_deviation_mhz']:+.1f} mHz)
Status: {freq_status}

Generation: {status['generation_capacity']:.0f} MW
Load Demand: {status['load_demand']:.0f} MW
FCR Available: {status['fcr_available']:.0f} MW
FRR Available: {status['frr_available']:.0f} MW

Grid Statistics:
- Frequency violations: {self.stats.frequency_violations}
- FCR activations: {self.stats.fcr_activations}
- FRR activations: {self.stats.frr_activations}
- Reliability score: {self.stats.reliability_score:.1f}%
- Compliance score: {self.stats.compliance_score:.1f}%
- Efficiency score: {self.stats.efficiency_score:.1f}

Budget: €{status['budget']:,.0f} / €500,000
Components: {status['components_count']} | Lines: {status['lines_count']}
"""
