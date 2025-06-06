"""
Power Grid Builder - Python CLI Version
Interactive command-line interface for building and simulating power grids.
"""

from power_grid_game import PowerGridGame
from grid_types import Point

def print_help():
    """Print help information"""
    print("\n" + "="*60)
    print("POWER GRID BUILDER - COMMAND HELP")
    print("="*60)
    print("Component Commands:")
    print("  gen <x> <y>     - Place generator at position (x, y)")
    print("  sub <x> <y>     - Place substation at position (x, y)")
    print("  load <x> <y>    - Place load center at position (x, y)")
    print("  node <x> <y>    - Place grid node at position (x, y)")
    print()
    print("Line Commands:")
    print("  trans <from> <to>  - Connect with transmission line")
    print("  dist <from> <to>   - Connect with distribution line")
    print("  hvdc <from> <to>   - Connect with HVDC line")
    print()
    print("Network Commands:")
    print("  radial          - Set network type to radial")
    print("  meshed          - Set network type to meshed")
    print()
    print("Simulation Commands:")
    print("  sim             - Run simulation")
    print("  clear           - Clear entire grid")
    print("  stats           - Show grid statistics")
    print()
    print("History Commands:")
    print("  undo            - Undo last action")
    print("  redo            - Redo last undone action")
    print()
    print("Information Commands:")
    print("  list            - List all components and nodes")
    print("  info <id>       - Show detailed info for component/node")
    print("  help            - Show this help")
    print("  quit            - Exit the game")
    print("="*60)

def list_components_and_nodes(game):
    """List all components and nodes"""
    print("\n" + "="*50)
    print("GRID COMPONENTS AND NODES")
    print("="*50)
    
    if game.components:
        print("Components:")
        for comp in game.components.values():
            print(f"  {comp.id}: {comp.type} ({comp.capacity}MW) at ({comp.position.x}, {comp.position.y})")
    else:
        print("No components placed")
    
    if game.grid_nodes:
        print("\nGrid Nodes:")
        for node in game.grid_nodes.values():
            connections = len(node.connected_components) + len(node.connected_lines)
            print(f"  {node.id}: {node.voltage}kV at ({node.position.x}, {node.position.y}) - {connections} connections")
    else:
        print("No grid nodes placed")
    
    if game.lines:
        print("\nTransmission Lines:")
        for line in game.lines.values():
            print(f"  {line.id}: {line.type} from {line.from_id} to {line.to_id} ({line.capacity}MW, {line.length:.1f}km)")
    else:
        print("No transmission lines placed")
    
    print("="*50)

def main():
    """Main game loop"""
    print("🔌 Welcome to Power Grid Builder (Python CLI Version)!")
    print("Type 'help' for commands or 'quit' to exit.")
    
    game = PowerGridGame()
    game.print_grid_summary()
    
    while True:
        try:
            command = input("\n>>> ").strip().lower().split()
            
            if not command:
                continue
            
            cmd = command[0]
            
            # Exit command
            if cmd in ['quit', 'exit', 'q']:
                print("Thanks for playing Power Grid Builder!")
                break
            
            # Help command
            elif cmd == 'help':
                print_help()
            
            # Component placement commands
            elif cmd == 'gen' and len(command) == 3:
                x, y = float(command[1]), float(command[2])
                game.place_component('generator', Point(x, y))
            
            elif cmd == 'sub' and len(command) == 3:
                x, y = float(command[1]), float(command[2])
                game.place_component('substation', Point(x, y))
            
            elif cmd == 'load' and len(command) == 3:
                x, y = float(command[1]), float(command[2])
                game.place_component('load', Point(x, y))
            
            elif cmd == 'node' and len(command) == 3:
                x, y = float(command[1]), float(command[2])
                game.place_grid_node(Point(x, y))
            
            # Line placement commands
            elif cmd == 'trans' and len(command) == 3:
                from_id, to_id = command[1], command[2]
                game.place_line('transmission-line', from_id, to_id)
            
            elif cmd == 'dist' and len(command) == 3:
                from_id, to_id = command[1], command[2]
                game.place_line('distribution-line', from_id, to_id)
            
            elif cmd == 'hvdc' and len(command) == 3:
                from_id, to_id = command[1], command[2]
                game.place_line('hvdc-line', from_id, to_id)
            
            # Network type commands
            elif cmd == 'radial':
                game.set_network_type('radial')
            
            elif cmd == 'meshed':
                game.set_network_type('meshed')
            
            # Simulation commands
            elif cmd == 'sim':
                result = game.simulate()
            
            elif cmd == 'clear':
                confirm = input("Are you sure you want to clear the grid? (y/N): ")
                if confirm.lower() in ['y', 'yes']:
                    game.clear_grid()
            
            elif cmd == 'stats':
                game.print_grid_summary()
            
            # History commands
            elif cmd == 'undo':
                game.undo()
            
            elif cmd == 'redo':
                game.redo()
            
            # Information commands
            elif cmd == 'list':
                list_components_and_nodes(game)
            
            elif cmd == 'info' and len(command) == 2:
                info_id = command[1]
                info = game.get_component_info(info_id) or game.get_node_info(info_id)
                if info:
                    print(f"\n{info}")
                else:
                    print(f"Component or node '{info_id}' not found")
            
            # Invalid commands
            else:
                print("Invalid command. Type 'help' for available commands.")
        
        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except ValueError:
            print("Invalid coordinates. Please use numbers for x and y positions.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    main()
