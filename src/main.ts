import './style.css'
import { PowerGridGame } from './game/GridGame'

// Initialize the power grid game
const canvas = document.querySelector('#grid-canvas') as HTMLCanvasElement
const budgetElement = document.querySelector('#budget') as HTMLElement
const loadServedElement = document.querySelector('#load-served') as HTMLElement
const efficiencyElement = document.querySelector('#efficiency') as HTMLElement
const infoElement = document.querySelector('#grid-info') as HTMLElement
const frequencyElement = document.querySelector('#frequency') as HTMLElement
const reliabilityElement = document.querySelector('#reliability') as HTMLElement
const renewablesElement = document.querySelector('#renewables') as HTMLElement

// Create game instance
const game = new PowerGridGame(
  canvas, 
  budgetElement, 
  loadServedElement, 
  efficiencyElement, 
  infoElement,
  frequencyElement,
  reliabilityElement,
  renewablesElement
)

// Set up toolbar event listeners
const toolButtons = document.querySelectorAll('.tool-btn') as NodeListOf<HTMLButtonElement>
const simulateBtn = document.querySelector('#simulate-btn') as HTMLButtonElement
const clearBtn = document.querySelector('#clear-btn') as HTMLButtonElement
const undoBtn = document.querySelector('#undo-btn') as HTMLButtonElement
const redoBtn = document.querySelector('#redo-btn') as HTMLButtonElement

// Tool selection handlers
toolButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Remove active class from all buttons
    toolButtons.forEach(btn => btn.classList.remove('active'))
    
    // Add active class to clicked button
    button.classList.add('active')
    
    // Set selected tool in game
    const tool = button.dataset.tool as any
    game.setSelectedTool(tool)
  })
})

// Action button handlers
simulateBtn.addEventListener('click', () => {
  game.simulate()
})

clearBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear the entire grid? This action cannot be undone.')) {
    game.clearGrid()
  }
})

undoBtn.addEventListener('click', () => {
  game.undo()
})

redoBtn.addEventListener('click', () => {
  game.redo()
})

// Resize canvas to fit container
function resizeCanvas() {
  const gridArea = document.querySelector('#grid-area') as HTMLElement
  const rect = gridArea.getBoundingClientRect()
  canvas.width = rect.width - 20 // Account for padding
  canvas.height = Math.max(400, rect.height - 140) // Account for info panel
  game.init() // Re-render after resize
}

// Initial resize and setup resize listener
window.addEventListener('resize', resizeCanvas)
resizeCanvas()

// Initialize the game
game.init()

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'g':
      game.setSelectedTool('generator')
      document.querySelector('[data-tool="generator"]')?.classList.add('active')
      break
    case 's':
      game.setSelectedTool('substation')
      document.querySelector('[data-tool="substation"]')?.classList.add('active')
      break
    case 'l':
      game.setSelectedTool('load')
      document.querySelector('[data-tool="load"]')?.classList.add('active')
      break
    case 'n':
      game.setSelectedTool('node')
      document.querySelector('[data-tool="node"]')?.classList.add('active')
      break
    case 't':
      game.setSelectedTool('transmission-line')
      document.querySelector('[data-tool="transmission-line"]')?.classList.add('active')
      break
    case 'd':
      game.setSelectedTool('distribution-line')
      document.querySelector('[data-tool="distribution-line"]')?.classList.add('active')
      break
    case 'h':
      game.setSelectedTool('hvdc-line')
      document.querySelector('[data-tool="hvdc-line"]')?.classList.add('active')
      break
    case 'r':
      if (e.ctrlKey) {
        e.preventDefault()
        game.simulate()
      }
      break
    case 'Escape':
      game.setSelectedTool(null)
      toolButtons.forEach(btn => btn.classList.remove('active'))
      break
  }
})

console.log('🔌 European Power Grid Builder loaded successfully!')
console.log('⚡ Keyboard shortcuts:')
console.log('📍 G - Generator, S - Substation, L - Load, N - Grid Node')
console.log('🔗 T - AC Transmission, D - Distribution, H - HVDC Line')
console.log('🎮 Ctrl+R - Run Simulation, Ctrl+Z - Undo, Ctrl+Y - Redo')
console.log('🖱️ Right-click components/nodes to delete, Escape - Clear Selection')
console.log('🏗️ Build realistic European power grids with multi-connection nodes!')
