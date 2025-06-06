"""
European Grid Standards - Continental Europe SO GL Parameters
Implementation of actual ENTSO-E System Operation Guideline parameters for Continental Europe
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
import math

@dataclass
class FrequencyStandards:
    """Continental Europe Frequency Quality Standards (SO GL Annex III)"""
    nominal_frequency: float = 50.0  # Hz
    standard_frequency_range: float = 0.050  # ± 50 mHz
    max_instantaneous_frequency_deviation: float = 0.800  # 800 mHz
    max_steady_state_frequency_deviation: float = 0.200  # 200 mHz
    time_to_restore_frequency: float = 15.0  # 15 minutes
    alert_state_trigger_time: float = 5.0  # 5 minutes
    
    # FCR Parameters
    fcr_full_activation_time: float = 30.0  # 30 seconds
    fcr_full_activation_frequency_deviation: float = 0.200  # ± 200 mHz
    fcr_deadband: float = 0.010  # 10 mHz maximum deadband
    fcr_minimum_accuracy: float = 0.010  # 10 mHz frequency measurement accuracy

@dataclass 
class VoltageStandards:
    """Continental Europe Voltage Standards (SO GL Annex II)"""
    # Voltage ranges in per unit (pu)
    voltage_110_300kv_min: float = 0.90  # 0.90 pu
    voltage_110_300kv_max: float = 1.118  # 1.118 pu
    voltage_300_400kv_min: float = 0.90  # 0.90 pu
    voltage_300_400kv_max: float = 1.05  # 1.05 pu
    
    # Standard voltage levels in kV
    voltage_levels: List[int] = None
    
    def __post_init__(self):
        if self.voltage_levels is None:
            self.voltage_levels = [400, 220, 110, 50, 20, 10]

@dataclass
class ReserveStandards:
    """Continental Europe Reserve Standards"""
    # FCR Requirements
    reference_incident: float = 3000.0  # 3,000 MW reference incident
    fcr_sharing_minimum_local: float = 0.30  # 30% must be physically local
    fcr_sharing_maximum_remote: float = 0.30  # Max 30% from other LFC blocks
    fcr_sharing_absolute_limit: float = 100.0  # 100 MW absolute limit
    
    # FRR Requirements
    frr_automatic_activation_delay: float = 30.0  # Max 30 seconds
    frr_full_activation_time_auto: float = 15.0 * 60  # 15 minutes max
    frr_full_activation_time_manual: float = 15.0 * 60  # 15 minutes max
    
    # Energy reservoir requirements
    fcr_minimum_activation_period: float = 15.0 * 60  # 15 minutes minimum
    fcr_maximum_activation_period: float = 30.0 * 60  # 30 minutes maximum
    
    # Recovery requirements
    energy_reservoir_recovery_time: float = 2.0 * 3600  # 2 hours after alert state

@dataclass
class NetworkStandards:
    """Continental Europe Network Standards"""
    # Line parameters (per km)
    transmission_400kv_resistance: float = 0.03  # Ohm/km
    transmission_400kv_reactance: float = 0.3   # Ohm/km
    transmission_220kv_resistance: float = 0.05  # Ohm/km
    transmission_220kv_reactance: float = 0.35  # Ohm/km
    distribution_110kv_resistance: float = 0.1   # Ohm/km
    distribution_110kv_reactance: float = 0.4   # Ohm/km
    
    # Thermal limits (MVA)
    line_400kv_thermal_limit: float = 3000.0
    line_220kv_thermal_limit: float = 1000.0
    line_110kv_thermal_limit: float = 300.0
    
    # N-1 requirements
    n_minus_1_required: bool = True
    security_margin: float = 0.20  # 20% security margin

class EuropeanGridStandards:
    """Complete European Grid Standards Implementation"""
    
    def __init__(self):
        self.frequency = FrequencyStandards()
        self.voltage = VoltageStandards()
        self.reserves = ReserveStandards()
        self.network = NetworkStandards()
        
        # Operational states
        self.system_states = {
            'normal': {
                'frequency_range': (-self.frequency.standard_frequency_range, 
                                  self.frequency.standard_frequency_range),
                'description': 'Normal operation within ±50 mHz'
            },
            'alert': {
                'frequency_range': (-self.frequency.max_steady_state_frequency_deviation,
                                  self.frequency.max_steady_state_frequency_deviation),
                'description': 'Alert state within ±200 mHz'
            },
            'emergency': {
                'frequency_range': (-self.frequency.max_instantaneous_frequency_deviation,
                                  self.frequency.max_instantaneous_frequency_deviation),
                'description': 'Emergency state within ±800 mHz'
            }
        }
    
    def get_system_state(self, frequency_deviation: float) -> str:
        """Determine system state based on frequency deviation"""
        abs_dev = abs(frequency_deviation)
        
        if abs_dev <= self.frequency.standard_frequency_range:
            return 'normal'
        elif abs_dev <= self.frequency.max_steady_state_frequency_deviation:
            return 'alert'
        else:
            return 'emergency'
    
    def calculate_fcr_activation(self, frequency_deviation: float) -> float:
        """Calculate FCR activation based on Continental Europe requirements"""
        abs_dev = abs(frequency_deviation)
        
        # Apply deadband
        if abs_dev <= self.frequency.fcr_deadband:
            return 0.0
        
        # Linear activation up to full activation point
        if abs_dev >= self.frequency.fcr_full_activation_frequency_deviation:
            return 1.0 if frequency_deviation > 0 else -1.0
        
        # Proportional activation within range
        activation_ratio = (abs_dev - self.frequency.fcr_deadband) / \
                          (self.frequency.fcr_full_activation_frequency_deviation - self.frequency.fcr_deadband)
        
        return activation_ratio if frequency_deviation > 0 else -activation_ratio
    
    def validate_voltage_level(self, voltage_pu: float, voltage_level_kv: int) -> bool:
        """Validate voltage level against Continental Europe standards"""
        if voltage_level_kv >= 300:
            return (self.voltage.voltage_300_400kv_min <= voltage_pu <= 
                   self.voltage.voltage_300_400kv_max)
        else:
            return (self.voltage.voltage_110_300kv_min <= voltage_pu <= 
                   self.voltage.voltage_110_300kv_max)
    
    def calculate_line_parameters(self, voltage_level_kv: int, length_km: float) -> Dict[str, float]:
        """Calculate line parameters based on Continental Europe standards"""
        if voltage_level_kv >= 400:
            resistance = self.network.transmission_400kv_resistance * length_km
            reactance = self.network.transmission_400kv_reactance * length_km
            thermal_limit = self.network.line_400kv_thermal_limit
        elif voltage_level_kv >= 220:
            resistance = self.network.transmission_220kv_resistance * length_km
            reactance = self.network.transmission_220kv_reactance * length_km
            thermal_limit = self.network.line_220kv_thermal_limit
        else:
            resistance = self.network.distribution_110kv_resistance * length_km
            reactance = self.network.distribution_110kv_reactance * length_km
            thermal_limit = self.network.line_110kv_thermal_limit
        
        return {
            'resistance': resistance,
            'reactance': reactance,
            'thermal_limit': thermal_limit,
            'voltage_level': voltage_level_kv
        }
    
    def check_so_gl_compliance(self, simulation_results: Dict) -> Dict[str, bool]:
        """Check compliance with SO GL requirements"""
        compliance = {}
        
        # Frequency quality checks
        freq_dev = simulation_results.get('frequency_deviation', 0.0)
        compliance['frequency_within_standard'] = abs(freq_dev) <= self.frequency.standard_frequency_range
        compliance['frequency_within_alert'] = abs(freq_dev) <= self.frequency.max_steady_state_frequency_deviation
        compliance['frequency_safe'] = abs(freq_dev) <= self.frequency.max_instantaneous_frequency_deviation
        
        # Voltage quality checks
        voltages = simulation_results.get('voltages', {})
        compliance['voltages_within_limits'] = all(
            self.validate_voltage_level(v['magnitude'], v['level']) 
            for v in voltages.values()
        )
        
        # Reserve requirements
        fcr_available = simulation_results.get('fcr_available', 0.0)
        compliance['sufficient_fcr'] = fcr_available >= self.reserves.reference_incident
        
        # N-1 security
        compliance['n_minus_1_secure'] = simulation_results.get('n_minus_1_secure', False)
        
        return compliance
    
    def get_grid_code_summary(self) -> str:
        """Get a summary of key Continental Europe Grid Code parameters"""
        return f"""
Continental Europe SO GL Standards Summary:
==========================================

FREQUENCY STANDARDS:
- Nominal frequency: {self.frequency.nominal_frequency} Hz
- Standard range: ±{self.frequency.standard_frequency_range*1000} mHz
- Alert state: ±{self.frequency.max_steady_state_frequency_deviation*1000} mHz  
- Emergency limit: ±{self.frequency.max_instantaneous_frequency_deviation*1000} mHz
- Time to restore: {self.frequency.time_to_restore_frequency} minutes

FCR REQUIREMENTS:
- Full activation time: {self.frequency.fcr_full_activation_time} seconds
- Full activation at: ±{self.frequency.fcr_full_activation_frequency_deviation*1000} mHz
- Deadband: {self.frequency.fcr_deadband*1000} mHz maximum
- Reference incident: {self.reserves.reference_incident:,.0f} MW

VOLTAGE STANDARDS:
- 110-300 kV: {self.voltage.voltage_110_300kv_min}-{self.voltage.voltage_110_300kv_max} pu
- 300-400 kV: {self.voltage.voltage_300_400kv_min}-{self.voltage.voltage_300_400kv_max} pu

NETWORK REQUIREMENTS:
- N-1 security criterion mandatory
- Security margin: {self.network.security_margin*100}%
"""
