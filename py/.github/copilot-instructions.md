<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Power Grid Builder Python CLI - Copilot Instructions

This is a Python-based power grid simulation game that recreates the functionality of a TypeScript grid game. The project follows European electrical standards and implements professional software engineering patterns.

## Key Project Characteristics

### Code Style
- Use Python 3.7+ features including type hints and dataclasses
- Follow PEP 8 style guidelines
- Use descriptive variable names and comprehensive docstrings
- Implement proper error handling and validation

### Architecture Patterns
- **Command Pattern**: For undo/redo functionality with execute() and undo() methods
- **Modular Design**: Separate concerns (game logic, simulation, types)
- **Data Classes**: Use @dataclass for structured data types
- **Type Safety**: Comprehensive type hints using typing module

### Domain Knowledge
- **European Power Standards**: 50Hz frequency, ±5% voltage tolerance
- **Power System Components**: Generators, substations, loads, transmission lines
- **Network Topologies**: Radial (tree-like) vs Meshed (interconnected)
- **AC Power Flow**: Complex power calculations with real/reactive components

### Game Mechanics
- Budget management with realistic component costs
- Undo/redo system with 50-command history
- Multi-connection grid nodes for complex topologies
- European voltage levels: 400kV, 220kV, 110kV, 50kV, 20kV, 10kV

## When Contributing Code

1. **Maintain Type Safety**: Always use proper type hints
2. **Follow Command Pattern**: For any reversible operations
3. **European Standards**: Use 50Hz frequency and European voltage levels
4. **Validation**: Always validate user inputs and system state
5. **Documentation**: Include comprehensive docstrings for all public methods

## Key Files and Their Purpose

- `grid_types.py`: All data structures and type definitions
- `european_power_flow_simulator.py`: AC power flow simulation engine
- `power_grid_game.py`: Main game logic and state management
- `main.py`: Interactive CLI interface

## Testing Considerations

When writing tests or examples, use realistic power system values:
- Generator capacity: 50-150 MW
- Transmission line capacity: 300 MW
- Distribution line capacity: 100 MW
- HVDC line capacity: 500 MW
- Typical distances: 10-100 km for transmission lines
