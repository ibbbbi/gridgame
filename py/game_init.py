#!/usr/bin/env python3
"""
Grid Game Initialization Script
Handles game setup, configuration, and initial state for the Grid Game
"""

import os
import json
import sys
from datetime import datetime
from typing import Dict, List, Any

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from grid_simulation import GridSimulation, GridComponent, TransmissionLine
except ImportError as e:
    print(f"Error importing game modules: {e}")
    print("Make sure all required files are in the py/ directory")
    sys.exit(1)

class GameInitializer:
    """Handles game initialization and setup"""
    
    def __init__(self, config_file: str = "game_config.json"):
        self.config_file = config_file
        self.default_config = {
            "game_settings": {
                "initial_budget": 500000,
                "difficulty": "medium",
                "time_limit": 300,  # 5 minutes
                "grid_size": 8,
                "target_score": 1000
            },
            "components": {
                "generators": [
                    {"name": "Coal Plant", "capacity": 500, "cost": 50000, "reliability": 0.85},
                    {"name": "Gas Plant", "capacity": 300, "cost": 30000, "reliability": 0.90},
                    {"name": "Nuclear Plant", "capacity": 1000, "cost": 100000, "reliability": 0.95},
                    {"name": "Solar Farm", "capacity": 100, "cost": 15000, "reliability": 0.70},
                    {"name": "Wind Farm", "capacity": 150, "cost": 20000, "reliability": 0.75},
                    {"name": "Hydro Plant", "capacity": 200, "cost": 25000, "reliability": 0.92}
                ],
                "substations": [
                    {"name": "Small Substation", "capacity": 200, "cost": 5000},
                    {"name": "Medium Substation", "capacity": 500, "cost": 12000},
                    {"name": "Large Substation", "capacity": 1000, "cost": 25000}
                ],
                "load_centers": [
                    {"name": "Residential Area", "capacity": 100, "cost": 0, "demand": 80},
                    {"name": "Commercial District", "capacity": 200, "cost": 0, "demand": 150},
                    {"name": "Industrial Zone", "capacity": 500, "cost": 0, "demand": 400}
                ]
            },
            "transmission_lines": [
                {"type": "Distribution Line", "capacity": 50, "cost_per_km": 1000},
                {"type": "Transmission Line", "capacity": 300, "cost_per_km": 2000},
                {"type": "High Voltage Line", "capacity": 800, "cost_per_km": 5000},
                {"type": "Underground Cable", "capacity": 200, "cost_per_km": 8000}
            ]
        }
        self.config = self.load_config()
    
    def load_config(self) -> Dict[str, Any]:
        """Load game configuration from file or create default"""
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r') as f:
                    config = json.load(f)
                print(f"✓ Loaded configuration from {self.config_file}")
                return config
            else:
                print(f"⚠ Configuration file not found, creating default: {self.config_file}")
                self.save_config(self.default_config)
                return self.default_config
        except Exception as e:
            print(f"✗ Error loading config: {e}")
            print("Using default configuration")
            return self.default_config
    
    def save_config(self, config: Dict[str, Any]) -> None:
        """Save configuration to file"""
        try:
            with open(self.config_file, 'w') as f:
                json.dump(config, f, indent=2)
            print(f"✓ Configuration saved to {self.config_file}")
        except Exception as e:
            print(f"✗ Error saving config: {e}")
    
    def create_game_session(self) -> GridSimulation:
        """Create a new game session with initialized components"""
        print("\n" + "="*50)
        print("🔌 GRID GAME - POWER SYSTEM BUILDER")
        print("="*50)
        
        # Initialize simulation with configured budget
        sim = GridSimulation()
        sim.budget = self.config["game_settings"]["initial_budget"]
        
        print(f"💰 Starting Budget: ${sim.budget:,}")
        print(f"🎯 Target Score: {self.config['game_settings']['target_score']}")
        print(f"⏱️  Time Limit: {self.config['game_settings']['time_limit']} seconds")
        print(f"📊 Difficulty: {self.config['game_settings']['difficulty'].title()}")
        
        return sim
    
    def display_available_components(self) -> None:
        """Display all available components for purchase"""
        print("\n" + "="*50)
        print("🏭 AVAILABLE COMPONENTS")
        print("="*50)
        
        print("\n🔋 GENERATORS:")
        for i, gen in enumerate(self.config["components"]["generators"], 1):
            reliability = f"({gen['reliability']*100:.0f}% reliable)" if 'reliability' in gen else ""
            print(f"  {i}. {gen['name']} - {gen['capacity']} MW - ${gen['cost']:,} {reliability}")
        
        print("\n🔌 SUBSTATIONS:")
        for i, sub in enumerate(self.config["components"]["substations"], 1):
            print(f"  {i}. {sub['name']} - {sub['capacity']} MW - ${sub['cost']:,}")
        
        print("\n🏘️  LOAD CENTERS:")
        for i, load in enumerate(self.config["components"]["load_centers"], 1):
            demand = f"(Demand: {load['demand']} MW)" if 'demand' in load else ""
            print(f"  {i}. {load['name']} - {load['capacity']} MW - ${load['cost']:,} {demand}")
        
        print("\n⚡ TRANSMISSION LINES:")
        for i, line in enumerate(self.config["transmission_lines"], 1):
            print(f"  {i}. {line['type']} - {line['capacity']} MW - ${line['cost_per_km']:,}/km")
    
    def get_component_by_category(self, category: str, index: int) -> Dict[str, Any]:
        """Get component by category and index"""
        try:
            if category == "generator":
                return self.config["components"]["generators"][index - 1]
            elif category == "substation":
                return self.config["components"]["substations"][index - 1]
            elif category == "load":
                return self.config["components"]["load_centers"][index - 1]
            elif category == "line":
                return self.config["transmission_lines"][index - 1]
            else:
                raise ValueError(f"Unknown category: {category}")
        except (IndexError, KeyError):
            raise ValueError(f"Invalid component index: {index}")
    
    def create_component(self, category: str, index: int) -> GridComponent:
        """Create a GridComponent from configuration"""
        comp_data = self.get_component_by_category(category, index)
        return GridComponent(comp_data["name"], comp_data["capacity"], comp_data["cost"])
    
    def create_transmission_line(self, index: int) -> TransmissionLine:
        """Create a TransmissionLine from configuration"""
        line_data = self.get_component_by_category("line", index)
        return TransmissionLine(line_data["type"], line_data["capacity"], line_data["cost_per_km"])
    
    def run_interactive_setup(self) -> GridSimulation:
        """Run interactive game setup"""
        sim = self.create_game_session()
        self.display_available_components()
        
        print("\n" + "="*50)
        print("🎮 INTERACTIVE SETUP")
        print("="*50)
        print("Commands:")
        print("  add <category> <number> - Add component (e.g., 'add generator 1')")
        print("  line <number> <distance> - Add transmission line (e.g., 'line 1 10')")
        print("  budget - Check remaining budget")
        print("  simulate - Run simulation")
        print("  quit - Exit setup")
        print()
        
        while True:
            try:
                command = input("Grid Builder > ").strip().lower()
                
                if command == "quit":
                    break
                elif command == "budget":
                    print(f"💰 Remaining Budget: ${sim.budget:,}")
                elif command == "simulate":
                    sim.simulate()
                    break
                elif command.startswith("add "):
                    parts = command.split()
                    if len(parts) >= 3:
                        category = parts[1]
                        try:
                            index = int(parts[2])
                            if category in ["generator", "substation", "load"]:
                                component = self.create_component(category, index)
                                sim.add_component(component)
                            else:
                                print("❌ Category must be: generator, substation, or load")
                        except (ValueError, IndexError):
                            print("❌ Invalid component number")
                    else:
                        print("❌ Usage: add <category> <number>")
                elif command.startswith("line "):
                    parts = command.split()
                    if len(parts) >= 3:
                        try:
                            line_index = int(parts[1])
                            distance = float(parts[2])
                            line = self.create_transmission_line(line_index)
                            sim.add_line(line, distance)
                        except (ValueError, IndexError):
                            print("❌ Invalid line number or distance")
                    else:
                        print("❌ Usage: line <number> <distance>")
                else:
                    print("❌ Unknown command. Type 'quit' to exit.")
                    
            except KeyboardInterrupt:
                print("\n\n👋 Thanks for playing Grid Game!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
        
        return sim
    
    def run_demo_game(self) -> GridSimulation:
        """Run a demo game with pre-configured components"""
        print("\n" + "="*50)
        print("🎮 DEMO GAME MODE")
        print("="*50)
        
        sim = self.create_game_session()
        
        print("\n⚡ Building sample power grid...")
        
        # Add some components
        generator = self.create_component("generator", 2)  # Gas Plant
        substation = self.create_component("substation", 2)  # Medium Substation
        load1 = self.create_component("load", 1)  # Residential Area
        load2 = self.create_component("load", 2)  # Commercial District
        
        sim.add_component(generator)
        sim.add_component(substation)
        sim.add_component(load1)
        sim.add_component(load2)
        
        # Add transmission lines
        transmission_line = self.create_transmission_line(2)  # Transmission Line
        distribution_line = self.create_transmission_line(1)  # Distribution Line
        
        sim.add_line(transmission_line, 15)  # 15 km transmission line
        sim.add_line(distribution_line, 5)   # 5 km distribution line
        
        # Run simulation
        print("\n" + "="*50)
        print("📊 SIMULATION RESULTS")
        print("="*50)
        sim.simulate()
        
        return sim

def main():
    """Main function to run the game initializer"""
    print("🔌 Grid Game Initializer")
    print("=" * 30)
    
    initializer = GameInitializer()
    
    if len(sys.argv) > 1:
        mode = sys.argv[1].lower()
    else:
        print("\nSelect game mode:")
        print("1. Interactive Setup")
        print("2. Demo Game")
        print("3. Quick Start")
        
        choice = input("\nEnter choice (1-3): ").strip()
        mode = {"1": "interactive", "2": "demo", "3": "quick"}.get(choice, "interactive")
    
    try:
        if mode == "demo":
            sim = initializer.run_demo_game()
        elif mode == "quick":
            sim = initializer.create_game_session()
            sim.simulate()
        else:  # interactive
            sim = initializer.run_interactive_setup()
        
        print("\n" + "="*50)
        print("🎉 GAME SESSION COMPLETED")
        print("="*50)
        print(f"💰 Final Budget: ${sim.budget:,}")
        print(f"🏭 Components Added: {len(sim.components)}")
        print(f"⚡ Transmission Lines: {len(sim.lines)}")
        
    except KeyboardInterrupt:
        print("\n\n👋 Game interrupted. Thanks for playing!")
    except Exception as e:
        print(f"\n❌ Game error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
