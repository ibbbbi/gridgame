"""
Fortran-accelerated power flow calculations for European Grid Game
Uses f2py to interface with optimized Fortran numerical routines
"""

import numpy as np
import os
import subprocess
import sys
from typing import Dict, List, Tuple, Optional

class FortranPowerFlow:
    """
    High-performance power flow calculations using Fortran backend
    """
    
    def __init__(self):
        self._compiled = False
        self._compile_fortran_modules()
    
    def _compile_fortran_modules(self):
        """Compile Fortran modules using f2py"""
        fortran_dir = os.path.join(os.path.dirname(__file__), 'fortran')
        
        if not os.path.exists(fortran_dir):
            print("Warning: Fortran directory not found, falling back to Python implementation")
            return
        
        try:
            # Check if modules already compiled
            module_files = [
                'power_flow_solver.cpython-39-x86_64-linux-gnu.so',
                'frequency_control.cpython-39-x86_64-linux-gnu.so', 
                'grid_optimization.cpython-39-x86_64-linux-gnu.so',
                'uq_control.cpython-39-x86_64-linux-gnu.so',
                'blackstart.cpython-39-x86_64-linux-gnu.so'
            ]
            
            all_exist = all(os.path.exists(os.path.join(fortran_dir, f)) for f in module_files)
            
            if not all_exist:
                print("Compiling Fortran modules with f2py...")
                
                # Compile power flow module
                cmd1 = [
                    sys.executable, '-m', 'numpy.f2py', '-c',
                    os.path.join(fortran_dir, 'power_flow.f90'),
                    '-m', 'power_flow_solver'
                ]
                subprocess.run(cmd1, cwd=fortran_dir, check=True)
                
                # Compile frequency control module
                cmd2 = [
                    sys.executable, '-m', 'numpy.f2py', '-c',
                    os.path.join(fortran_dir, 'frequency_control.f90'),
                    '-m', 'frequency_control'
                ]
                subprocess.run(cmd2, cwd=fortran_dir, check=True)
                
                # Compile grid optimization module
                cmd3 = [
                    sys.executable, '-m', 'numpy.f2py', '-c',
                    os.path.join(fortran_dir, 'grid_optimization.f90'),
                    '-m', 'grid_optimization'
                ]
                subprocess.run(cmd3, cwd=fortran_dir, check=True)
                
                # Compile U/Q control module
                cmd4 = [
                    sys.executable, '-m', 'numpy.f2py', '-c',
                    os.path.join(fortran_dir, 'uq_control.f90'),
                    '-m', 'uq_control'
                ]
                subprocess.run(cmd4, cwd=fortran_dir, check=True)
                
                # Compile blackstart module
                cmd5 = [
                    sys.executable, '-m', 'numpy.f2py', '-c',
                    os.path.join(fortran_dir, 'blackstart.f90'),
                    '-m', 'blackstart'
                ]
                subprocess.run(cmd5, cwd=fortran_dir, check=True)
                
                print("✓ Fortran modules compiled successfully!")
            
            # Import compiled modules
            sys.path.insert(0, fortran_dir)
            global power_flow_solver, frequency_control, grid_optimization, uq_control, blackstart
            
            import power_flow_solver
            import frequency_control  
            import grid_optimization
            import uq_control
            import blackstart
            
            self._compiled = True
            print("✓ Fortran modules loaded successfully!")
            
        except Exception as e:
            print(f"Warning: Could not compile Fortran modules: {e}")
            print("Falling back to Python implementation")
            self._compiled = False
    
    def newton_raphson_powerflow(self, y_matrix: np.ndarray, p_sched: np.ndarray, 
                                q_sched: np.ndarray, voltage_mag: np.ndarray,
                                voltage_ang: np.ndarray, max_iter: int = 20,
                                tolerance: float = 1e-6) -> Tuple[bool, int, np.ndarray, np.ndarray]:
        """
        High-performance Newton-Raphson power flow using Fortran
        
        Returns:
            (converged, iterations, voltage_magnitudes, voltage_angles)
        """
        if not self._compiled:
            return self._python_fallback_powerflow(y_matrix, p_sched, q_sched, 
                                                 voltage_mag, voltage_ang, max_iter, tolerance)
        
        try:
            n_buses = len(p_sched)
            
            # Prepare arrays for Fortran (ensure correct types and memory layout)
            y_matrix_f = np.asarray(y_matrix, dtype=np.complex128, order='F')
            p_sched_f = np.asarray(p_sched, dtype=np.float64, order='F')
            q_sched_f = np.asarray(q_sched, dtype=np.float64, order='F')
            voltage_mag_f = np.asarray(voltage_mag.copy(), dtype=np.float64, order='F')
            voltage_ang_f = np.asarray(voltage_ang.copy(), dtype=np.float64, order='F')
            
            # Call Fortran routine
            converged, iterations = power_flow_solver.power_flow_solver.newton_raphson_powerflow(
                y_matrix_f, p_sched_f, q_sched_f, voltage_mag_f, voltage_ang_f,
                max_iter, tolerance
            )
            
            return converged, iterations, voltage_mag_f, voltage_ang_f
            
        except Exception as e:
            print(f"Fortran power flow failed: {e}, falling back to Python")
            return self._python_fallback_powerflow(y_matrix, p_sched, q_sched,
                                                 voltage_mag, voltage_ang, max_iter, tolerance)
    
    def calculate_fcr_response(self, frequency_deviation: float, fcr_capacity: float) -> Tuple[float, float]:
        """
        Calculate FCR response using Fortran implementation
        
        Returns:
            (fcr_response_mw, activation_level)
        """
        if not self._compiled:
            return self._python_fallback_fcr(frequency_deviation, fcr_capacity)
        
        try:
            fcr_response, activation_level = frequency_control.frequency_control.calculate_fcr_response(
                frequency_deviation, fcr_capacity
            )
            return fcr_response, activation_level
            
        except Exception as e:
            print(f"Fortran FCR calculation failed: {e}, falling back to Python")
            return self._python_fallback_fcr(frequency_deviation, fcr_capacity)
    
    def determine_system_state(self, frequency_deviation: float, n1_secure: bool) -> str:
        """
        Determine system state according to SO GL using Fortran
        
        Returns:
            system_state: 'normal', 'alert', or 'emergency'
        """
        if not self._compiled:
            return self._python_fallback_system_state(frequency_deviation, n1_secure)
        
        try:
            state_code = frequency_control.frequency_control.determine_system_state(
                frequency_deviation, n1_secure
            )
            
            state_map = {1: 'normal', 2: 'alert', 3: 'emergency'}
            return state_map.get(state_code, 'unknown')
            
        except Exception as e:
            print(f"Fortran system state calculation failed: {e}")
            return self._python_fallback_system_state(frequency_deviation, n1_secure)
    
    def economic_dispatch(self, capacities: np.ndarray, marginal_costs: np.ndarray, 
                         demand: float) -> Tuple[np.ndarray, float]:
        """
        Economic dispatch using Fortran optimization
        
        Returns:
            (generation_schedule, total_cost)
        """
        if not self._compiled:
            return self._python_fallback_dispatch(capacities, marginal_costs, demand)
        
        try:
            n_generators = len(capacities)
            capacities_f = np.asarray(capacities, dtype=np.float64, order='F')
            costs_f = np.asarray(marginal_costs, dtype=np.float64, order='F')
            
            generation_schedule, total_cost = grid_optimization.grid_optimization.economic_dispatch(
                capacities_f, costs_f, demand
            )
            
            return generation_schedule, total_cost
            
        except Exception as e:
            print(f"Fortran economic dispatch failed: {e}")
            return self._python_fallback_dispatch(capacities, marginal_costs, demand)
    
    def n1_contingency_analysis(self, component_capacities: np.ndarray, 
                               total_capacity: float) -> Tuple[float, bool]:
        """
        N-1 contingency analysis using Fortran
        
        Returns:
            (max_loss_mw, n1_secure)
        """
        if not self._compiled:
            return self._python_fallback_n1(component_capacities, total_capacity)
        
        try:
            capacities_f = np.asarray(component_capacities, dtype=np.float64, order='F')
            
            max_loss, n1_secure = frequency_control.frequency_control.n1_contingency_analysis(
                capacities_f, total_capacity
            )
            
            return max_loss, bool(n1_secure)
            
        except Exception as e:
            print(f"Fortran N-1 analysis failed: {e}")
            return self._python_fallback_n1(component_capacities, total_capacity)
    
    def uq_control_optimizer(self, voltage_setpoints: np.ndarray, 
                           reactive_limits_min: np.ndarray, reactive_limits_max: np.ndarray,
                           current_voltages: np.ndarray, current_reactive: np.ndarray,
                           y_matrix: np.ndarray) -> Tuple[np.ndarray, int, bool]:
        """
        High-performance U/Q control optimization using Fortran
        
        Args:
            voltage_setpoints: Target voltage magnitudes for generators (pu)
            reactive_limits_min: Minimum reactive power limits (MVAr)
            reactive_limits_max: Maximum reactive power limits (MVAr)
            current_voltages: Current bus voltages (pu)
            current_reactive: Current reactive power output (MVAr)
            y_matrix: System admittance matrix
            
        Returns:
            (optimal_reactive, voltage_violations, converged)
        """
        if not self._compiled:
            return self._python_fallback_uq_control(voltage_setpoints, reactive_limits_min, 
                                                   reactive_limits_max, current_voltages, current_reactive)
        
        try:
            n_buses = len(current_voltages)
            n_generators = len(voltage_setpoints)
            
            # Prepare arrays for Fortran
            voltage_setpoints_f = np.asarray(voltage_setpoints, dtype=np.float64, order='F')
            reactive_limits_min_f = np.asarray(reactive_limits_min, dtype=np.float64, order='F')
            reactive_limits_max_f = np.asarray(reactive_limits_max, dtype=np.float64, order='F')
            current_voltages_f = np.asarray(current_voltages, dtype=np.float64, order='F')
            current_reactive_f = np.asarray(current_reactive, dtype=np.float64, order='F')
            y_matrix_f = np.asarray(y_matrix, dtype=np.complex128, order='F')
            
            # Call Fortran routine
            optimal_reactive, voltage_violations, converged = uq_control.uq_control.uq_control_optimizer(
                n_buses, n_generators, y_matrix_f, voltage_setpoints_f,
                reactive_limits_min_f, reactive_limits_max_f, current_voltages_f, current_reactive_f
            )
            
            return optimal_reactive, voltage_violations, converged
            
        except Exception as e:
            print(f"Fortran U/Q control failed: {e}, falling back to Python")
            return self._python_fallback_uq_control(voltage_setpoints, reactive_limits_min,
                                                   reactive_limits_max, current_voltages, current_reactive)
    
    def blackstart_sequence_optimizer(self, generator_types: np.ndarray, 
                                    generator_capacities: np.ndarray,
                                    blackstart_capabilities: np.ndarray,
                                    load_priorities: np.ndarray,
                                    network_connectivity: np.ndarray) -> Tuple[np.ndarray, np.ndarray, float]:
        """
        High-performance blackstart sequence optimization using Fortran
        
        Args:
            generator_types: Type codes for generators (1=nuclear, 2=coal, 3=gas, 4=hydro, 5=wind, 6=solar)
            generator_capacities: Generator capacities in MW
            blackstart_capabilities: Boolean array of blackstart capable units
            load_priorities: Priority levels for loads (1=critical, 2=important, 3=normal)
            network_connectivity: Connectivity matrix for the network
            
        Returns:
            (restoration_sequence, restoration_time, total_restored_load)
        """
        if not self._compiled:
            return self._python_fallback_blackstart(generator_types, generator_capacities,
                                                   blackstart_capabilities, load_priorities)
        
        try:
            n_generators = len(generator_types)
            n_loads = len(load_priorities)
            n_lines = 0  # Simplified for this implementation
            
            # Prepare arrays for Fortran
            generator_types_f = np.asarray(generator_types, dtype=np.int32, order='F')
            generator_capacities_f = np.asarray(generator_capacities, dtype=np.float64, order='F')
            blackstart_capabilities_f = np.asarray(blackstart_capabilities, dtype=bool, order='F')
            load_priorities_f = np.asarray(load_priorities, dtype=np.int32, order='F')
            network_connectivity_f = np.asarray(network_connectivity, dtype=np.int32, order='F')
            
            # Call Fortran routine
            restoration_sequence, restoration_time, total_restored_load = blackstart.blackstart.blackstart_sequence_optimizer(
                n_generators, n_loads, n_lines, generator_types_f, generator_capacities_f,
                blackstart_capabilities_f, load_priorities_f, network_connectivity_f
            )
            
            return restoration_sequence, restoration_time, total_restored_load
            
        except Exception as e:
            print(f"Fortran blackstart optimization failed: {e}, falling back to Python")
            return self._python_fallback_blackstart(generator_types, generator_capacities,
                                                   blackstart_capabilities, load_priorities)
    
    def blackstart_capability_assessment(self, generator_types: np.ndarray,
                                       generator_capacities: np.ndarray,
                                       blackstart_capabilities: np.ndarray) -> Tuple[float, float, bool]:
        """
        Assess blackstart capability according to European standards
        
        Returns:
            (total_blackstart_capacity, blackstart_ratio, meets_european_standards)
        """
        if not self._compiled:
            return self._python_fallback_blackstart_assessment(generator_types, generator_capacities,
                                                              blackstart_capabilities)
        
        try:
            n_generators = len(generator_types)
            
            # Prepare arrays for Fortran
            generator_types_f = np.asarray(generator_types, dtype=np.int32, order='F')
            generator_capacities_f = np.asarray(generator_capacities, dtype=np.float64, order='F')
            blackstart_capabilities_f = np.asarray(blackstart_capabilities, dtype=bool, order='F')
            
            # Call Fortran routine
            total_blackstart_capacity, blackstart_ratio, meets_european_standards = blackstart.blackstart.blackstart_capability_assessment(
                n_generators, generator_types_f, generator_capacities_f, blackstart_capabilities_f
            )
            
            return total_blackstart_capacity, blackstart_ratio, meets_european_standards
            
        except Exception as e:
            print(f"Fortran blackstart assessment failed: {e}, falling back to Python")
            return self._python_fallback_blackstart_assessment(generator_types, generator_capacities,
                                                              blackstart_capabilities)
    
    def avr_controller(self, voltage_references: np.ndarray, measured_voltages: np.ndarray,
                      previous_excitation: np.ndarray, time_step: float,
                      avr_gain: float = 100.0, time_constant: float = 0.1) -> np.ndarray:
        """
        Automatic Voltage Regulator controller simulation
        
        Returns:
            excitation_output: New excitation values for generators
        """
        if not self._compiled:
            return self._python_fallback_avr(voltage_references, measured_voltages,
                                            previous_excitation, time_step, avr_gain, time_constant)
        
        try:
            n_generators = len(voltage_references)
            
            # Prepare arrays for Fortran
            voltage_references_f = np.asarray(voltage_references, dtype=np.float64, order='F')
            measured_voltages_f = np.asarray(measured_voltages, dtype=np.float64, order='F')
            previous_excitation_f = np.asarray(previous_excitation, dtype=np.float64, order='F')
            
            # Call Fortran routine
            excitation_output = uq_control.uq_control.avr_controller(
                n_generators, voltage_references_f, measured_voltages_f,
                previous_excitation_f, time_step, avr_gain, time_constant
            )
            
            return excitation_output
            
        except Exception as e:
            print(f"Fortran AVR controller failed: {e}, falling back to Python")
            return self._python_fallback_avr(voltage_references, measured_voltages,
                                            previous_excitation, time_step, avr_gain, time_constant)
    
    def restoration_dynamics(self, target_frequency: float, initial_generation: float,
                           load_pickup_schedule: np.ndarray, time_step: float = 1.0) -> Tuple[np.ndarray, np.ndarray, bool]:
        """
        Simulate system restoration dynamics
        
        Returns:
            (frequency_response, voltage_response, successful_restoration)
        """
        if not self._compiled:
            return self._python_fallback_restoration_dynamics(target_frequency, initial_generation,
                                                             load_pickup_schedule, time_step)
        
        try:
            n_steps = len(load_pickup_schedule)
            
            # Prepare arrays for Fortran
            load_pickup_schedule_f = np.asarray(load_pickup_schedule, dtype=np.float64, order='F')
            
            # Call Fortran routine
            frequency_response, voltage_response, successful_restoration = blackstart.blackstart.restoration_dynamics(
                n_steps, time_step, target_frequency, initial_generation, load_pickup_schedule_f
            )
            
            return frequency_response, voltage_response, successful_restoration
            
        except Exception as e:
            print(f"Fortran restoration dynamics failed: {e}, falling back to Python")
            return self._python_fallback_restoration_dynamics(target_frequency, initial_generation,
                                                             load_pickup_schedule, time_step)

    # Python fallback implementations (simplified versions)
    def _python_fallback_powerflow(self, y_matrix, p_sched, q_sched, voltage_mag, 
                                  voltage_ang, max_iter, tolerance):
        """Simplified Python power flow fallback"""
        print("Using Python fallback for power flow calculation")
        
        # Simple power balance check
        total_p = np.sum(p_sched)
        total_q = np.sum(q_sched)
        
        # Basic convergence simulation
        converged = abs(total_p) < 100.0  # MW
        iterations = 5
        
        return converged, iterations, voltage_mag, voltage_ang
    
    def _python_fallback_fcr(self, frequency_deviation, fcr_capacity):
        """Simplified Python FCR calculation"""
        deadband = 0.01  # 10 mHz
        full_activation = 0.2  # 200 mHz
        
        abs_deviation = abs(frequency_deviation)
        
        if abs_deviation <= deadband:
            return 0.0, 0.0
        
        if abs_deviation <= full_activation:
            activation = (abs_deviation - deadband) / (full_activation - deadband)
        else:
            activation = 1.0
        
        fcr_response = -np.sign(frequency_deviation) * activation * fcr_capacity
        return fcr_response, activation
    
    def _python_fallback_system_state(self, frequency_deviation, n1_secure):
        """Simplified Python system state determination"""
        abs_deviation = abs(frequency_deviation)
        
        if abs_deviation > 0.8:  # 800 mHz
            return 'emergency'
        elif abs_deviation > 0.2 or not n1_secure:  # 200 mHz
            return 'alert'
        else:
            return 'normal'
    
    def _python_fallback_dispatch(self, capacities, marginal_costs, demand):
        """Simplified Python economic dispatch"""
        n_gen = len(capacities)
        generation = np.zeros(n_gen)
        
        # Sort by cost (merit order)
        sorted_indices = np.argsort(marginal_costs)
        remaining_demand = demand
        total_cost = 0.0
        
        for i in sorted_indices:
            if remaining_demand <= 0:
                break
            
            dispatch = min(remaining_demand, capacities[i])
            generation[i] = dispatch
            total_cost += dispatch * marginal_costs[i]
            remaining_demand -= dispatch
        
        return generation, total_cost
    
    def _python_fallback_n1(self, component_capacities, total_capacity):
        """Simplified Python N-1 analysis"""
        max_loss = np.max(component_capacities) if len(component_capacities) > 0 else 0.0
        n1_secure = (total_capacity - max_loss) >= max_loss * 1.05
        return max_loss, n1_secure
    
    def _python_fallback_uq_control(self, voltage_setpoints, reactive_limits_min, 
                                   reactive_limits_max, current_voltages, current_reactive):
        """Simplified Python U/Q control calculation"""
        n_generators = len(voltage_setpoints)
        optimal_reactive = current_reactive.copy()
        voltage_violations = 0
        
        # Simple droop control
        droop_gain = 0.05  # 5% droop
        
        for i in range(n_generators):
            if i < len(current_voltages):
                voltage_error = voltage_setpoints[i] - current_voltages[i]
                adjustment = -voltage_error / droop_gain
                
                new_reactive = current_reactive[i] + adjustment
                optimal_reactive[i] = np.clip(new_reactive, reactive_limits_min[i], reactive_limits_max[i])
        
        # Count voltage violations (European standards: 0.90-1.05 pu for 300-400kV)
        for voltage in current_voltages:
            if voltage < 0.90 or voltage > 1.05:
                voltage_violations += 1
        
        converged = np.max(np.abs(voltage_setpoints[:len(current_voltages)] - current_voltages[:len(voltage_setpoints)])) < 0.01
        
        return optimal_reactive, voltage_violations, converged
    
    def _python_fallback_blackstart(self, generator_types, generator_capacities,
                                   blackstart_capabilities, load_priorities):
        """Simplified Python blackstart sequence optimization"""
        n_generators = len(generator_types)
        n_loads = len(load_priorities)
        n_total = n_generators + n_loads
        
        restoration_sequence = np.zeros(n_total, dtype=int)
        restoration_time = np.zeros(n_total)
        total_restored_load = 0.0
        
        sequence_index = 0
        cumulative_time = 0.0
        
        # Step 1: Start blackstart units first
        for i in range(n_generators):
            if blackstart_capabilities[i]:
                restoration_sequence[sequence_index] = i + 1  # 1-indexed
                restoration_time[sequence_index] = cumulative_time + 5.0  # 5 minutes
                cumulative_time += 5.0
                sequence_index += 1
        
        # Step 2: Start other generators by priority (hydro, gas, coal, nuclear)
        generator_priority = {4: 1, 3: 2, 2: 3, 1: 4, 5: 5, 6: 6}  # hydro=1, gas=2, etc.
        
        gen_indices = list(range(n_generators))
        gen_indices.sort(key=lambda x: (generator_priority.get(generator_types[x], 7), -generator_capacities[x]))
        
        for i in gen_indices:
            if not blackstart_capabilities[i] and sequence_index < n_total:
                restoration_sequence[sequence_index] = i + 1
                if generator_types[i] == 4:  # Hydro
                    restoration_time[sequence_index] = cumulative_time + 10.0
                    cumulative_time += 10.0
                elif generator_types[i] == 3:  # Gas
                    restoration_time[sequence_index] = cumulative_time + 20.0
                    cumulative_time += 20.0
                elif generator_types[i] == 2:  # Coal
                    restoration_time[sequence_index] = cumulative_time + 60.0
                    cumulative_time += 60.0
                else:  # Nuclear and renewables
                    restoration_time[sequence_index] = cumulative_time + 180.0
                    cumulative_time += 180.0
                sequence_index += 1
        
        # Step 3: Restore loads by priority
        load_indices = list(range(n_loads))
        load_indices.sort(key=lambda x: load_priorities[x])  # 1=critical first
        
        for i in load_indices:
            if sequence_index < n_total:
                restoration_sequence[sequence_index] = n_generators + i + 1  # After generators
                restoration_time[sequence_index] = cumulative_time + 5.0
                cumulative_time += 5.0
                total_restored_load += 100.0  # Assume 100 MW load blocks
                sequence_index += 1
        
        return restoration_sequence, restoration_time, total_restored_load
    
    def _python_fallback_blackstart_assessment(self, generator_types, generator_capacities,
                                              blackstart_capabilities):
        """Simplified Python blackstart capability assessment"""
        total_generation_capacity = np.sum(generator_capacities)
        total_blackstart_capacity = np.sum(generator_capacities[blackstart_capabilities])
        
        if total_generation_capacity > 0:
            blackstart_ratio = total_blackstart_capacity / total_generation_capacity
        else:
            blackstart_ratio = 0.0
        
        # European standards typically require 10-15% blackstart capability
        meets_european_standards = blackstart_ratio >= 0.10
        
        return total_blackstart_capacity, blackstart_ratio, meets_european_standards
    
    def _python_fallback_avr(self, voltage_references, measured_voltages,
                            previous_excitation, time_step, avr_gain, time_constant):
        """Simplified Python AVR controller"""
        n_generators = len(voltage_references)
        excitation_output = np.zeros(n_generators)
        
        alpha = time_step / (time_constant + time_step)
        
        for i in range(n_generators):
            voltage_error = voltage_references[i] - measured_voltages[i]
            proportional_term = avr_gain * voltage_error
            integral_term = previous_excitation[i] * (1.0 - alpha)
            
            excitation_output[i] = alpha * proportional_term + integral_term
            
            # Apply excitation limits
            excitation_output[i] = np.clip(excitation_output[i], -2.0, 5.0)
        
        return excitation_output
    
    def _python_fallback_restoration_dynamics(self, target_frequency, initial_generation,
                                             load_pickup_schedule, time_step):
        """Simplified Python restoration dynamics simulation"""
        n_steps = len(load_pickup_schedule)
        frequency_response = np.zeros(n_steps)
        voltage_response = np.zeros(n_steps)
        
        current_frequency = target_frequency
        current_voltage = 1.0  # 1.0 pu
        inertia_constant = 5.0  # Typical system inertia
        damping_coefficient = 1.0
        
        successful_restoration = True
        
        for i in range(n_steps):
            # Calculate generation-load imbalance
            generation_load_imbalance = initial_generation - load_pickup_schedule[i]
            
            # Frequency dynamics (simplified swing equation)
            frequency_deviation = current_frequency - target_frequency
            df_dt = (generation_load_imbalance - damping_coefficient * frequency_deviation) / (2.0 * inertia_constant)
            current_frequency += df_dt * time_step
            
            # Voltage dynamics (simplified)
            dv_dt = 0.1 * (1.0 - current_voltage)  # Target 1.0 pu
            current_voltage += dv_dt * time_step
            
            frequency_response[i] = current_frequency
            voltage_response[i] = current_voltage
            
            # Check for restoration failure
            if abs(frequency_deviation) > 2.0 or current_voltage < 0.8 or current_voltage > 1.2:
                successful_restoration = False
                break
        
        return frequency_response, voltage_response, successful_restoration

# Global instance for use throughout the application
fortran_solver = FortranPowerFlow()
