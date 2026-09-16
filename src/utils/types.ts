export type ClassificationLabel = 'Normal' | 'Background Interference' | 'Genuine Leak';
export type Severity = 'Low' | 'Medium' | 'High';
export type AlertStatus = 'active' | 'acknowledged' | 'suppressed';

export interface Reading {
  timestamp: string; // ISO string
  raw: number; // 0‑1023
  temperature: number; // °C
  humidity: number; // %
  label: ClassificationLabel;
  confidence: number; // 0‑1
  severity: Severity;
}

export interface Alert {
  id: string;
  timestamp: string;
  label: ClassificationLabel;
  severity: Severity;
  status: AlertStatus;
  confidence: number;
  factors: string[]; // plain‑language explanations
}
