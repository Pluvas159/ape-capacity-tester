export interface MeasurementData {
  time: number;
  voltage: number;
  current: number;
  power: number;
}

export interface BatteryStatus {
  voltage: number;
  current: number;
  power: number;
  percentage: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastUpdate: Date;
  error?: string;
}

export interface BatteryDashboardProps {
  initialVoltage?: number;
  initialCurrent?: number;
  maxVoltage?: number;
  minVoltage?: number;
  maxCurrent?: number;
}

export interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    name: string;
  }>;
  label?: string;
}
