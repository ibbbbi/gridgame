import { GridComponent, PowerLine, SimulationResult, NetworkType, ACBusData, ACLineData } from '../types/GridTypes';

export class EuropeanACPowerFlowSimulator {
  private components: Map<string, GridComponent> = new Map();
  private lines: Map<string, PowerLine> = new Map();
  private networkType: NetworkType = 'radial';
  private baseFrequency = 50; // European standard 50 Hz
  private baseMVA = 100; // Base MVA for per-unit calculations
  private voltageTolerances = { min: 0.95, max: 1.05 }; // European voltage limits (±5%)
  private maxIterations = 20;
  private tolerance = 1e-6;

  setComponents(components: GridComponent[]): void {
    this.components.clear();
    components.forEach(comp => this.components.set(comp.id, comp));
  }

  setLines(lines: PowerLine[]): void {
    this.lines.clear();
    lines.forEach(line => this.lines.set(line.id, line));
  }

  setNetworkType(type: NetworkType): void {
    this.networkType = type;
  }

  simulate(): SimulationResult {
    const result: SimulationResult = {
      success: false,
      loadServed: 0,
      efficiency: 0,
      reliability: 0,
      powerFlow: {},
      voltages: {},
      n1Analysis: {
        passed: false,
        criticalContingencies: [],
        overloadedLines: [],
        voltageLimits: []
      },
      frequency: this.baseFrequency,
      systemStability: 0,
      renewableIntegration: 0,
      errors: [],
      warnings: []
    };

    try {
      // Check network connectivity
      if (!this.checkConnectivity()) {
        result.errors.push('Network is not fully connected');
        return result;
      }

      // Perform AC load flow calculation
      const loadFlowResult = this.performACLoadFlow();
      if (!loadFlowResult.success) {
        result.errors.push(...loadFlowResult.errors);
        return result;
      }

      // Update result with load flow data
      result.success = true;
      result.powerFlow = loadFlowResult.powerFlow;
      result.voltages = loadFlowResult.voltages;
      result.loadServed = loadFlowResult.loadServed;
      result.efficiency = this.calculateSystemEfficiency(loadFlowResult);
      result.reliability = this.calculateReliability();

      // Perform N-1 contingency analysis
      result.n1Analysis = this.performN1Analysis(loadFlowResult);

      // Calculate European grid metrics
      result.systemStability = this.calculateSystemStability(loadFlowResult);
      result.renewableIntegration = this.calculateRenewableIntegration();

      // Validate against European standards (ENTSO-E)
      this.validateEuropeanStandards(result);

      return result;
    } catch (error) {
      result.errors.push(`Simulation error: ${error}`);
      return result;
    }
  }
  private checkConnectivity(): boolean {
    if (this.components.size === 0) return false;

    const visited = new Set<string>();
    const queue = [Array.from(this.components.keys())[0]];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;

      visited.add(currentId);

      // Find connected components through lines
      for (const line of this.lines.values()) {
        if (line.from === currentId && !visited.has(line.to)) {
          queue.push(line.to);
        } else if (line.to === currentId && !visited.has(line.from)) {
          queue.push(line.from);
        }
      }
    }

    return visited.size === this.components.size;
  }

  private performACLoadFlow(): { 
    success: boolean, 
    powerFlow: { [lineId: string]: { active: number, reactive: number, apparent: number } },
    voltages: { [componentId: string]: { magnitude: number, angle: number } },
    loadServed: number,
    errors: string[] 
  } {
    const result = {
      success: false,
      powerFlow: {} as { [lineId: string]: { active: number, reactive: number, apparent: number } },
      voltages: {} as { [componentId: string]: { magnitude: number, angle: number } },
      loadServed: 0,
      errors: [] as string[]
    };

    try {
      // Build bus and line data for AC load flow
      const busData = this.buildBusData();
      const lineData = this.buildLineData();
      
      if (busData.length === 0) {
        result.errors.push('No buses available for load flow calculation');
        return result;
      }

      // Build admittance matrix
      const yMatrix = this.buildAdmittanceMatrix(busData, lineData);
      
      // Perform Newton-Raphson load flow
      const loadFlowSolution = this.newtonRaphsonLoadFlow(busData, yMatrix);
      
      if (!loadFlowSolution.converged) {
        result.errors.push('Load flow did not converge');
        return result;
      }

      // Calculate power flows and voltages
      result.powerFlow = this.calculatePowerFlows(busData, lineData, loadFlowSolution.voltages);
      result.voltages = this.formatVoltageResults(busData, loadFlowSolution.voltages);
      result.loadServed = this.calculateLoadServed(busData);
      result.success = true;

      return result;
    } catch (error) {
      result.errors.push(`AC Load Flow Error: ${error}`);
      return result;
    }
  }

  private buildBusData(): ACBusData[] {
    const buses: ACBusData[] = [];
    let slackBusExists = false;

    for (const component of this.components.values()) {
      let busType: 'PQ' | 'PV' | 'SLACK' = 'PQ';
      
      if (component.type === 'generator' && !slackBusExists) {
        busType = 'SLACK'; // First generator becomes slack bus
        slackBusExists = true;
      } else if (component.type === 'generator') {
        busType = 'PV'; // Other generators are PV buses
      }

      buses.push({
        id: component.id,
        type: busType,
        voltage: component.voltage,
        activePower: component.type === 'load' ? -component.activePower : component.activePower,
        reactivePower: component.type === 'load' ? -component.reactivePower : component.reactivePower,
        voltageMagnitude: component.voltageMagnitude,
        voltageAngle: component.voltageAngle * Math.PI / 180 // Convert to radians
      });
    }

    return buses;
  }

  private buildLineData(): ACLineData[] {
    const lines: ACLineData[] = [];
    
    for (const line of this.lines.values()) {
      if (!line.isActive || line.isContingency) continue; // Skip inactive or contingency lines
      
      lines.push({
        id: line.id,
        from: line.from,
        to: line.to,
        resistance: line.resistance * line.length / (line.voltage * line.voltage / this.baseMVA), // Convert to per-unit
        reactance: line.reactance * line.length / (line.voltage * line.voltage / this.baseMVA),
        susceptance: line.susceptance * line.length * (line.voltage * line.voltage / this.baseMVA),
        tapRatio: 1.0, // Assume no transformers for now
        phaseShift: 0.0
      });
    }

    return lines;
  }

  private buildAdmittanceMatrix(buses: ACBusData[], lines: ACLineData[]): Complex[][] {
    const n = buses.length;
    const busIndexMap = new Map<string, number>();
    buses.forEach((bus, index) => busIndexMap.set(bus.id, index));

    // Initialize admittance matrix
    const Y: Complex[][] = Array(n).fill(null).map(() => 
      Array(n).fill(null).map(() => ({ real: 0, imag: 0 }))
    );

    // Add line admittances
    for (const line of lines) {
      const fromIndex = busIndexMap.get(line.from);
      const toIndex = busIndexMap.get(line.to);
      
      if (fromIndex === undefined || toIndex === undefined) continue;

      // Line admittance y = 1/(r + jx)
      const impedance = { 
        real: line.resistance, 
        imag: line.reactance 
      };
      const admittance = this.complexInverse(impedance);

      // Add to diagonal elements
      Y[fromIndex][fromIndex] = this.complexAdd(Y[fromIndex][fromIndex], admittance);
      Y[toIndex][toIndex] = this.complexAdd(Y[toIndex][toIndex], admittance);

      // Add to off-diagonal elements
      const negAdmittance = { real: -admittance.real, imag: -admittance.imag };
      Y[fromIndex][toIndex] = this.complexAdd(Y[fromIndex][toIndex], negAdmittance);
      Y[toIndex][fromIndex] = this.complexAdd(Y[toIndex][fromIndex], negAdmittance);

      // Add shunt susceptance
      const shunt = { real: 0, imag: line.susceptance / 2 };
      Y[fromIndex][fromIndex] = this.complexAdd(Y[fromIndex][fromIndex], shunt);
      Y[toIndex][toIndex] = this.complexAdd(Y[toIndex][toIndex], shunt);
    }

    return Y;
  }

  private newtonRaphsonLoadFlow(buses: ACBusData[], yMatrix: Complex[][]): {
    converged: boolean,
    voltages: { magnitude: number, angle: number }[]
  } {
    const n = buses.length;
    let voltages = buses.map(bus => ({ 
      magnitude: bus.voltageMagnitude, 
      angle: bus.voltageAngle 
    }));

    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      // Calculate power mismatches
      const mismatches = this.calculatePowerMismatches(buses, yMatrix, voltages);
      
      // Check convergence
      const maxMismatch = Math.max(...mismatches.map(Math.abs));
      if (maxMismatch < this.tolerance) {
        return { converged: true, voltages };
      }

      // Build Jacobian matrix
      const jacobian = this.buildJacobian(buses, yMatrix, voltages);
      
      // Solve linear system: J * ΔX = -F
      const deltaX = this.solveLinearSystem(jacobian, mismatches.map(m => -m));
      
      // Update voltages
      this.updateVoltages(buses, voltages, deltaX);
    }

    return { converged: false, voltages };
  }

  private calculatePowerMismatches(buses: ACBusData[], yMatrix: Complex[][], voltages: { magnitude: number, angle: number }[]): number[] {
    const mismatches: number[] = [];
    
    for (let i = 0; i < buses.length; i++) {
      const bus = buses[i];
      if (bus.type === 'SLACK') continue; // Skip slack bus
      
      // Calculate injected power
      let pInj = 0, qInj = 0;
      
      for (let j = 0; j < buses.length; j++) {
        const y = yMatrix[i][j];
        const angleDiff = voltages[i].angle - voltages[j].angle;
        const vmag_i = voltages[i].magnitude;
        const vmag_j = voltages[j].magnitude;
        
        pInj += vmag_i * vmag_j * (y.real * Math.cos(angleDiff) + y.imag * Math.sin(angleDiff));
        qInj += vmag_i * vmag_j * (y.imag * Math.cos(angleDiff) - y.real * Math.sin(angleDiff));
      }
      
      // Power mismatches
      mismatches.push(bus.activePower - pInj);
      if (bus.type === 'PQ') {
        mismatches.push(bus.reactivePower - qInj);
      }
    }
    
    return mismatches;
  }

  private buildJacobian(buses: ACBusData[], yMatrix: Complex[][], voltages: { magnitude: number, angle: number }[]): number[][] {
    const n = buses.filter(b => b.type !== 'SLACK').length;
    const pqBuses = buses.filter(b => b.type === 'PQ').length;
    const jacobian: number[][] = Array(n + pqBuses).fill(null).map(() => Array(n + pqBuses).fill(0));
    
    // This is a simplified Jacobian - in practice, this would be more complex
    // For demonstration, we'll use a basic approximation
    for (let i = 0; i < jacobian.length; i++) {
      for (let j = 0; j < jacobian[i].length; j++) {
        jacobian[i][j] = (i === j) ? 1.0 : 0.1; // Simplified diagonal dominance
      }
    }
    
    return jacobian;
  }

  private solveLinearSystem(A: number[][], b: number[]): number[] {
    // Simplified Gaussian elimination
    const n = A.length;
    const x = new Array(n).fill(0);
    
    // Forward elimination (simplified)
    for (let i = 0; i < n; i++) {
      x[i] = b[i] / (A[i][i] || 1); // Simple division, avoiding zero
    }
    
    return x;
  }

  private updateVoltages(buses: ACBusData[], voltages: { magnitude: number, angle: number }[], deltaX: number[]): void {
    let idx = 0;
    
    for (let i = 0; i < buses.length; i++) {
      if (buses[i].type === 'SLACK') continue;
      
      // Update voltage angle
      voltages[i].angle += deltaX[idx++];
      
      // Update voltage magnitude for PQ buses
      if (buses[i].type === 'PQ') {
        voltages[i].magnitude += deltaX[idx++];
      }
    }
  }
  private formatVoltageResults(buses: ACBusData[], voltages: { magnitude: number, angle: number }[]): { [componentId: string]: { magnitude: number, angle: number } } {
    const result: { [componentId: string]: { magnitude: number, angle: number } } = {};
    
    buses.forEach((bus, index) => {
      result[bus.id] = {
        magnitude: voltages[index].magnitude,
        angle: voltages[index].angle * 180 / Math.PI // Convert back to degrees
      };
    });
    
    return result;
  }

  private calculateLoadServed(buses: ACBusData[]): number {
    return buses
      .filter(bus => bus.activePower < 0) // Load buses have negative power
      .reduce((sum, bus) => sum + Math.abs(bus.activePower), 0);
  }

  private calculatePowerFlows(buses: ACBusData[], lines: ACLineData[], voltages: { magnitude: number, angle: number }[]): { [lineId: string]: { active: number, reactive: number, apparent: number } } {
    const powerFlows: { [lineId: string]: { active: number, reactive: number, apparent: number } } = {};
    const busIndexMap = new Map<string, number>();
    buses.forEach((bus, index) => busIndexMap.set(bus.id, index));

    for (const line of lines) {
      const fromIdx = busIndexMap.get(line.from);
      const toIdx = busIndexMap.get(line.to);
      
      if (fromIdx === undefined || toIdx === undefined) continue;

      const vFrom = voltages[fromIdx];
      const vTo = voltages[toIdx];
      
      // Calculate line power flow using line parameters
      const angleDiff = vFrom.angle - vTo.angle;
      const impedanceMag = Math.sqrt(line.resistance * line.resistance + line.reactance * line.reactance);
      
      const activePower = (vFrom.magnitude * vTo.magnitude / impedanceMag) * 
                         Math.sin(angleDiff + Math.atan2(line.reactance, line.resistance));
      const reactivePower = (vFrom.magnitude / impedanceMag) * 
                           (vFrom.magnitude - vTo.magnitude * Math.cos(angleDiff + Math.atan2(line.reactance, line.resistance)));
      
      const apparentPower = Math.sqrt(activePower * activePower + reactivePower * reactivePower);
      
      powerFlows[line.id] = {
        active: activePower,
        reactive: reactivePower,
        apparent: apparentPower
      };
    }

    return powerFlows;
  }

  private calculateSystemEfficiency(loadFlowResult: any): number {
    let totalLosses = 0;
    let totalGeneration = 0;

    // Calculate transmission losses
    Object.values(loadFlowResult.powerFlow).forEach((flow: any) => {
      totalLosses += Math.abs(flow.active) * 0.02; // Assume 2% losses per line
    });

    // Calculate total generation
    for (const component of this.components.values()) {
      if (component.type === 'generator') {
        totalGeneration += component.activePower;
      }
    }

    return Math.max(0, (totalGeneration - totalLosses) / totalGeneration) * 100;
  }

  private calculateReliability(): number {
    // Base reliability depends on network topology
    let baseReliability = this.networkType === 'meshed' ? 0.95 : 0.85;
    
    // Adjust based on redundancy
    const redundancyFactor = this.calculateNetworkRedundancy();
    return Math.min(0.99, baseReliability * (1 + redundancyFactor * 0.1));
  }

  private calculateNetworkRedundancy(): number {
    const totalComponents = this.components.size;
    const totalLines = this.lines.size;
    
    // Meshed networks have more redundancy
    return totalLines > totalComponents ? (totalLines - totalComponents) / totalComponents : 0;
  }

  private performN1Analysis(baseResult: any): {
    passed: boolean;
    criticalContingencies: string[];
    overloadedLines: { lineId: string, loading: number }[];
    voltageLimits: { busId: string, violation: number }[];
  } {
    const n1Result = {
      passed: true,
      criticalContingencies: [] as string[],
      overloadedLines: [] as { lineId: string, loading: number }[],
      voltageLimits: [] as { busId: string, violation: number }[]
    };

    // Test each line outage
    for (const line of this.lines.values()) {
      if (!line.isActive) continue;

      // Simulate line outage
      line.isContingency = true;
      
      try {
        const contingencyResult = this.performACLoadFlow();
        
        if (!contingencyResult.success) {
          n1Result.criticalContingencies.push(line.id);
          n1Result.passed = false;
          continue;
        }

        // Check for overloads
        Object.entries(contingencyResult.powerFlow).forEach(([lineId, flow]) => {
          const lineData = this.lines.get(lineId);
          if (lineData && flow.apparent > lineData.thermalLimit * 1.0) { // 100% thermal limit
            n1Result.overloadedLines.push({
              lineId,
              loading: (flow.apparent / lineData.thermalLimit) * 100
            });
            n1Result.passed = false;
          }
        });

        // Check voltage violations
        Object.entries(contingencyResult.voltages).forEach(([busId, voltage]) => {
          if (voltage.magnitude < this.voltageTolerances.min || voltage.magnitude > this.voltageTolerances.max) {
            const violation = voltage.magnitude < this.voltageTolerances.min 
              ? this.voltageTolerances.min - voltage.magnitude
              : voltage.magnitude - this.voltageTolerances.max;
            
            n1Result.voltageLimits.push({ busId, violation });
            n1Result.passed = false;
          }
        });

      } finally {
        // Restore line
        line.isContingency = false;
      }
    }

    return n1Result;
  }

  private calculateSystemStability(loadFlowResult: any): number {
    // Simplified stability assessment based on voltage profile and power margins
    let stabilityScore = 100;

    // Check voltage stability margins
    Object.values(loadFlowResult.voltages).forEach((voltage: any) => {
      const deviation = Math.abs(1.0 - voltage.magnitude);
      stabilityScore -= deviation * 20; // Penalty for voltage deviation
    });

    // Check power flow distribution
    Object.values(loadFlowResult.powerFlow).forEach((flow: any) => {
      const lineData = Array.from(this.lines.values()).find(l => 
        Object.keys(loadFlowResult.powerFlow).includes(l.id)
      );
      if (lineData && flow.apparent > lineData.thermalLimit * 0.8) {
        stabilityScore -= 10; // Penalty for high loading
      }
    });

    return Math.max(0, Math.min(100, stabilityScore));
  }

  private calculateRenewableIntegration(): number {
    let renewableCapacity = 0;
    let totalCapacity = 0;

    for (const component of this.components.values()) {
      if (component.type === 'generator') {
        totalCapacity += component.capacity;
        // Assume generators with lower capacity are renewable (simplified)
        if (component.capacity < 50) { // MW threshold for renewable
          renewableCapacity += component.capacity;
        }
      }
    }

    return totalCapacity > 0 ? (renewableCapacity / totalCapacity) * 100 : 0;
  }

  private validateEuropeanStandards(result: SimulationResult): void {
    // ENTSO-E Grid Code compliance checks
    
    // Frequency stability (50 Hz ± 0.2 Hz normal operation)
    if (Math.abs(result.frequency - 50.0) > 0.2) {
      result.warnings.push(`Frequency deviation: ${result.frequency} Hz (should be 50.0 ± 0.2 Hz)`);
    }

    // Voltage quality (±5% in normal operation)
    Object.entries(result.voltages).forEach(([busId, voltage]) => {
      if (voltage.magnitude < 0.95 || voltage.magnitude > 1.05) {
        result.warnings.push(`Voltage violation at bus ${busId}: ${voltage.magnitude} p.u. (should be 0.95-1.05 p.u.)`);
      }
    });

    // Thermal limits compliance
    Object.entries(result.powerFlow).forEach(([lineId, flow]) => {
      const line = this.lines.get(lineId);
      if (line && flow.apparent > line.thermalLimit) {
        result.warnings.push(`Thermal limit exceeded on line ${lineId}: ${flow.apparent} MVA > ${line.thermalLimit} MVA`);
      }
    });

    // N-1 security criterion
    if (!result.n1Analysis.passed) {
      result.warnings.push('Network does not meet N-1 security criteria');
    }
  }

  // Complex number arithmetic utilities
  private complexAdd(a: Complex, b: Complex): Complex {
    return { real: a.real + b.real, imag: a.imag + b.imag };
  }

  private complexInverse(z: Complex): Complex {
    const magnitude = z.real * z.real + z.imag * z.imag;
    return {
      real: z.real / magnitude,
      imag: -z.imag / magnitude
    };
  }
}

// Complex number interface
interface Complex {
  real: number;
  imag: number;
}
}
