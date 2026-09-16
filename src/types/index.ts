// src/types/index.ts
// REQ-SEN-1, REQ-SEN-2, REQ-ML-3, REQ-ALT-1, REQ-ALT-3

export interface Reading {
  _id?: string;
  sensorId: string;
  raw: number; // 0–1023 (MQ2 analog reading)
  temperature: number; // °C (DHT11)
  humidity: number; // % (DHT11)
  deviceTime: string | number; // millis or ISO
  serverTime: string; // ISO timestamp
  rate_of_change_gas?: number;
  rate_of_change_hum?: number;
  rate_of_change_temp?: number;
  rolling_avg_gas?: number;
  classification?: Classification;
}

export type ClassificationLabel = "Normal" | "Background Interference" | "Genuine Leak";
export type Severity = "low" | "medium" | "high";

export interface Classification {
  readingId?: string;
  label: ClassificationLabel;
  confidence: number; // 0.0 – 1.0 (REQ-ML-3)
  factors: string[]; // Plain-language factor explanations (REQ-ML-4)
  severity: Severity; // REQ-ALT-1
  isLowConfidenceOverride?: boolean; // True if confidence < 0.75 overridden to Genuine Leak
}

export interface Alert {
  _id: string;
  classificationId?: string;
  classification: Classification;
  readingSnapshot?: {
    raw: number;
    temperature: number;
    humidity: number;
    timestamp: string;
  };
  channel: "network" | "local";
  status: "active" | "acknowledged" | "suppressed";
  createdAt: string; // ISO timestamp
  acknowledgedAt?: string; // ISO timestamp
  escalationCount?: number;
}

export interface CaregiverLink {
  _id: string;
  residentId: string;
  residentName: string;
  residentAddress: string;
  caregiverId: string;
  caregiverName: string;
  caregiverPhone: string;
  relationship: string;
  active: boolean;
  linkedAt: string;
}

export interface CalibrationStats {
  totalReadings: number;
  labelledSamples: number;
  modelAccuracy: number;
  falseAlarmReductionRate: number;
  lastRetrainedAt: string;
  confidenceFloor: number;
}

export interface NotificationSettings {
  browserNotificationsEnabled: boolean;
  soundAlertsEnabled: boolean;
  soundVolume: number; // 0 - 100
  escalationIntervalSeconds: number; // 30, 60, 120, 300 (REQ-ALT-3)
  emailEscalationEnabled: boolean;
  smsEscalationEnabled: boolean;
  caregiverPushEnabled: boolean;
  suppressInterferenceAlerts: boolean; // REQ-ALT-2
  dndEnabled: boolean;
  dndStartTime: string; // e.g. "22:00"
  dndEndTime: string; // e.g. "07:00"
  dndBypassForGenuineLeak: boolean; // Non-negotiable safety policy
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
