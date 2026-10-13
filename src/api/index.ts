// src/api/index.ts
// REST client connecting directly to SENTINEL hardware bridge backend (REQ-SEN-4, REQ-DASH-2, REQ-ALT-4)

import type { Reading, Alert, CaregiverLink, ClassificationLabel } from "../types";

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

/**
 * Check if the physical hardware is connected via USB serial
 */
export async function getHardwareStatus(): Promise<{
  hardwareConnected: boolean;
  port: string | null;
  sensorSuite: string;
  baudRate: number;
  watchdogStatus: string;
  demoActive?: boolean;
  scenario?: string;
  realDeviceActive?: boolean;
  demoNotice?: string | null;
}> {
  try {
    const res = await fetch(`${baseUrl}/api/hardware/status`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // offline
  }
  return {
    hardwareConnected: false,
    port: null,
    sensorSuite: "MQ2 (A0) + DHT11 (D2)",
    baudRate: 115200,
    watchdogStatus: "Offline / Awaiting Bridge",
    demoActive: false,
    scenario: "normal",
    realDeviceActive: false,
    demoNotice: null
  };
}

/**
 * Fetch latest sensor reading from physical hardware (REQ-SEN-4)
 */
export async function getLatestReading(): Promise<Reading | null> {
  const res = await fetch(`${baseUrl}/api/readings/latest`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Hardware sensor disconnected");
  }
  return await res.json();
}

/**
 * Fetch reading history buffer
 */
export async function getReadingsHistory(limit: number = 20): Promise<Reading[]> {
  try {
    const res = await fetch(`${baseUrl}/api/readings/history?limit=${limit}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }
  return [];
}

/**
 * Fetch alerts history with optional filtering (REQ-DASH-2)
 */
export async function getAlerts(params?: { status?: string; severity?: string }): Promise<Alert[]> {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.severity) query.append("severity", params.severity);

    const res = await fetch(`${baseUrl}/api/alerts?${query.toString()}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }
  return [];
}

/**
 * Acknowledge an alert (REQ-ALT-4)
 */
export async function acknowledgeAlert(alertId: string): Promise<boolean> {
  const res = await fetch(`${baseUrl}/api/alerts/${alertId}/acknowledge`, {
    method: "POST"
  });
  return res.ok;
}

/**
 * Submit manual label for calibration (REQ-ML-1, REQ-ML-2)
 */
export async function labelReading(readingId: string, label: ClassificationLabel): Promise<boolean> {
  const res = await fetch(`${baseUrl}/api/calibration/label`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ readingId, label })
  });
  return res.ok;
}

/**
 * Trigger offline ML model retraining (REQ-ML-5)
 */
export async function retrainModel(): Promise<{ success: boolean; accuracy: number; falsePositiveDrop: number }> {
  const res = await fetch(`${baseUrl}/api/calibration/retrain`, { method: "POST" });
  if (res.ok) {
    return await res.json();
  }
  return {
    success: false,
    accuracy: 0.0,
    falsePositiveDrop: 0.0
  };
}

/**
 * Trigger physical buzzer test command on hardware (Pin D8)
 */
export async function testPhysicalBuzzer(): Promise<boolean> {
  const res = await fetch(`${baseUrl}/api/hardware/test-buzzer`, { method: "POST" });
  return res.ok;
}

/**
 * Caregiver link management (SRS §5.5)
 */
export async function getCaregiverLinks(): Promise<CaregiverLink[]> {
  try {
    const res = await fetch(`${baseUrl}/api/caregivers`);
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return [];
}

export async function toggleCaregiverLink(linkId: string, active: boolean): Promise<boolean> {
  const res = await fetch(`${baseUrl}/api/caregivers/${linkId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ active })
  });
  return res.ok;
}

/**
 * Dataset recording session management
 */
export async function getRecordingStatus(): Promise<{
  isRecording: boolean;
  label: string;
  sampleCount: number;
  filename: string | null;
  recordedFiles: string[];
}> {
  try {
    const res = await fetch(`${baseUrl}/api/recording/status`);
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return {
    isRecording: false,
    label: "normal",
    sampleCount: 0,
    filename: null,
    recordedFiles: []
  };
}

export async function startRecordingSession(label: string = "normal"): Promise<boolean> {
  const res = await fetch(`${baseUrl}/api/recording/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label })
  });
  return res.ok;
}

export async function stopRecordingSession(): Promise<any> {
  const res = await fetch(`${baseUrl}/api/recording/stop`, {
    method: "POST"
  });
  if (res.ok) return await res.json();
  return { success: false };
}

/**
 * Enable synthetic demo readings streaming (rejected if real device active)
 */
export async function enableDemoMode(): Promise<{ ok: boolean; demoActive: boolean; scenario?: string; error?: string }> {
  const res = await fetch(`${baseUrl}/api/demo/enable`, {
    method: "POST"
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to enable demo mode");
  }
  return data;
}

/**
 * Disable synthetic demo readings streaming
 */
export async function disableDemoMode(): Promise<{ ok: boolean; demoActive: boolean }> {
  const res = await fetch(`${baseUrl}/api/demo/disable`, {
    method: "POST"
  });
  return await res.json().catch(() => ({ ok: true, demoActive: false }));
}

/**
 * Switch demo simulation scenario
 */
export async function setDemoScenario(scenario: string): Promise<{ ok: boolean; scenario: string }> {
  const res = await fetch(`${baseUrl}/api/demo/scenario`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario })
  });
  return await res.json();
}

/**
 * Adjust demo simulated packet loss and corruption rates
 */
export async function setDemoLink(lossRate: number, corruptRate: number): Promise<{ ok: boolean; lossRate: number; corruptRate: number }> {
  const res = await fetch(`${baseUrl}/api/demo/link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lossRate, corruptRate })
  });
  return await res.json();
}


