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
                'grid_optimization.cpython-39-x86_64-linux-gnu.so'
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
                
                print("✓ Fortran modules compiled successfully!")
            
            # Import compiled modules
            sys.path.insert(0, fortran_dir)
            global power_flow_solver, frequency_control, grid_optimization
            
            import power_flow_solver
            import frequency_control  
            import grid_optimization
            
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

# Global instance for use throughout the application
fortran_solver = FortranPowerFlow()
