export interface SerialPortInfo {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  locationId?: string;
  vendorId?: string;
  productId?: string;
}

export interface MeasurementData {
  time: string;
  voltage: number;
  current: number;
  loadActive: boolean;
}

export interface ArduinoData {
  voltage: number;
  current_sense: number;
  load_active: boolean;
}

export interface GraphProps {
  dataKey: keyof Omit<MeasurementData, "time" | "loadActive">;
  title: string;
  units: string;
  domain: [number, number];
  color: string;
  data: MeasurementData[];
}

export interface BatteryStatus {
  soc: number | null;
  timeToEmpty: number | null;
  dropRate: number | null;
}
