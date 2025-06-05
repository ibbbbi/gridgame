export interface Point {
  x: number;
  y: number;
}

export type ComponentType = 'generator' | 'substation' | 'load';
export type LineType = 'transmission-line' | 'distribution-line' | 'hvdc-line';
export type NetworkType = 'radial' | 'meshed';
export type VoltageLevel = 400 | 220 | 110 | 50 | 20 | 10; // European voltage levels in kV

export interface GridComponent {
  id: string;
  type: ComponentType;
  position: Point;
  capacity: number; // MW
  cost: number;
  connections: string[]; // IDs of connected components
  voltage: VoltageLevel; // kV - European standard levels
  isActive: boolean;
  // AC power flow parameters
  activePower: number; // MW
  reactivePower: number; // MVAr
  voltageMagnitude: number; // per unit (0.95-1.05)
  voltageAngle: number; // degrees
  frequency: number; // Hz (50 Hz European standard)
}

export interface PowerLine {
  id: string;
  type: LineType;
  from: string; // Component ID
  to: string; // Component ID
  length: number; // km
  cost: number;
  capacity: number; // MVA (apparent power)
  // AC circuit parameters
  resistance: number; // Ohms per km
  reactance: number; // Ohms per km
  susceptance: number; // Siemens per km
  thermalLimit: number; // MVA
  isActive: boolean;
  // N-1 contingency status
  isContingency: boolean; // If this line is out for N-1 analysis
}

export interface GridStats {
  budget: number;
  totalGeneration: number;
  totalLoad: number;
  loadServed: number;
  efficiency: number;
  reliability: number;
}

// AC Bus Data for power flow calculations
export interface ACBusData {
  id: string;
  type: 'slack' | 'pv' | 'pq'; // Slack (reference), PV (generator), PQ (load)
  activePower: number; // MW
  reactivePower: number; // MVAr
  voltageMagnitude: number; // per unit
  voltageAngle: number; // radians
  minVoltage: number; // per unit
  maxVoltage: number; // per unit
}

// AC Line Data for power flow calculations
export interface ACLineData {
  id: string;
  fromBus: string;
  toBus: string;
  resistance: number; // per unit
  reactance: number; // per unit
  susceptance: number; // per unit
  thermalLimit: number; // MVA
  isActive: boolean;
}

// N-1 Contingency Analysis Result
export interface N1AnalysisResult {
  contingencyLine: string;
  success: boolean;
  overloadedLines: string[];
  voltageViolations: string[];
  loadShed: number; // MW
}

export interface SimulationResult {
  success: boolean;
  loadServed: number;
  efficiency: number;
  reliability: number;
  powerFlow: { [lineId: string]: number };
  voltages: { [componentId: string]: number };
  errors: string[];
  // Enhanced European grid simulation results
  n1Analysis: N1AnalysisResult[];
  frequency: number;
  systemStability: boolean;
  renewableIntegration: number; // percentage
  warnings: string[];
  // Additional AC power flow results
  convergence: boolean;
  iterations: number;
  maxPowerMismatch: number;
  totalLosses: number; // MW
  voltageProfile: { [busId: string]: { magnitude: number; angle: number; } };
  lineLoading: { [lineId: string]: { loading: number; limit: number; percentage: number; } };
}
