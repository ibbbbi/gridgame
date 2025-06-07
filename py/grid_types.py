"""
Grid Types - Python equivalent of GridTypes.ts
Defines all the data structures and types for the power grid simulation.
"""

from typing import Dict, List, Optional, Union, Literal
from dataclasses import dataclass
from enum import Enum
import math

@dataclass
class Point:
    x: float
    y: float

# Type aliases using Literal for better type checking
ComponentType = Literal['generator', 'substation', 'load']
LineType = Literal['transmission-line', 'distribution-line', 'hvdc-line']
NetworkType = Literal['radial', 'meshed']
VoltageLevel = Literal[400, 220, 110, 50, 20, 10]  # European voltage levels in kV

@dataclass
class GridNode:
    """Grid Node - allows multiple components to connect to same electrical point"""
    id: str
    position: Point
    voltage: VoltageLevel
    connected_components: List[str]  # Component IDs connected to this node
    connected_lines: List[str]  # Line IDs connected to this node
    is_visible: bool = True  # Whether to render the node visually

@dataclass
class Command:
    """Command interface for undo/redo functionality"""
    id: str
    type: Literal['place-component', 'place-line', 'delete-component', 'delete-line', 'place-node', 'delete-node']
    timestamp: float
    data: Dict  # Command-specific data
    execute_func: callable
    undo_func: callable
    
    def execute(self):
        return self.execute_func()
    
    def undo(self):
        return self.undo_func()

@dataclass
class GridComponent:
    """Main grid component (generator, substation, load)"""
    id: str
    type: ComponentType
    position: Point
    capacity: float  # MW
    cost: float
    connections: List[str]  # IDs of connected components/nodes
    voltage: VoltageLevel  # kV - European standard levels
    is_active: bool = True
    connected_node: Optional[str] = None  # ID of grid node this component is connected to
    # AC power flow parameters
    active_power: float = 0.0  # MW
    reactive_power: float = 0.0  # MVAr
    voltage_magnitude: float = 1.0  # per unit (0.95-1.05)
    voltage_angle: float = 0.0  # degrees
    frequency: float = 50.0  # Hz (50 Hz European standard)
    
    # U/Q Control Parameters
    voltage_control_enabled: bool = False  # Voltage/reactive power control capability
    voltage_setpoint: float = 1.0  # per unit voltage setpoint
    reactive_power_limits: Dict[str, float] = None  # {'min': -200, 'max': 200} MVAr
    avr_enabled: bool = False  # Automatic Voltage Regulator
    excitation_system_type: str = 'static'  # 'static', 'rotating', 'digital'
    
    # Blackstart Capability Parameters  
    blackstart_capable: bool = False  # Can provide blackstart service
    blackstart_time: float = 15.0  # minutes to start from cold
    generator_type: str = 'unknown'  # 'hydro', 'gas', 'coal', 'nuclear', etc.
    load_type: str = 'normal'  # 'critical', 'important', 'normal' for loads
    restoration_priority: int = 5  # Lower number = higher priority
    
    def __post_init__(self):
        if self.reactive_power_limits is None:
            # Default reactive power limits based on component type
            if self.type == 'generator':
                self.reactive_power_limits = {'min': -self.capacity * 0.5, 'max': self.capacity * 0.5}
            else:
                self.reactive_power_limits = {'min': 0.0, 'max': 0.0}

@dataclass
class PowerLine:
    """Power transmission line"""
    id: str
    type: LineType
    from_id: str  # Component ID or Node ID
    to_id: str  # Component ID or Node ID
    length: float  # km
    cost: float
    capacity: float  # MVA (apparent power)
    # AC circuit parameters
    resistance: float  # Ohms per km
    reactance: float  # Ohms per km
    susceptance: float  # Siemens per km
    thermal_limit: float  # MVA
    is_active: bool = True
    # N-1 contingency status
    is_contingency: bool = False  # If this line is out for N-1 analysis

@dataclass
class GridStats:
    """Grid statistics"""
    budget: float
    total_generation: float
    total_load: float
    load_served: float
    efficiency: float
    reliability: float

@dataclass
class ACBusData:
    """AC Bus Data for power flow calculations"""
    id: str
    type: Literal['slack', 'pv', 'pq']  # Slack (reference), PV (generator), PQ (load)
    active_power: float  # MW
    reactive_power: float  # MVAr
    voltage_magnitude: float  # per unit
    voltage_angle: float  # radians
    min_voltage: float = 0.95  # per unit
    max_voltage: float = 1.05  # per unit

@dataclass
class ACLineData:
    """AC Line Data for power flow calculations"""
    id: str
    from_bus: str
    to_bus: str
    resistance: float  # per unit
    reactance: float  # per unit
    susceptance: float  # per unit
    thermal_limit: float  # MVA
    is_active: bool = True

@dataclass
class N1AnalysisResult:
    """N-1 Contingency Analysis Result"""
    contingency_line: str
    success: bool
    overloaded_lines: List[str]
    voltage_violations: List[str]
    load_shed: float  # MW

@dataclass
class SimulationResult:
    """Complete simulation result"""
    success: bool
    load_served: float
    efficiency: float
    reliability: float
    power_flow: Dict[str, float]
    voltages: Dict[str, float]
    errors: List[str]
    # Enhanced European grid simulation results
    n1_analysis: List[N1AnalysisResult]
    frequency: float
    system_stability: bool
    renewable_integration: float  # percentage
    warnings: List[str]
    # Additional AC power flow results
    convergence: bool
    iterations: int
    max_power_mismatch: float
    total_losses: float  # MW
    voltage_profile: Dict[str, Dict[str, float]]  # {bus_id: {magnitude: float, angle: float}}
    line_loading: Dict[str, Dict[str, float]]  # {line_id: {loading: float, limit: float, percentage: float}}

@dataclass
class Complex:
    """Complex number for AC calculations"""
    real: float
    imag: float
    
    def __add__(self, other):
        return Complex(self.real + other.real, self.imag + other.imag)
    
    def __sub__(self, other):
        return Complex(self.real - other.real, self.imag - other.imag)
    
    def __mul__(self, other):
        if isinstance(other, (int, float)):
            return Complex(self.real * other, self.imag * other)
        return Complex(
            self.real * other.real - self.imag * other.imag,
            self.real * other.imag + self.imag * other.real
        )
    
    def __truediv__(self, other):
        if isinstance(other, (int, float)):
            return Complex(self.real / other, self.imag / other)
        denominator = other.real ** 2 + other.imag ** 2
        return Complex(
            (self.real * other.real + self.imag * other.imag) / denominator,
            (self.imag * other.real - self.real * other.imag) / denominator
        )
    
    def magnitude(self):
        return math.sqrt(self.real ** 2 + self.imag ** 2)
    
    def angle(self):
        return math.atan2(self.imag, self.real)
    
    def conjugate(self):
        return Complex(self.real, -self.imag)
