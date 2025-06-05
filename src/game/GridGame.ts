import { GridComponent, PowerLine, Point, ComponentType, LineType, NetworkType, GridStats, VoltageLevel, SimulationResult } from '../types/GridTypes';
import { EuropeanACPowerFlowSimulator } from '../simulation/EuropeanPowerFlowSimulator';

export class PowerGridGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private components: Map<string, GridComponent> = new Map();
  private lines: Map<string, PowerLine> = new Map();
  private simulator: EuropeanACPowerFlowSimulator = new EuropeanACPowerFlowSimulator();
  
  private selectedTool: ComponentType | LineType | 'radial' | 'meshed' | null = null;
  private networkType: NetworkType = 'radial';
  private isPlacingLine = false;
  private lineStart: string | null = null;
  
  private stats: GridStats = {
    budget: 100000,
    totalGeneration: 0,
    totalLoad: 0,
    loadServed: 0,
    efficiency: 0,
    reliability: 0
  };

  private componentCounter = 0;
  private lineCounter = 0;

  constructor(
    canvas: HTMLCanvasElement,
    private budgetElement: HTMLElement,
    private loadServedElement: HTMLElement,
    private efficiencyElement: HTMLElement,
    private infoElement: HTMLElement,
    private frequencyElement?: HTMLElement,
    private reliabilityElement?: HTMLElement,
    private renewablesElement?: HTMLElement
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupEventListeners();
    this.updateStats();
  }

  public init(): void {
    this.resizeCanvas();
    this.draw();
  }

  public setSelectedTool(tool: ComponentType | LineType | 'radial' | 'meshed' | null): void {
    this.selectedTool = tool;
    this.isPlacingLine = false;
    this.lineStart = null;
    
    // Update network type if applicable
    if (tool === 'radial' || tool === 'meshed') {
      this.networkType = tool as NetworkType;
    }
  }
  public simulate(): void {
    // Set components and lines in simulator
    const componentsArray = Array.from(this.components.values());
    const linesArray = Array.from(this.lines.values());
    
    this.simulator.setComponents(componentsArray);
    this.simulator.setLines(linesArray);
    this.simulator.setNetworkType(this.networkType);
    
    // Run simulation
    const result = this.simulator.simulate();
    
    // Update stats based on simulation result
    this.updateStatsFromSimulation(result);
    this.updateDisplay();
    
    // Show detailed results
    this.showSimulationResults(result);
  }

  public clearGrid(): void {
    this.components.clear();
    this.lines.clear();
    this.selectedTool = null;
    this.isPlacingLine = false;
    this.lineStart = null;
    this.componentCounter = 0;
    this.lineCounter = 0;
    
    // Reset stats
    this.stats = {
      budget: 100000,
      totalGeneration: 0,
      totalLoad: 0,
      loadServed: 0,
      efficiency: 0,
      reliability: 0
    };
    
    this.updateStats();
    this.draw();
  }

  private resizeCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private handleCanvasClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const point: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    if (!this.selectedTool) return;

    // Handle component placement
    if (this.selectedTool === 'generator' || this.selectedTool === 'substation' || this.selectedTool === 'load') {
      this.placeComponent(this.selectedTool, point);
    }
    
    // Handle line placement
    if (this.selectedTool === 'transmission-line' || this.selectedTool === 'distribution-line' || this.selectedTool === 'hvdc-line') {
      this.handleLineClick(point);
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isPlacingLine || !this.lineStart) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const currentPoint: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // Redraw with preview line
    this.draw();
    this.drawPreviewLine(this.getComponentPosition(this.lineStart), currentPoint);
  }

  private placeComponent(type: ComponentType, position: Point): void {
    const id = `${type}_${this.componentCounter++}`;
    
    // Get default parameters based on component type and European standards
    const component: GridComponent = {
      id,
      type,
      position,
      capacity: this.getDefaultCapacity(type),
      cost: this.getComponentCost(type),
      connections: [],
      voltage: this.getDefaultVoltage(type),
      isActive: true,
      activePower: type === 'load' ? this.getDefaultCapacity(type) : 0,
      reactivePower: 0,
      voltageMagnitude: 1.0, // per unit
      voltageAngle: 0,
      frequency: 50 // European standard
    };
    
    this.components.set(id, component);
    this.updateStats();
    this.draw();
  }

  private getDefaultCapacity(type: ComponentType): number {
    switch (type) {
      case 'generator': return 500; // MW
      case 'substation': return 1000; // MVA
      case 'load': return 200; // MW
      default: return 100;
    }
  }

  private getComponentCost(type: ComponentType): number {
    switch (type) {
      case 'generator': return 50000; // EUR per MW
      case 'substation': return 25000; // EUR per MVA
      case 'load': return 5000; // EUR per MW
      default: return 10000;
    }
  }

  private getDefaultVoltage(type: ComponentType): VoltageLevel {
    switch (type) {
      case 'generator': return 220; // kV
      case 'substation': return 400; // kV
      case 'load': return 110; // kV
      default: return 50;
    }
  }

  private handleLineClick(point: Point): void {
    const clickedComponent = this.getComponentAtPoint(point);
    
    if (!clickedComponent) return;
    
    if (!this.isPlacingLine) {
      // Start placing line
      this.isPlacingLine = true;
      this.lineStart = clickedComponent.id;
    } else {
      // Complete line placement
      if (this.lineStart && clickedComponent.id !== this.lineStart) {
        this.createLine(this.lineStart, clickedComponent.id);
      }
      this.isPlacingLine = false;
      this.lineStart = null;
    }
  }

  private createLine(fromId: string, toId: string): void {
    const lineId = `line_${this.lineCounter++}`;
    const fromComponent = this.components.get(fromId);
    const toComponent = this.components.get(toId);
    
    if (!fromComponent || !toComponent) return;
    
    // Calculate distance
    const dx = toComponent.position.x - fromComponent.position.x;
    const dy = toComponent.position.y - fromComponent.position.y;
    const length = Math.sqrt(dx * dx + dy * dy) / 10; // Convert pixels to km approximation
    
    const line: PowerLine = {
      id: lineId,
      type: this.selectedTool as LineType,
      from: fromId,
      to: toId,
      length,
      cost: this.getLineCost(this.selectedTool as LineType, length),
      capacity: this.getLineCapacity(this.selectedTool as LineType),
      resistance: this.getLineResistance(this.selectedTool as LineType),
      reactance: this.getLineReactance(this.selectedTool as LineType),
      susceptance: this.getLineSusceptance(this.selectedTool as LineType),
      thermalLimit: this.getLineCapacity(this.selectedTool as LineType),
      isActive: true,
      isContingency: false
    };
    
    this.lines.set(lineId, line);
    
    // Update component connections
    fromComponent.connections.push(toId);
    toComponent.connections.push(fromId);
    
    this.updateStats();
    this.draw();
  }

  private getLineCost(type: LineType, length: number): number {
    const costPerKm = {
      'transmission-line': 1000000, // 1M EUR per km
      'distribution-line': 100000,  // 100k EUR per km
      'hvdc-line': 2000000         // 2M EUR per km
    };
    return costPerKm[type] * length;
  }

  private getLineCapacity(type: LineType): number {
    switch (type) {
      case 'transmission-line': return 1000; // MVA
      case 'distribution-line': return 100;  // MVA
      case 'hvdc-line': return 2000;        // MW (DC)
      default: return 100;
    }
  }

  private getLineResistance(type: LineType): number {
    switch (type) {
      case 'transmission-line': return 0.05; // Ohms per km
      case 'distribution-line': return 0.4;  // Ohms per km
      case 'hvdc-line': return 0.02;        // Ohms per km
      default: return 0.1;
    }
  }

  private getLineReactance(type: LineType): number {
    switch (type) {
      case 'transmission-line': return 0.3; // Ohms per km
      case 'distribution-line': return 0.4; // Ohms per km
      case 'hvdc-line': return 0;          // DC line, no reactance
      default: return 0.2;
    }
  }

  private getLineSusceptance(type: LineType): number {
    switch (type) {
      case 'transmission-line': return 3e-6; // Siemens per km
      case 'distribution-line': return 2e-6; // Siemens per km
      case 'hvdc-line': return 0;           // DC line, no susceptance
      default: return 1e-6;
    }
  }

  private getComponentAtPoint(point: Point): GridComponent | null {
    for (const component of this.components.values()) {
      const dx = point.x - component.position.x;
      const dy = point.y - component.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 20) { // 20px click radius
        return component;
      }
    }
    return null;
  }

  private getComponentPosition(componentId: string): Point {
    const component = this.components.get(componentId);
    return component ? component.position : { x: 0, y: 0 };
  }

  private draw(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid background
    this.drawGrid();
    
    // Draw lines first (behind components)
    this.drawLines();
    
    // Draw components
    this.drawComponents();
  }

  private drawGrid(): void {
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 1;
    
    const gridSize = 50;
    
    // Vertical lines
    for (let x = 0; x < this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < this.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  private drawLines(): void {
    for (const line of this.lines.values()) {
      const fromComponent = this.components.get(line.from);
      const toComponent = this.components.get(line.to);
      
      if (!fromComponent || !toComponent) continue;
      
      this.ctx.beginPath();
      this.ctx.moveTo(fromComponent.position.x, fromComponent.position.y);
      this.ctx.lineTo(toComponent.position.x, toComponent.position.y);
      
      // Set line style based on type
      switch (line.type) {
        case 'transmission-line':
          this.ctx.strokeStyle = '#ff6b35';
          this.ctx.lineWidth = 4;
          break;
        case 'distribution-line':
          this.ctx.strokeStyle = '#4ecdc4';
          this.ctx.lineWidth = 2;
          break;
        case 'hvdc-line':
          this.ctx.strokeStyle = '#9b59b6';
          this.ctx.lineWidth = 6;
          this.ctx.setLineDash([10, 5]); // Dashed line for HVDC
          break;
      }
      
      this.ctx.stroke();
      this.ctx.setLineDash([]); // Reset line dash
    }
  }

  private drawComponents(): void {
    for (const component of this.components.values()) {
      this.ctx.save();
      this.ctx.translate(component.position.x, component.position.y);
      
      // Set component color and size
      let color: string;
      let size: number;
      
      switch (component.type) {
        case 'generator':
          color = '#2ecc71';
          size = 25;
          break;
        case 'substation':
          color = '#3498db';
          size = 20;
          break;
        case 'load':
          color = '#e74c3c';
          size = 15;
          break;
      }
      
      // Draw component circle
      this.ctx.beginPath();
      this.ctx.arc(0, 0, size, 0, 2 * Math.PI);
      this.ctx.fillStyle = color;
      this.ctx.fill();
      this.ctx.strokeStyle = '#2c3e50';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      // Draw component label
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(component.id, 0, size + 15);
      
      this.ctx.restore();
    }
  }

  private drawPreviewLine(from: Point, to: Point): void {
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.strokeStyle = '#95a5a6';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private updateStats(): void {
    // Calculate totals
    this.stats.totalGeneration = 0;
    this.stats.totalLoad = 0;
    
    for (const component of this.components.values()) {
      if (component.type === 'generator') {
        this.stats.totalGeneration += component.capacity;
      } else if (component.type === 'load') {
        this.stats.totalLoad += component.capacity;
      }
    }
    
    // Calculate total cost
    let totalCost = 0;
    for (const component of this.components.values()) {
      totalCost += component.cost;
    }
    for (const line of this.lines.values()) {
      totalCost += line.cost;
    }
    
    this.stats.budget = Math.max(0, 100000 - totalCost);
    
    this.updateDisplay();
  }

  private updateDisplay(): void {
    this.budgetElement.textContent = `€${this.stats.budget.toLocaleString()}`;
    this.loadServedElement.textContent = `${this.stats.loadServed.toFixed(1)}%`;
    this.efficiencyElement.textContent = `${this.stats.efficiency.toFixed(1)}%`;
    
    if (this.frequencyElement) {
      this.frequencyElement.textContent = '50.0 Hz';
    }
    if (this.reliabilityElement) {
      this.reliabilityElement.textContent = `${this.stats.reliability.toFixed(1)}%`;
    }
    if (this.renewablesElement) {
      this.renewablesElement.textContent = '0.0%'; // Placeholder
    }
  }

  private updateStatsFromSimulation(result: SimulationResult): void {
    this.stats.loadServed = result.loadServed;
    this.stats.efficiency = result.efficiency;
    this.stats.reliability = result.reliability;
  }

  private showSimulationResults(result: SimulationResult): void {
    let message = `Simulation Results:\n\n`;
    message += `Load Served: ${result.loadServed.toFixed(1)}%\n`;
    message += `System Efficiency: ${result.efficiency.toFixed(1)}%\n`;
    message += `Grid Reliability: ${result.reliability.toFixed(1)}%\n\n`;
    
    if (result.errors.length > 0) {
      message += `Errors:\n${result.errors.join('\n')}`;
    } else {
      message += `✅ All European grid standards met!`;
    }
    
    this.infoElement.innerHTML = `<pre>${message}</pre>`;
  }
}
