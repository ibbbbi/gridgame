#!/usr/bin/env python3
"""
Fortran Module Compilation Script
Compiles all Fortran modules using f2py for high-performance grid calculations
"""

import os
import sys
import subprocess
import numpy.f2py
from pathlib import Path

def compile_fortran_module(f90_file, module_name):
    """Compile a single Fortran module using f2py"""
    print(f"Compiling {f90_file} -> {module_name}")
    
    try:
        # Get paths
        fortran_dir = Path(__file__).parent / "fortran"
        f90_path = fortran_dir / f90_file
        
        if not f90_path.exists():
            print(f"Warning: {f90_path} not found")
            return False
        
        # Change to fortran directory
        os.chdir(fortran_dir)
        
        # f2py compilation command
        cmd = [
            sys.executable, "-m", "numpy.f2py",
            "-c", str(f90_file),
            "-m", module_name,
            "--verbose"
        ]
        
        print(f"Running: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✓ Successfully compiled {module_name}")
            return True
        else:
            print(f"✗ Failed to compile {module_name}")
            print("STDOUT:", result.stdout)
            print("STDERR:", result.stderr)
            return False
            
    except Exception as e:
        print(f"✗ Error compiling {f90_file}: {e}")
        return False

def main():
    """Compile all Fortran modules for the European Power Grid Builder"""
    print("European Power Grid Builder - Fortran Module Compilation")
    print("=" * 60)
    
    # List of Fortran modules to compile
    modules = [
        ("power_flow.f90", "power_flow_solver"),
        ("frequency_control.f90", "frequency_control"),
        ("grid_optimization.f90", "grid_optimization"),
        ("uq_control.f90", "uq_control"),
        ("blackstart.f90", "blackstart")
    ]
    
    # Check prerequisites
    try:
        import numpy
        print(f"✓ NumPy version: {numpy.__version__}")
        print(f"✓ NumPy include path: {numpy.get_include()}")
        print(f"✓ f2py include path: {numpy.f2py.get_include()}")
    except Exception as e:
        print(f"✗ NumPy/f2py not available: {e}")
        return False
    
    # Check for gfortran
    try:
        result = subprocess.run(["gfortran", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print("✓ gfortran compiler available")
        else:
            print("✗ gfortran compiler not found")
            print("Please install gfortran: sudo apt install gfortran")
            return False
    except FileNotFoundError:
        print("✗ gfortran compiler not found")
        print("Please install gfortran: sudo apt install gfortran")
        return False
    
    print("\nCompiling Fortran modules...")
    print("-" * 40)
    
    success_count = 0
    for f90_file, module_name in modules:
        if compile_fortran_module(f90_file, module_name):
            success_count += 1
    
    print("\nCompilation Summary:")
    print(f"Successfully compiled: {success_count}/{len(modules)} modules")
    
    if success_count == len(modules):
        print("✓ All Fortran modules compiled successfully!")
        print("\nThe following Python modules are now available:")
        for _, module_name in modules:
            print(f"  - {module_name}")
        return True
    else:
        print("✗ Some modules failed to compile")
        print("Check error messages above for details")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
