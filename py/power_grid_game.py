"""
Power Grid Game - Python equivalent of GridGame.ts
Main game class for building and simulating power grids with European standards.
"""

import random
import time
from typing import Dict, List, Optional, Tuple
from grid_types import (
    GridComponent, PowerLine, GridNode, GridStats, Command, Point,
    ComponentType, LineType, NetworkType, VoltageLevel, SimulationResult
)
from european_power_flow_simulator import EuropeanACPowerFlowSimulator

# Component configuration - configurable values for easy adjustment
COMPONENT_CONFIG = {
    'generator': {'cost': 10000, 'capacity_range': [50, 150], 'voltage': 220},
    'substation': {'cost': 5000, 'capacity_range': [200, 200], 'voltage': 110},
    'load': {'cost': 0, 'capacity_range': [20, 100], 'voltage': 20}
}

class PowerGridGame:
    """
    Main power grid building and simulation game class.
    Manages components, lines, nodes, simulation, and game state.
    """
    
    def __init__(self):
        # Core game state
        self.components: Dict[str, GridComponent] = {}
        self.lines: Dict[str, PowerLine] = {}
        self.grid_nodes: Dict[str, GridNode] = {}
        self.simulator = EuropeanACPowerFlowSimulator()
        
        # Undo/Redo system
        self.command_history: List[Command] = []
        self.current_command_index = -1
        self.max_history_size = 50
        
        # Game state
        self.selected_tool: Optional[str] = None
        self.network_type: NetworkType = 'radial'
        self.is_placing_line = False
        self.line_start: Optional[str] = None
        
        # Statistics - increased budget by 500%
        self.stats = GridStats(
            budget=500000.0,  # Increased by 500%
            total_generation=0.0,
            total_load=0.0,
            load_served=0.0,
            efficiency=0.0,
            reliability=0.0
        )
        
        # Counters
        self.component_counter = 0
        self.line_counter = 0
        self.node_counter = 0
    
    def get_component_cost(self, component_type: ComponentType) -> float:
        """Get cost for a component type"""
        return COMPONENT_CONFIG[component_type]['cost']
    
    def get_component_capacity(self, component_type: ComponentType) -> float:
        """Get random capacity within range for component type"""
        min_cap, max_cap = COMPONENT_CONFIG[component_type]['capacity_range']
        return round(min_cap + random.random() * (max_cap - min_cap))
    
    def get_component_voltage(self, component_type: ComponentType) -> VoltageLevel:
        """Get voltage level for component type"""
        return COMPONENT_CONFIG[component_type]['voltage']
    
    def get_component_active_power(self, component_type: ComponentType, capacity: float) -> float:
        """Get active power for component"""
        if component_type == 'generator':
            return capacity  # Full capacity for generators
        elif component_type == 'load':
            return -capacity  # Negative for loads (consuming power)
        else:
            return 0.0  # Substations don't generate or consume active power
    
    def get_component_reactive_power(self, component_type: ComponentType, capacity: float) -> float:
        """Get reactive power for component"""
        if component_type == 'generator':
            return capacity * 0.45  # tan(acos(0.9))
        elif component_type == 'load':
            return -capacity * 0.3
        else:
            return 0.0  # Substations don't generate or consume reactive power
    
    def place_component(self, component_type: ComponentType, position: Point) -> bool:
        """Place a new component at the specified position"""
        cost = self.get_component_cost(component_type)
        
        if self.stats.budget < cost:
            print(f"Insufficient budget! Need ${cost}, have ${self.stats.budget}")
            return False
        
        capacity = self.get_component_capacity(component_type)
        
        component = GridComponent(
            id=f"{component_type}_{self.component_counter + 1}",
            type=component_type,
            position=position,
            capacity=capacity,
            cost=cost,
            connections=[],
            voltage=self.get_component_voltage(component_type),
            is_active=True,
            active_power=self.get_component_active_power(component_type, capacity),
            reactive_power=self.get_component_reactive_power(component_type, capacity),
            voltage_magnitude=1.0,
            voltage_angle=0.0,
            frequency=50.0
        )
        
        # Check for nearby grid node to connect to
        nearest_node = self.find_nearest_node(position)
        if nearest_node:
            self.connect_component_to_node(component.id, nearest_node.id)
        
        # Create command for undo/redo
        def execute():
            self.components[component.id] = component
            self.stats.budget -= cost
            if nearest_node:
                self.connect_component_to_node(component.id, nearest_node.id)
            self.component_counter += 1
        
        def undo():
            if component.id in self.components:
                del self.components[component.id]
            self.stats.budget += cost
            if nearest_node and component.id in nearest_node.connected_components:
                nearest_node.connected_components.remove(component.id)
            self.component_counter -= 1
        
        command = Command(
            id=f"cmd_{int(time.time() * 1000)}",
            type='place-component',
            timestamp=time.time(),
            data={'component': component, 'cost': cost, 'nearest_node': nearest_node},
            execute_func=execute,
            undo_func=undo
        )
        
        command.execute()
        self.add_command(command)
        self.update_stats()
        
        print(f"Placed {component_type} with {capacity}MW capacity. Remaining budget: ${self.stats.budget}")
        return True
    
    def place_line(self, line_type: LineType, from_id: str, to_id: str) -> bool:
        """Place a transmission line between two components/nodes"""
        if from_id == to_id:
            print("Cannot connect component to itself")
            return False
        
        # Get start and end positions
        from_target = self.components.get(from_id) or self.grid_nodes.get(from_id)
        to_target = self.components.get(to_id) or self.grid_nodes.get(to_id)
        
        if not from_target or not to_target:
            print("Invalid connection targets")
            return False
        
        # Calculate distance and cost
        length = self.calculate_distance(from_target.position, to_target.position) / 10  # Convert to km
        cost_per_km = {
            'transmission-line': 2000,
            'distribution-line': 1000,
            'hvdc-line': 3000
        }
        cost = round(length * cost_per_km.get(line_type, 2000))
        
        if self.stats.budget < cost:
            print(f"Insufficient budget for line! Need ${cost}, have ${self.stats.budget}")
            return False
        
        # Line specifications
        line_capacity = {
            'transmission-line': 300,
            'distribution-line': 100,
            'hvdc-line': 500
        }
        
        line = PowerLine(
            id=f"line_{self.line_counter + 1}",
            type=line_type,
            from_id=from_id,
            to_id=to_id,
            length=length,
            cost=cost,
            capacity=line_capacity.get(line_type, 300),
            resistance=self.simulator.get_line_resistance(line_type, length),
            reactance=self.simulator.get_line_reactance(line_type, length),
            susceptance=self.simulator.get_line_susceptance(line_type, length),
            thermal_limit=line_capacity.get(line_type, 300),
            is_active=True,
            is_contingency=False
        )
        
        # Create command for undo/redo
        def execute():
            self.lines[line.id] = line
            
            # Update connections for components
            from_comp = self.components.get(from_id)
            to_comp = self.components.get(to_id)
            if from_comp:
                from_comp.connections.append(to_id)
            if to_comp:
                to_comp.connections.append(from_id)
            
            # Update connections for grid nodes
            from_node = self.grid_nodes.get(from_id)
            to_node = self.grid_nodes.get(to_id)
            if from_node:
                from_node.connected_lines.append(line.id)
            if to_node:
                to_node.connected_lines.append(line.id)
            
            self.stats.budget -= cost
            self.line_counter += 1
        
        def undo():
            if line.id in self.lines:
                del self.lines[line.id]
            
            # Remove connections for components
            from_comp = self.components.get(from_id)
            to_comp = self.components.get(to_id)
            if from_comp and to_id in from_comp.connections:
                from_comp.connections.remove(to_id)
            if to_comp and from_id in to_comp.connections:
                to_comp.connections.remove(from_id)
            
            # Remove connections for grid nodes
            from_node = self.grid_nodes.get(from_id)
            to_node = self.grid_nodes.get(to_id)
            if from_node and line.id in from_node.connected_lines:
                from_node.connected_lines.remove(line.id)
            if to_node and line.id in to_node.connected_lines:
                to_node.connected_lines.remove(line.id)
            
            self.stats.budget += cost
            self.line_counter -= 1
        
        command = Command(
            id=f"cmd_{int(time.time() * 1000)}",
            type='place-line',
            timestamp=time.time(),
            data={'line': line, 'cost': cost, 'from_id': from_id, 'to_id': to_id},
            execute_func=execute,
            undo_func=undo
        )
        
        command.execute()
        self.add_command(command)
        self.update_stats()
        
        print(f"Placed {line_type} ({length:.1f}km, {line.capacity}MW). Remaining budget: ${self.stats.budget}")
        return True
    
    def place_grid_node(self, position: Point, voltage: VoltageLevel = 110) -> bool:
        """Place a grid node at the specified position"""
        node = GridNode(
            id=f"node_{self.node_counter + 1}",
            position=position,
            voltage=voltage,
            connected_components=[],
            connected_lines=[],
            is_visible=True
        )
        
        # Create command for undo/redo
        def execute():
            self.grid_nodes[node.id] = node
            self.node_counter += 1
        
        def undo():
            if node.id in self.grid_nodes:
                del self.grid_nodes[node.id]
            self.node_counter -= 1
        
        command = Command(
            id=f"cmd_{int(time.time() * 1000)}",
            type='place-node',
            timestamp=time.time(),
            data={'node': node},
            execute_func=execute,
            undo_func=undo
        )
        
        command.execute()
        self.add_command(command)
        
        print(f"Placed grid node at ({position.x}, {position.y})")
        return True
    
    def calculate_distance(self, p1: Point, p2: Point) -> float:
        """Calculate Euclidean distance between two points"""
        return ((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2) ** 0.5
    
    def find_nearest_node(self, position: Point, max_distance: float = 30) -> Optional[GridNode]:
        """Find the nearest grid node within max_distance"""
        nearest_node = None
        min_distance = max_distance
        
        for node in self.grid_nodes.values():
            distance = self.calculate_distance(position, node.position)
            if distance < min_distance:
                min_distance = distance
                nearest_node = node
        
        return nearest_node
    
    def connect_component_to_node(self, component_id: str, node_id: str) -> None:
        """Connect a component to a grid node"""
        component = self.components.get(component_id)
        node = self.grid_nodes.get(node_id)
        
        if component and node:
            component.connected_node = node_id
            if component_id not in node.connected_components:
                node.connected_components.append(component_id)
    
    def simulate(self) -> SimulationResult:
        """Run the power grid simulation"""
        self.simulator.set_components(list(self.components.values()))
        self.simulator.set_lines(list(self.lines.values()))
        self.simulator.set_network_type(self.network_type)
        
        result = self.simulator.simulate()
        
        if result.success:
            self.stats.load_served = result.load_served
            self.stats.efficiency = result.efficiency
            self.stats.reliability = result.reliability
            
            self.update_stats()
            
            print("✅ European Power Grid Simulation Completed!")
            print(f"📊 Results:")
            print(f"• Load Served: {result.load_served:.1f} MW")
            print(f"• System Efficiency: {result.efficiency:.1f}%")
            print(f"• Grid Reliability: {result.reliability * 100:.1f}%")
            print(f"• Total Losses: {result.total_losses:.1f} MW")
        else:
            print("❌ Simulation Failed!")
            print("Errors:")
            for error in result.errors:
                print(f"• {error}")
        
        return result
    
    def clear_grid(self) -> None:
        """Clear the entire grid"""
        self.components.clear()
        self.lines.clear()
        self.grid_nodes.clear()
        self.stats.budget = 500000.0
        self.stats.load_served = 0.0
        self.stats.efficiency = 0.0
        self.stats.reliability = 0.0
        self.component_counter = 0
        self.line_counter = 0
        self.node_counter = 0
        
        # Clear command history
        self.command_history.clear()
        self.current_command_index = -1
        
        self.update_stats()
        print("Grid cleared successfully!")
    
    def update_stats(self) -> None:
        """Update grid statistics"""
        self.stats.total_generation = sum(
            c.capacity for c in self.components.values() if c.type == 'generator'
        )
        self.stats.total_load = sum(
            c.capacity for c in self.components.values() if c.type == 'load'
        )
        
        print(f"Budget: ${self.stats.budget:,.0f} | "
              f"Generation: {self.stats.total_generation:.0f}MW | "
              f"Load: {self.stats.total_load:.0f}MW")
    
    def add_command(self, command: Command) -> None:
        """Add command to history for undo/redo"""
        # Remove any commands after current index
        self.command_history = self.command_history[:self.current_command_index + 1]
        
        # Add new command
        self.command_history.append(command)
        self.current_command_index += 1
        
        # Limit history size
        if len(self.command_history) > self.max_history_size:
            self.command_history.pop(0)
            self.current_command_index -= 1
    
    def undo(self) -> bool:
        """Undo the last command"""
        if self.current_command_index >= 0:
            command = self.command_history[self.current_command_index]
            command.undo()
            self.current_command_index -= 1
            self.update_stats()
            print(f"Undone: {command.type}")
            return True
        else:
            print("Nothing to undo")
            return False
    
    def redo(self) -> bool:
        """Redo the last undone command"""
        if self.current_command_index < len(self.command_history) - 1:
            self.current_command_index += 1
            command = self.command_history[self.current_command_index]
            command.execute()
            self.update_stats()
            print(f"Redone: {command.type}")
            return True
        else:
            print("Nothing to redo")
            return False
    
    def can_undo(self) -> bool:
        """Check if undo is available"""
        return self.current_command_index >= 0
    
    def can_redo(self) -> bool:
        """Check if redo is available"""
        return self.current_command_index < len(self.command_history) - 1
    
    def get_component_info(self, component_id: str) -> Optional[str]:
        """Get detailed information about a component"""
        component = self.components.get(component_id)
        if not component:
            return None
        
        node_info = "Not connected to grid node"
        if component.connected_node:
            node = self.grid_nodes.get(component.connected_node)
            if node:
                node_info = f"Connected to {node.id} ({node.voltage}kV)"
        
        info = f"""
{component.type.upper()}
ID: {component.id}
Capacity: {component.capacity} MW
Voltage: {component.voltage} kV
Cost: ${component.cost:,}
Connections: {len(component.connections)}
Status: {'Active' if component.is_active else 'Inactive'}

Grid Connection:
{node_info}
        """.strip()
        
        return info
    
    def get_node_info(self, node_id: str) -> Optional[str]:
        """Get detailed information about a grid node"""
        node = self.grid_nodes.get(node_id)
        if not node:
            return None
        
        total_connections = len(node.connected_components) + len(node.connected_lines)
        
        components_list = "None"
        if node.connected_components:
            components_list = ", ".join([
                f"{self.components[comp_id].type} ({comp_id})" 
                for comp_id in node.connected_components 
                if comp_id in self.components
            ])
        
        lines_list = "None"
        if node.connected_lines:
            lines_list = ", ".join([
                f"{self.lines[line_id].type} ({self.lines[line_id].capacity}MW)"
                for line_id in node.connected_lines
                if line_id in self.lines
            ])
        
        info = f"""
GRID NODE
ID: {node.id}
Voltage: {node.voltage} kV
Total Connections: {total_connections}

Connected Components:
{components_list}

Connected Lines:
{lines_list}
        """.strip()
        
        return info
    
    def set_selected_tool(self, tool: Optional[str]) -> None:
        """Set the currently selected tool"""
        self.selected_tool = tool
        if tool:
            print(f"Selected tool: {tool}")
        else:
            print("Tool selection cleared")
    
    def set_network_type(self, network_type: NetworkType) -> None:
        """Set the network topology type"""
        self.network_type = network_type
        print(f"Network type set to: {network_type}")
    
    def print_grid_summary(self) -> None:
        """Print a summary of the current grid state"""
        print("\n" + "="*50)
        print("POWER GRID SUMMARY")
        print("="*50)
        print(f"Budget: ${self.stats.budget:,.0f}")
        print(f"Network Type: {self.network_type}")
        print(f"Components: {len(self.components)}")
        print(f"Lines: {len(self.lines)}")
        print(f"Grid Nodes: {len(self.grid_nodes)}")
        print(f"Total Generation: {self.stats.total_generation:.0f} MW")
        print(f"Total Load: {self.stats.total_load:.0f} MW")
        print(f"Load Served: {self.stats.load_served:.1f} MW")
        print(f"Efficiency: {self.stats.efficiency:.1f}%")
        print(f"Reliability: {self.stats.reliability * 100:.1f}%")
        print("="*50)
