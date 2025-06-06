import { GridComponent, PowerLine, Point, ComponentType, LineType, NetworkType, GridStats, VoltageLevel, GridNode, Command } from '../types/GridTypes';
import { EuropeanACPowerFlowSimulator } from '../simulation/EuropeanPowerFlowSimulator';

// Define configurable values for components
const COMPONENT_CONFIG = {
  generator: { cost: 10000, capacityRange: [50, 150], voltage: 220 as VoltageLevel },
  substation: { cost: 5000, capacityRange: [200, 200], voltage: 110 as VoltageLevel },
  load: { cost: 0, capacityRange: [20, 100], voltage: 20 as VoltageLevel }
};

export class PowerGridGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private components: Map<string, GridComponent> = new Map();
  private lines: Map<string, PowerLine> = new Map();
  private gridNodes: Map<string, GridNode> = new Map(); // New: Grid nodes for multiple connections
  private simulator: EuropeanACPowerFlowSimulator = new EuropeanACPowerFlowSimulator();
  
  // Undo/Redo system
  private commandHistory: Command[] = [];
  private currentCommandIndex = -1;
  private maxHistorySize = 50;
  
  private selectedTool: ComponentType | LineType | 'radial' | 'meshed' | 'node' | null = null;
  private networkType: NetworkType = 'radial';
  private isPlacingLine = false;
  private lineStart: string | null = null;
  
  private stats: GridStats = {
    budget: 500000, // Increased by 500%
    totalGeneration: 0,
    totalLoad: 0,
    loadServed: 0,
    efficiency: 0,
    reliability: 0
  };

  private componentCounter = 0;
  private lineCounter = 0;
  private nodeCounter = 0; // New: Node counter

  constructor(
    canvas: HTMLCanvasElement,
    private budgetElement: HTMLElement,
    private loadServedElement: HTMLElement,
    private efficiencyElement: HTMLElement,
    private infoElement: HTMLElement,
    _frequencyElement?: HTMLElement,
    private reliabilityElement?: HTMLElement,
    _renewablesElement?: HTMLElement
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupEventListeners();
    this.updateStats();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    
    // Add right-click context menu for deletion
    this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
    
    // Add keyboard listeners for undo/redo
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Undo: Ctrl+Z (or Cmd+Z on Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      this.undo();
    }
    // Redo: Ctrl+Y or Ctrl+Shift+Z (or Cmd+Y/Cmd+Shift+Z on Mac)
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      this.redo();
    }
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

    // Place grid node
    if (this.selectedTool === 'node') {
      this.placeGridNode(pos);
      return;
    }

    // Check if clicking on existing component or grid node
    const clickedComponent = this.getComponentAt(pos);
    const clickedNode = this.getNodeAt(pos);
    
    if (this.isPlacingLine && (clickedComponent || clickedNode)) {
      const targetId = clickedComponent ? clickedComponent.id : clickedNode!.id;
      this.completeLine(targetId);
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

    if (clickedNode) {
      if (this.selectedTool === 'transmission-line' || 
          this.selectedTool === 'distribution-line' || 
          this.selectedTool === 'hvdc-line') {
        this.startLine(clickedNode.id);
      } else {
        this.selectNode(clickedNode);
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

    // Check if there's a nearby grid node to connect to
    const nearestNode = this.findNearestNode(position);
    if (nearestNode) {
      this.connectComponentToNode(component.id, nearestNode.id);
    }

    // Create command for undo/redo
    const command: Command = {
      id: `cmd_${Date.now()}`,
      type: 'place-component',
      timestamp: Date.now(),
      execute: () => {
        this.components.set(component.id, component);
        this.stats.budget -= cost;
        if (nearestNode) {
          this.connectComponentToNode(component.id, nearestNode.id);
        }
      },
      undo: () => {
        this.components.delete(component.id);
        this.stats.budget += cost;
        if (nearestNode) {
          // Remove component from node's connected list
          const nodeIndex = nearestNode.connectedComponents.indexOf(component.id);
          if (nodeIndex > -1) {
            nearestNode.connectedComponents.splice(nodeIndex, 1);
          }
        }
      },
      data: { component, cost, nearestNode }
    };

    command.execute();
    this.addCommand(command);
    this.updateStats();
    this.render();
  }

  private getComponentCost(type: ComponentType): number {
    return COMPONENT_CONFIG[type].cost;
  }

  private getComponentCapacity(type: ComponentType): number {
    const [min, max] = COMPONENT_CONFIG[type].capacityRange;
    return Math.round(min + Math.random() * (max - min));
  }

  private getComponentVoltage(type: ComponentType): VoltageLevel {
    return COMPONENT_CONFIG[type].voltage;
  }

  private getComponentActivePower(type: ComponentType): number {
    if (type === 'generator') {
      return this.getComponentCapacity(type); // Full capacity for generators
    } else if (type === 'load') {
      return -this.getComponentCapacity(type); // Negative for loads (consuming power)
    } else {
      return 0; // Substations don't generate or consume active power
    }
  }

  private getComponentReactivePower(type: ComponentType): number {
    if (type === 'generator') {
      return this.getComponentCapacity(type) * 0.45; // tan(acos(0.9))
    } else if (type === 'load') {
      return -this.getComponentCapacity(type) * 0.3;
    } else {
      return 0; // Substations don't generate or consume reactive power
    }
  }

  private startLine(componentId: string): void {
    this.isPlacingLine = true;
    this.lineStart = componentId;
    this.canvas.style.cursor = 'crosshair';
  }

  private completeLine(endTargetId: string): void {
    if (!this.lineStart || this.lineStart === endTargetId) {
      this.cancelLine();
      return;
    }

    const lineType = this.selectedTool as LineType;
    
    // Get start and end positions (could be components or nodes)
    const startTarget = this.components.get(this.lineStart) || this.gridNodes.get(this.lineStart);
    const endTarget = this.components.get(endTargetId) || this.gridNodes.get(endTargetId);
    
    if (!startTarget || !endTarget) {
      this.cancelLine();
      return;
    }
    
    const length = this.calculateDistance(startTarget.position, endTarget.position) / 10; // Convert pixels to km
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
      to: endTargetId,
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

    // Create command for undo/redo
    const command: Command = {
      id: `cmd_${Date.now()}`,
      type: 'place-line',
      timestamp: Date.now(),
      execute: () => {
        this.lines.set(line.id, line);
        
        // Update connections for components
        const startComp = this.components.get(this.lineStart!);
        const endComp = this.components.get(endTargetId);
        if (startComp) startComp.connections.push(endTargetId);
        if (endComp) endComp.connections.push(this.lineStart!);
        
        // Update connections for grid nodes
        const startNode = this.gridNodes.get(this.lineStart!);
        const endNode = this.gridNodes.get(endTargetId);
        if (startNode) startNode.connectedLines.push(line.id);
        if (endNode) endNode.connectedLines.push(line.id);
        
        this.stats.budget -= cost;
      },
      undo: () => {
        this.lines.delete(line.id);
        
        // Remove connections for components
        const startComp = this.components.get(this.lineStart!);
        const endComp = this.components.get(endTargetId);
        if (startComp) {
          const idx = startComp.connections.indexOf(endTargetId);
          if (idx > -1) startComp.connections.splice(idx, 1);
        }
        if (endComp) {
          const idx = endComp.connections.indexOf(this.lineStart!);
          if (idx > -1) endComp.connections.splice(idx, 1);
        }
        
        // Remove connections for grid nodes
        const startNode = this.gridNodes.get(this.lineStart!);
        const endNode = this.gridNodes.get(endTargetId);
        if (startNode) {
          const idx = startNode.connectedLines.indexOf(line.id);
          if (idx > -1) startNode.connectedLines.splice(idx, 1);
        }
        if (endNode) {
          const idx = endNode.connectedLines.indexOf(line.id);
          if (idx > -1) endNode.connectedLines.splice(idx, 1);
        }
        
        this.stats.budget += cost;
      },
      data: { line, cost, startTargetId: this.lineStart, endTargetId }
    };

    command.execute();
    this.addCommand(command);
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

  private getNodeAt(pos: Point): GridNode | null {
    for (const node of this.gridNodes.values()) {
      const distance = this.calculateDistance(pos, node.position);
      if (distance <= 15) { // 15px radius for nodes
        return node;
      }
    }
    return null;
  }

  private selectComponent(component: GridComponent): void {
    let nodeInfo = 'Not connected to grid node';
    if (component.connectedNode) {
      const node = this.gridNodes.get(component.connectedNode);
      if (node) {
        nodeInfo = `Connected to ${node.id} (${node.voltage}kV)`;
      }
    }
    
    const info = `
      <strong>${component.type.toUpperCase()}</strong><br>
      ID: ${component.id}<br>
      Capacity: ${component.capacity} MW<br>
      Voltage: ${component.voltage} kV<br>
      Cost: $${component.cost.toLocaleString()}<br>
      Connections: ${component.connections.length}<br>
      Status: ${component.isActive ? 'Active' : 'Inactive'}<br>
      <br>
      <strong>Grid Connection:</strong><br>
      ${nodeInfo}<br>
      <br>
      <em>Right-click to delete</em>
    `;
    this.infoElement.innerHTML = info;
  }

  private selectNode(node: GridNode): void {
    const totalConnections = node.connectedComponents.length + node.connectedLines.length;
    
    let componentsList = 'None';
    if (node.connectedComponents.length > 0) {
      componentsList = node.connectedComponents.map(id => {
        const comp = this.components.get(id);
        return comp ? `${comp.type} (${comp.id})` : id;
      }).join(', ');
    }
    
    let linesList = 'None';
    if (node.connectedLines.length > 0) {
      linesList = node.connectedLines.map(id => {
        const line = this.lines.get(id);
        return line ? `${line.type} (${line.capacity}MW)` : id;
      }).join(', ');
    }
    
    const info = `
      <strong>GRID NODE</strong><br>
      ID: ${node.id}<br>
      Voltage: ${node.voltage} kV<br>
      Total Connections: ${totalConnections}<br>
      <br>
      <strong>Connected Components:</strong><br>
      ${componentsList}<br>
      <br>
      <strong>Connected Lines:</strong><br>
      ${linesList}<br>
      <br>
      <em>Right-click to delete</em>
    `;
    this.infoElement.innerHTML = info;
  }

  public setSelectedTool(tool: ComponentType | LineType | 'radial' | 'meshed' | 'node' | null): void {
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
    this.gridNodes.clear();
    this.stats.budget = 500000;
    this.stats.loadServed = 0;
    this.stats.efficiency = 0;
    this.stats.reliability = 0;
    this.componentCounter = 0;
    this.lineCounter = 0;
    this.nodeCounter = 0; // Reset node counter
    
    // Clear command history
    this.commandHistory = [];
    this.currentCommandIndex = -1;
    
    this.updateStats();
    this.updateButtonStates();
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
    
    // Draw component-to-node connections
    this.drawComponentNodeConnections();
    
    // Draw grid nodes
    this.drawGridNodes();
    
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
      const fromTarget = this.components.get(line.from) || this.gridNodes.get(line.from);
      const toTarget = this.components.get(line.to) || this.gridNodes.get(line.to);
      
      if (!fromTarget || !toTarget) continue;
      
      // Calculate line path
      const fromPos = fromTarget.position;
      const toPos = toTarget.position;
      
      this.ctx.beginPath();
      this.ctx.moveTo(fromPos.x, fromPos.y);
      this.ctx.lineTo(toPos.x, toPos.y);
      
      // Set line style based on type with electrical standards
      switch (line.type) {
        case 'transmission-line':
          this.ctx.strokeStyle = '#e67e22';
          this.ctx.lineWidth = 4;
          this.ctx.setLineDash([]);
          break;
        case 'distribution-line':
          this.ctx.strokeStyle = '#16a085';
          this.ctx.lineWidth = 3;
          this.ctx.setLineDash([]);
          break;
        case 'hvdc-line':
          this.ctx.strokeStyle = '#8e44ad';
          this.ctx.lineWidth = 5;
          this.ctx.setLineDash([15, 8]); // Dashed line for DC
          break;
      }
      
      this.ctx.stroke();
      this.ctx.setLineDash([]); // Reset line dash
      
      // Draw line capacity label at midpoint
      const midX = (fromPos.x + toPos.x) / 2;
      const midY = (fromPos.y + toPos.y) / 2;
      
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.strokeStyle = '#34495e';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.roundRect(midX - 20, midY - 8, 40, 16, 4);
      this.ctx.fill();
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${line.capacity}MW`, midX, midY + 3);
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
    this.updateButtonStates();
    this.render();
  }

  // Undo/Redo Methods
  public undo(): void {
    if (this.currentCommandIndex >= 0) {
      const command = this.commandHistory[this.currentCommandIndex];
      command.undo();
      this.currentCommandIndex--;
      this.updateStats();
      this.updateButtonStates();
      this.render();
    }
  }

  public redo(): void {
    if (this.currentCommandIndex < this.commandHistory.length - 1) {
      this.currentCommandIndex++;
      const command = this.commandHistory[this.currentCommandIndex];
      command.execute();
      this.updateStats();
      this.updateButtonStates();
      this.render();
    }
  }

  private addCommand(command: Command): void {
    // Remove any commands after current index (when adding new command after undo)
    this.commandHistory = this.commandHistory.slice(0, this.currentCommandIndex + 1);
    
    // Add new command
    this.commandHistory.push(command);
    this.currentCommandIndex++;
    
    // Limit history size
    if (this.commandHistory.length > this.maxHistorySize) {
      this.commandHistory.shift();
      this.currentCommandIndex--;
    }
    
    // Update button states after adding command
    this.updateButtonStates();
  }

  // Grid Node Methods
  private createGridNode(position: Point, voltage: VoltageLevel): GridNode {
    return {
      id: `node_${++this.nodeCounter}`,
      position,
      voltage,
      connectedComponents: [],
      connectedLines: [],
      isVisible: true
    };
  }

  private placeGridNode(position: Point): void {
    const node = this.createGridNode(position, 110); // Default 110kV
    
    const command: Command = {
      id: `cmd_${Date.now()}`,
      type: 'place-node',
      timestamp: Date.now(),
      execute: () => {
        this.gridNodes.set(node.id, node);
      },
      undo: () => {
        this.gridNodes.delete(node.id);
      },
      data: { node }
    };

    command.execute();
    this.addCommand(command);
    this.render();
  }

  private connectComponentToNode(componentId: string, nodeId: string): void {
    const component = this.components.get(componentId);
    const node = this.gridNodes.get(nodeId);
    
    if (component && node) {
      component.connectedNode = nodeId;
      node.connectedComponents.push(componentId);
    }
  }

  private findNearestNode(position: Point, maxDistance = 30): GridNode | null {
    let nearestNode: GridNode | null = null;
    let minDistance = maxDistance;

    for (const node of this.gridNodes.values()) {
      const distance = Math.sqrt(
        Math.pow(position.x - node.position.x, 2) + 
        Math.pow(position.y - node.position.y, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = node;
      }
    }

    return nearestNode;
  }

  private drawGridNodes(): void {
    for (const node of this.gridNodes.values()) {
      if (!node.isVisible) continue;
      
      const { x, y } = node.position;
      const totalConnections = node.connectedComponents.length + node.connectedLines.length;
      
      // Draw connection point (small circle)
      this.ctx.beginPath();
      this.ctx.arc(x, y, 8, 0, 2 * Math.PI);
      this.ctx.fillStyle = '#34495e';
      this.ctx.fill();
      
      // Draw border
      this.ctx.beginPath();
      this.ctx.arc(x, y, 8, 0, 2 * Math.PI);
      this.ctx.strokeStyle = '#2c3e50';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      // Draw inner circle for connection indication
      if (totalConnections > 0) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fill();
      }
      
      // Draw connection count badge if there are multiple connections
      if (totalConnections > 1) {
        this.ctx.beginPath();
        this.ctx.arc(x + 10, y - 10, 8, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#3498db';
        this.ctx.fill();
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(totalConnections.toString(), x + 10, y - 6);
      }
      
      // Draw voltage level label
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${node.voltage}kV`, x, y + 20);
    }
  }

  private drawComponentNodeConnections(): void {
    for (const component of this.components.values()) {
      if (component.connectedNode) {
        const node = this.gridNodes.get(component.connectedNode);
        if (node) {
          // Draw dotted line from component to node
          this.ctx.beginPath();
          this.ctx.moveTo(component.position.x, component.position.y);
          this.ctx.lineTo(node.position.x, node.position.y);
          this.ctx.strokeStyle = '#95a5a6';
          this.ctx.lineWidth = 1;
          this.ctx.setLineDash([3, 3]); // Dotted line
          this.ctx.stroke();
          this.ctx.setLineDash([]); // Reset dash pattern
        }
      }
    }
  }

  // Add methods to check if undo/redo are available
  public canUndo(): boolean {
    return this.currentCommandIndex >= 0;
  }

  public canRedo(): boolean {
    return this.currentCommandIndex < this.commandHistory.length - 1;
  }

  // Add method to update button states
  public updateButtonStates(): void {
    const undoBtn = document.querySelector('#undo-btn') as HTMLButtonElement;
    const redoBtn = document.querySelector('#redo-btn') as HTMLButtonElement;

    if (undoBtn) {
      undoBtn.disabled = !this.canUndo();
    }
    if (redoBtn) {
      redoBtn.disabled = !this.canRedo();
    }
  }

  private handleRightClick(e: MouseEvent): void {
    e.preventDefault(); // Prevent browser context menu
    
    const pos = this.getMousePosition(e);
    const clickedComponent = this.getComponentAt(pos);
    const clickedNode = this.getNodeAt(pos);
    
    if (clickedComponent) {
      if (confirm(`Delete ${clickedComponent.type} "${clickedComponent.id}"?`)) {
        this.deleteComponent(clickedComponent.id);
      }
    } else if (clickedNode) {
      if (confirm(`Delete grid node "${clickedNode.id}"?`)) {
        this.deleteGridNode(clickedNode.id);
      }
    }
  }

  private deleteComponent(componentId: string): void {
    const component = this.components.get(componentId);
    if (!component) return;

    // Store connected lines for undo
    const connectedLines: PowerLine[] = [];
    for (const line of this.lines.values()) {
      if (line.from === componentId || line.to === componentId) {
        connectedLines.push(line);
      }
    }

    const command: Command = {
      id: `cmd_${Date.now()}`,
      type: 'delete-component',
      timestamp: Date.now(),
      execute: () => {
        // Remove the component
        this.components.delete(componentId);
        
        // Remove connected lines
        connectedLines.forEach(line => {
          this.lines.delete(line.id);
          
          // Remove line connections from other components/nodes
          const otherTargetId = line.from === componentId ? line.to : line.from;
          const otherComponent = this.components.get(otherTargetId);
          const otherNode = this.gridNodes.get(otherTargetId);
          
          if (otherComponent) {
            const idx = otherComponent.connections.indexOf(componentId);
            if (idx > -1) otherComponent.connections.splice(idx, 1);
          }
          
          if (otherNode) {
            const idx = otherNode.connectedLines.indexOf(line.id);
            if (idx > -1) otherNode.connectedLines.splice(idx, 1);
          }
        });
        
        // Remove from connected node
        if (component.connectedNode) {
          const node = this.gridNodes.get(component.connectedNode);
          if (node) {
            const idx = node.connectedComponents.indexOf(componentId);
            if (idx > -1) node.connectedComponents.splice(idx, 1);
          }
        }
        
        // Refund component cost
        this.stats.budget += component.cost;
      },
      undo: () => {
        // Restore the component
        this.components.set(componentId, component);
        
        // Restore connected lines
        connectedLines.forEach(line => {
          this.lines.set(line.id, line);
          
          // Restore line connections to other components/nodes
          const otherTargetId = line.from === componentId ? line.to : line.from;
          const otherComponent = this.components.get(otherTargetId);
          const otherNode = this.gridNodes.get(otherTargetId);
          
          if (otherComponent && !otherComponent.connections.includes(componentId)) {
            otherComponent.connections.push(componentId);
          }
          
          if (otherNode && !otherNode.connectedLines.includes(line.id)) {
            otherNode.connectedLines.push(line.id);
          }
        });
        
        // Restore connection to node
        if (component.connectedNode) {
          const node = this.gridNodes.get(component.connectedNode);
          if (node && !node.connectedComponents.includes(componentId)) {
            node.connectedComponents.push(componentId);
          }
        }
        
        // Subtract component cost
        this.stats.budget -= component.cost;
      },
      data: { component, connectedLines }
    };

    command.execute();
    this.addCommand(command);
    this.updateStats();
    this.render();
  }

  private deleteGridNode(nodeId: string): void {
    const node = this.gridNodes.get(nodeId);
    if (!node) return;

    // Check if node has connections
    if (node.connectedComponents.length > 0 || node.connectedLines.length > 0) {
      this.showMessage('Cannot delete grid node with active connections. Remove connected components and lines first.');
      return;
    }

    const command: Command = {
      id: `cmd_${Date.now()}`,
      type: 'delete-node',
      timestamp: Date.now(),
      execute: () => {
        this.gridNodes.delete(nodeId);
      },
      undo: () => {
        this.gridNodes.set(nodeId, node);
      },
      data: { node }
    };

    command.execute();
    this.addCommand(command);
    this.render();
  }
}
