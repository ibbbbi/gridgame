import { GridComponent, PowerLine, Point, ComponentType, LineType, NetworkType, GridStats, VoltageLevel } from '../types/GridTypes';
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

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
  }

  private getMousePosition(e: MouseEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  private handleCanvasClick(e: MouseEvent): void {
    const pos = this.getMousePosition(e);
    
    if (this.selectedTool === 'radial' || this.selectedTool === 'meshed') {
      this.networkType = this.selectedTool;
      this.selectedTool = null;
      this.render();
      return;
    }

    // Check if clicking on existing component
    const clickedComponent = this.getComponentAt(pos);
    
    if (this.isPlacingLine && clickedComponent) {
      this.completeLine(clickedComponent.id);
      return;
    }

    if (clickedComponent) {
      if (this.selectedTool === 'transmission-line' || 
          this.selectedTool === 'distribution-line' || 
          this.selectedTool === 'hvdc-line') {
        this.startLine(clickedComponent.id);
      } else {
        this.selectComponent(clickedComponent);
      }
      return;
    }

    // Place new component
    if (this.selectedTool && this.isComponentTool(this.selectedTool)) {
      this.placeComponent(this.selectedTool, pos);
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const pos = this.getMousePosition(e);
    
    if (this.isPlacingLine && this.lineStart) {
      this.render();
      this.drawTemporaryLine(this.lineStart, pos);
    }
  }

  private isComponentTool(tool: string): tool is ComponentType {
    return ['generator', 'substation', 'load'].includes(tool);
  }

  private placeComponent(type: ComponentType, position: Point): void {
    const cost = this.getComponentCost(type);
    
    if (this.stats.budget < cost) {
      this.showMessage('Insufficient budget!');
      return;
    }

    const component: GridComponent = {
      id: `${type}_${++this.componentCounter}`,
      type,
      position,
      capacity: this.getComponentCapacity(type),
      cost,
      connections: [],
      voltage: this.getComponentVoltage(type),
      isActive: true,
      // AC power flow parameters
      activePower: this.getComponentActivePower(type),
      reactivePower: this.getComponentReactivePower(type),
      voltageMagnitude: 1.0, // per unit (nominal voltage)
      voltageAngle: 0.0, // degrees
      frequency: 50.0 // Hz (European standard)
    };

    this.components.set(component.id, component);
    this.stats.budget -= cost;
    this.updateStats();
    this.render();
  }

  private getComponentCost(type: ComponentType): number {
    const costs = {
      generator: 10000,
      substation: 5000,
      load: 0
    };
    return costs[type];
  }

  private getComponentCapacity(type: ComponentType): number {
    const capacities = {
      generator: 50 + Math.random() * 100, // 50-150 MW
      substation: 200, // 200 MW transfer capacity
      load: 20 + Math.random() * 80 // 20-100 MW demand
    };
    return Math.round(capacities[type]);
  }

  private getComponentVoltage(type: ComponentType): VoltageLevel {
    const voltages: Record<ComponentType, VoltageLevel> = {
      generator: 220, // 220 kV European transmission
      substation: 110, // 110 kV European sub-transmission
      load: 20 // 20 kV European distribution
    };
    return voltages[type];
  }

  private getComponentActivePower(type: ComponentType): number {
    switch (type) {
      case 'generator':
        return this.getComponentCapacity(type); // Full capacity for generators
      case 'load':
        return -this.getComponentCapacity(type); // Negative for loads (consuming power)
      case 'substation':
        return 0; // Substations don't generate or consume active power
      default:
        return 0;
    }
  }

  private getComponentReactivePower(type: ComponentType): number {
    switch (type) {
      case 'generator':
        // Generators can provide reactive power (power factor ~0.9)
        return this.getComponentCapacity(type) * 0.45; // tan(acos(0.9))
      case 'load':
        // Loads typically consume reactive power
        return -this.getComponentCapacity(type) * 0.3;
      case 'substation':
        return 0; // Substations don't generate or consume reactive power
      default:
        return 0;
    }
  }

  private startLine(componentId: string): void {
    this.isPlacingLine = true;
    this.lineStart = componentId;
    this.canvas.style.cursor = 'crosshair';
  }

  private completeLine(endComponentId: string): void {
    if (!this.lineStart || this.lineStart === endComponentId) {
      this.cancelLine();
      return;
    }

    const lineType = this.selectedTool as LineType;
    const startComp = this.components.get(this.lineStart)!;
    const endComp = this.components.get(endComponentId)!;
    
    const length = this.calculateDistance(startComp.position, endComp.position) / 10; // Convert pixels to km
    const costPerKm = {
      'transmission-line': 2000,
      'distribution-line': 1000,
      'hvdc-line': 3000
    };
    const cost = Math.round(length * (costPerKm[lineType] || 2000));

    if (this.stats.budget < cost) {
      this.showMessage('Insufficient budget for line!');
      this.cancelLine();
      return;
    }

    const lineCapacity = {
      'transmission-line': 300,
      'distribution-line': 100,
      'hvdc-line': 500
    };

    const line: PowerLine = {
      id: `line_${++this.lineCounter}`,
      type: lineType,
      from: this.lineStart,
      to: endComponentId,
      length,
      cost,
      capacity: lineCapacity[lineType] || 300,
      resistance: this.getLineResistance(lineType, length),
      reactance: this.getLineReactance(lineType, length),
      susceptance: this.getLineSusceptance(lineType, length),
      thermalLimit: lineCapacity[lineType] || 300, // MVA
      isActive: true,
      isContingency: false // Initially not out for N-1 analysis
    };

    this.lines.set(line.id, line);
    startComp.connections.push(endComponentId);
    endComp.connections.push(this.lineStart);
    
    this.stats.budget -= cost;
    this.updateStats();
    this.cancelLine();
    this.render();
  }

  private getLineResistance(lineType: LineType, length: number): number {
    // European transmission line parameters (Ohms per km)
    const resistancePerKm = {
      'transmission-line': 0.03, // 400kV/220kV lines
      'distribution-line': 0.2,  // 20kV/10kV lines
      'hvdc-line': 0.01          // HVDC lines
    };
    return (resistancePerKm[lineType] || 0.1) * length;
  }

  private getLineReactance(lineType: LineType, length: number): number {
    // European transmission line parameters (Ohms per km)
    const reactancePerKm = {
      'transmission-line': 0.3,  // 400kV/220kV lines
      'distribution-line': 0.4,  // 20kV/10kV lines
      'hvdc-line': 0.0           // HVDC has no reactance
    };
    return (reactancePerKm[lineType] || 0.3) * length;
  }

  private getLineSusceptance(lineType: LineType, length: number): number {
    // European transmission line parameters (Siemens per km)
    const susceptancePerKm = {
      'transmission-line': 4e-6, // 400kV/220kV lines
      'distribution-line': 2e-6, // 20kV/10kV lines
      'hvdc-line': 0.0           // HVDC has no susceptance
    };
    return (susceptancePerKm[lineType] || 2e-6) * length;
  }

  private cancelLine(): void {
    this.isPlacingLine = false;
    this.lineStart = null;
    this.canvas.style.cursor = 'default';
  }

  private calculateDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  private getComponentAt(pos: Point): GridComponent | null {
    for (const component of this.components.values()) {
      const distance = this.calculateDistance(pos, component.position);
      if (distance <= 20) { // 20px radius
        return component;
      }
    }
    return null;
  }

  private selectComponent(component: GridComponent): void {
    const info = `
      <strong>${component.type.toUpperCase()}</strong><br>
      ID: ${component.id}<br>
      Capacity: ${component.capacity} MW<br>
      Voltage: ${component.voltage} kV<br>
      Connections: ${component.connections.length}<br>
      Status: ${component.isActive ? 'Active' : 'Inactive'}
    `;
    this.infoElement.innerHTML = info;
  }

  public setSelectedTool(tool: ComponentType | LineType | 'radial' | 'meshed' | null): void {
    this.selectedTool = tool;
    this.cancelLine();
  }

  public simulate(): void {
    this.simulator.setComponents(Array.from(this.components.values()));
    this.simulator.setLines(Array.from(this.lines.values()));
    this.simulator.setNetworkType(this.networkType);
    
    const result = this.simulator.simulate();
    
    if (result.success) {
      this.stats.loadServed = result.loadServed;
      this.stats.efficiency = result.efficiency;
      this.stats.reliability = result.reliability;
      
      this.updateStats();
      
      this.showMessage(`✅ European Power Grid Simulation Completed!
      
📊 Results:
• Load Served: ${result.loadServed.toFixed(1)} MW
• System Efficiency: ${result.efficiency.toFixed(1)}%
• Grid Reliability: ${(result.reliability * 100).toFixed(1)}%`);
    } else {
      this.showMessage(`❌ Simulation Failed!
      
Errors:
• ${result.errors.join('\n• ')}`);
    }
    
    this.render();
  }

  public clearGrid(): void {
    this.components.clear();
    this.lines.clear();
    this.stats.budget = 100000;
    this.stats.loadServed = 0;
    this.stats.efficiency = 0;
    this.stats.reliability = 0;
    this.componentCounter = 0;
    this.lineCounter = 0;
    this.updateStats();
    this.render();
  }

  private updateStats(): void {
    this.budgetElement.textContent = `$${this.stats.budget.toLocaleString()}`;
    this.loadServedElement.textContent = `${this.stats.loadServed.toFixed(1)} MW`;
    this.efficiencyElement.textContent = `${this.stats.efficiency.toFixed(1)}%`;
    
    // Optional elements for European grid metrics
    if (this.reliabilityElement) {
      this.reliabilityElement.textContent = `${(this.stats.reliability * 100).toFixed(1)}%`;
    }
  }

  private showMessage(message: string): void {
    // Simple alert for now - could be replaced with a proper toast system
    alert(message);
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid background
    this.drawGrid();
    
    // Draw lines first (so they appear under components)
    this.drawLines();
    
    // Draw components
    this.drawComponents();
    
    // Draw network type indicator
    this.drawNetworkTypeIndicator();
  }

  private drawGrid(): void {
    this.ctx.strokeStyle = '#f0f0f0';
    this.ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= this.canvas.width; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= this.canvas.height; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  private drawLines(): void {
    for (const line of this.lines.values()) {
      const fromComp = this.components.get(line.from);
      const toComp = this.components.get(line.to);
      
      if (!fromComp || !toComp) continue;
      
      this.ctx.beginPath();
      this.ctx.moveTo(fromComp.position.x, fromComp.position.y);
      this.ctx.lineTo(toComp.position.x, toComp.position.y);
      
      if (line.type === 'transmission-line') {
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 4;
      } else if (line.type === 'hvdc-line') {
        this.ctx.strokeStyle = '#e74c3c'; // Red for HVDC
        this.ctx.lineWidth = 5;
        this.ctx.setLineDash([10, 5]); // Dashed for HVDC
      } else {
        this.ctx.strokeStyle = '#7f8c8d';
        this.ctx.lineWidth = 2;
      }
      
      this.ctx.stroke();
      this.ctx.setLineDash([]); // Reset dash pattern
      
      // Draw line label
      const midX = (fromComp.position.x + toComp.position.x) / 2;
      const midY = (fromComp.position.y + toComp.position.y) / 2;
      
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.font = '10px Arial';
      this.ctx.fillText(`${line.length.toFixed(1)}km`, midX, midY);
    }
  }

  private drawComponents(): void {
    for (const component of this.components.values()) {
      const { x, y } = component.position;
      
      // Draw component shape
      this.ctx.beginPath();
      
      switch (component.type) {
        case 'generator':
          this.ctx.fillStyle = '#f39c12';
          this.ctx.strokeStyle = '#e67e22';
          this.ctx.arc(x, y, 15, 0, 2 * Math.PI);
          break;
          
        case 'substation':
          this.ctx.fillStyle = '#9b59b6';
          this.ctx.strokeStyle = '#8e44ad';
          this.ctx.rect(x - 12, y - 12, 24, 24);
          break;
          
        case 'load':
          this.ctx.fillStyle = '#e74c3c';
          this.ctx.strokeStyle = '#c0392b';
          // Draw triangle
          this.ctx.moveTo(x, y - 15);
          this.ctx.lineTo(x - 13, y + 10);
          this.ctx.lineTo(x + 13, y + 10);
          this.ctx.closePath();
          break;
      }
      
      this.ctx.lineWidth = 2;
      this.ctx.fill();
      this.ctx.stroke();
      
      // Draw component label
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${component.capacity}MW`, x, y + 35);
    }
  }

  private drawTemporaryLine(startComponentId: string, endPos: Point): void {
    const startComp = this.components.get(startComponentId);
    if (!startComp) return;
    
    this.ctx.beginPath();
    this.ctx.moveTo(startComp.position.x, startComp.position.y);
    this.ctx.lineTo(endPos.x, endPos.y);
    this.ctx.strokeStyle = '#3498db';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private drawNetworkTypeIndicator(): void {
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Network: ${this.networkType.toUpperCase()}`, 10, 25);
  }

  public init(): void {
    this.render();
  }
}
