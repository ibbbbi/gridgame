<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Grid Game Project Instructions

This is a TypeScript-based grid game built with Vite. The game features:

- Interactive 8x8 grid gameplay
- Click timing mechanics - players must click highlighted cells quickly
- Score system with points for correct clicks and penalties for wrong clicks
- Modern, responsive UI with glassmorphism design
- Built with vanilla TypeScript for performance

## Code Style Guidelines
- Use TypeScript for all source files
- Follow modern ES6+ syntax
- Use CSS Grid and Flexbox for layouts
- Implement smooth animations and transitions
- Keep game logic separate from DOM manipulation
- Use class-based architecture for game components

## Game Mechanics
- Active cells are highlighted in green
- Players have 2 seconds to click the active cell
- Correct clicks: +10 points
- Wrong clicks: -5 points (minimum 0)
- Game auto-generates new active cells continuously
