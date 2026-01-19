export enum JointType {
  AXIAL = 'AXIAL',
  LATERAL = 'LATERAL',
  HINGED = 'HINGED',
  GIMBAL = 'GIMBAL',
  PRESSURE_BALANCED = 'PRESSURE_BALANCED'
}

export interface JointConfig {
  id: JointType;
  name: string;
  description: string;
  allowedDeformation: {
    axial: boolean; // Compression/Extension
    lateral: boolean; // Offset
    angular: boolean; // Rotation
  };
  features: string[];
}

export interface SimulationState {
  axial: number; // -100 to 100 (percentage of compression/extension)
  lateral: number; // 0 to 100 (percentage of offset)
  angular: number; // -45 to 45 (degrees)
  showCrossSection: boolean;
  pressure: number; // 0 to 50 bar (visualization effect)
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}