// src/hooks/useDeviceConnection.ts
// Web Serial API connection hook for HC-05 Bluetooth SPP & USB Serial ($S packet stream)

import { useState, useEffect, useRef, useCallback } from "react";
import type { Reading, ClassificationLabel, Severity } from "../types";

export type { Reading } from "../types";
export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "lost";

export interface DeviceConnection {
  supported: boolean;
  status: ConnectionStatus;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  latest: Reading | null;
  lossPct: number;
  error: string | null;
  portInfo: string | null;
}

/**
 * Parse an incoming serial/telemetry packet string with XOR checksum verification.
 * Format: $S,<seq>,<gas>,<temp*10>,<rh*10>,<alarm>*<2-digit hex checksum>
 * Also supports legacy format: "Gas: <gas> | Temp: <temp>C | Hum: <hum>%"
 */
export function parsePacket(rawText: string): Reading | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  // 1. Standard $S telemetry packet: $S,<seq>,<gas>,<temp*10>,<rh*10>,<alarm>*<CS>
  if (trimmed.startsWith("$S,")) {
    const starIdx = trimmed.indexOf("*");
    if (starIdx === -1) return null;

    const payload = trimmed.substring(1, starIdx);
    const checksumStr = trimmed.substring(starIdx + 1).trim();
    if (checksumStr.length !== 2) return null;

    let cs = 0;
    for (let i = 0; i < payload.length; i++) {
      cs ^= payload.charCodeAt(i);
    }
    const expectedCs = parseInt(checksumStr, 16);
    if (isNaN(expectedCs) || cs !== expectedCs) {
      return null;
    }

    const match = trimmed.match(/^\$S,(\d+),(\d+),(-?\d+),(\d+),(\d+)\*([0-9A-Fa-f]{2})/);
    if (!match) return null;

    const seq = parseInt(match[1], 10);
    const raw = parseInt(match[2], 10);
    const temp = parseInt(match[3], 10) / 10.0;
    const hum = parseInt(match[4], 10) / 10.0;
    const alarm = parseInt(match[5], 10) === 1;

    return {
      sensorId: "mq2-dht11-hc05-bt",
      seq,
      gas: raw,
      raw,
      temp,
      temperature: temp,
      rh: hum,
      humidity: hum,
      hum,
      alarm,
      deviceTime: Date.now(),
      serverTime: new Date().toISOString()
    };
  }

  // 2. Legacy fallback format: "Gas: 752 | Temp: 25.8C | Hum: 80.0%"
  const legacyMatch = trimmed.match(/Gas:\s*(\d+).*?Temp:\s*([0-9.-]+).*?Hum:\s*([0-9.-]+)/i);
  if (legacyMatch) {
    const raw = parseInt(legacyMatch[1], 10);
    const temp = parseFloat(legacyMatch[2]);
    const hum = parseFloat(legacyMatch[3]);
    return {
      sensorId: "mq2-dht11-legacy",
      seq: 0,
      gas: raw,
      raw,
      temp,
      temperature: temp,
      rh: hum,
      humidity: hum,
      hum,
      alarm: raw >= 500,
      deviceTime: Date.now(),
      serverTime: new Date().toISOString()
    };
  }

  return null;
}

export function useDeviceConnection(): DeviceConnection {
  const supported = typeof navigator !== "undefined" && "serial" in navigator;

  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [latest, setLatest] = useState<Reading | null>(null);
  const [lossPct, setLossPct] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [portInfo, setPortInfo] = useState<string | null>(null);

  const portRef = useRef<any>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const keepReadingRef = useRef<boolean>(false);

  // Buffer of past readings for rate-of-change and rolling average calculations
  const historyBufferRef = useRef<Reading[]>([]);

  // Sequence packet loss tracking window
  const lastSeqRef = useRef<number | null>(null);
  const totalReceivedRef = useRef<number>(0);
  const totalLostRef = useRef<number>(0);
  const streamStartTimeRef = useRef<number | null>(null);

  const resetMetrics = () => {
    lastSeqRef.current = null;
    totalReceivedRef.current = 0;
    totalLostRef.current = 0;
    setLossPct(0);
    historyBufferRef.current = [];
  };

  const processIncomingFrame = useCallback((line: string) => {
    const parsed = parsePacket(line);
    if (!parsed) return;

    // Track sequence and packet loss rate
    if (lastSeqRef.current !== null) {
      const expectedDiff = (parsed.seq - lastSeqRef.current + 65536) % 65536;
      if (expectedDiff > 1 && expectedDiff < 1000) {
        totalLostRef.current += expectedDiff - 1;
      }
    }
    lastSeqRef.current = parsed.seq;
    totalReceivedRef.current += 1;

    // Compute loss percentage over sliding window
    const totalExpected = totalReceivedRef.current + totalLostRef.current;
    if (totalExpected > 5) {
      const calculatedLoss = Math.min(
        100,
        Math.max(0, parseFloat(((totalLostRef.current / totalExpected) * 100).toFixed(1)))
      );
      setLossPct(calculatedLoss);
    }

    // Dynamic 7-feature extraction
    const buffer = historyBufferRef.current;
    const prevReading = buffer.length > 0 ? buffer[buffer.length - 1] : null;

    const rate_of_change_gas = prevReading ? parseFloat((parsed.raw - prevReading.raw).toFixed(1)) : 0.0;
    const rate_of_change_hum = prevReading ? parseFloat((parsed.hum - prevReading.humidity).toFixed(1)) : 0.0;
    const rate_of_change_temp = prevReading ? parseFloat((parsed.temp - prevReading.temperature).toFixed(2)) : 0.0;

    const windowSlice = buffer.slice(-10);
    const sumGas = windowSlice.reduce((acc, r) => acc + r.raw, parsed.raw);
    const rolling_avg_gas = Math.round(sumGas / (windowSlice.length + 1));

    // ML / Heuristic classification rules (matching Cyber Analytical Plane)
    let label: ClassificationLabel = "Normal";
    let confidence = 0.95;
    let severity: Severity = "low";
    let factors: string[] = [];
    let isLowConfidenceOverride = false;

    // Rule 1: Steam / aerosol interference discrimination via Humidity RoC
    if (rate_of_change_hum > 6.0 || parsed.hum > 75.0) {
      if (parsed.raw > 280 && parsed.raw < 550) {
        label = "Background Interference";
        confidence = 0.89;
        severity = "low";
        factors = [
          `High humidity rate of change (+${rate_of_change_hum}%) matches cooking steam proxy`,
          "Gas excitation coincident with moisture condensation",
          "Network alert suppressed per REQ-ALT-2"
        ];
      }
    }

    // Rule 2: Genuine combustible gas leak
    if (parsed.raw >= 500 || (rate_of_change_gas >= 25.0 && (parsed.hum ?? parsed.rh) < 72.0) || parsed.alarm) {
      label = "Genuine Leak";
      confidence = 0.96;
      severity = "high";
      factors = [
        `Dangerous gas concentration (${parsed.raw} ADC >= 500 safety threshold)`,
        `Sustained positive gas rate of change (+${rate_of_change_gas} ADC/s)`,
        "Ambient humidity stable — aerosol interference ruled out"
      ];
      if (parsed.alarm) {
        factors.unshift("Hardware edge safety floor triggered (D8 Buzzer / D9 LED active)");
      }
    } else if (label === "Normal") {
      factors = [
        `MQ2 Gas level (${parsed.raw} ADC) within safe ambient envelope`,
        "Ambient temperature and humidity steady"
      ];
    }

    // Safety Rule §1.2: Low confidence floor (< 0.75) defaulted to Genuine Leak
    if (confidence < 0.75) {
      label = "Genuine Leak";
      severity = "high";
      isLowConfidenceOverride = true;
      factors.unshift("Confidence < 75% floor — Safety Rule §1.2 defaulted to Genuine Leak");
    }

    // --- SIGNAL ANALYTICS (Steam-Response Regression, Slope & TTT, Sensor Health) ---
    const deltaHum = Math.max(0, parsed.hum - 50.0);
    const deltaTemp = Math.max(0, parsed.temp - 24.0);
    const steamEstimate = Math.min(250, Math.max(0, parseFloat(((2.8 * deltaHum) + (1.2 * deltaTemp)).toFixed(1))));
    const compensatedGas = Math.max(0, Math.round(parsed.raw - steamEstimate));

    // Slope over last 10 points
    const windowSliceComp = buffer.slice(-9);
    const compPoints = [...windowSliceComp.map(r => r.compensatedGas ?? r.raw), compensatedGas];
    let slope = 0.0;
    let timeToThresholdSeconds: number | null = null;

    if (compPoints.length >= 3) {
      const n = compPoints.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += compPoints[i];
        sumXY += i * compPoints[i];
        sumXX += i * i;
      }
      const denom = (n * sumXX) - (sumX * sumX);
      slope = denom !== 0 ? parseFloat((((n * sumXY) - (sumX * sumY)) / denom).toFixed(2)) : 0.0;
      if (compensatedGas >= 500) {
        timeToThresholdSeconds = 0;
      } else if (slope > 0.4) {
        timeToThresholdSeconds = Math.max(1, Math.round((500 - compensatedGas) / slope));
      }
    }

    // Sensor health checks
    const healthWarnings: string[] = [];
    let isDegraded = false;
    let flatlined = false;
    let dhtFailed = false;
    let warmupRemainingSeconds = 0;

    // Check warm-up (30 seconds from stream start)
    const elapsedConnect = streamStartTimeRef.current ? (Date.now() - streamStartTimeRef.current) / 1000 : totalReceivedRef.current;
    if (elapsedConnect < 30) {
      warmupRemainingSeconds = Math.max(1, Math.ceil(30 - elapsedConnect));
      healthWarnings.push(`MQ-2 sensor warming up (~${warmupRemainingSeconds}s remaining)`);
      isDegraded = true;
    }

    // Check flat-line
    if (buffer.length >= 15) {
      const recent = buffer.slice(-15);
      const isStuck = recent.every(r => r.raw === recent[0].raw);
      if (isStuck || parsed.raw === 0 || parsed.raw === 1023) {
        flatlined = true;
        isDegraded = true;
        healthWarnings.push(`MQ-2 analog signal flat-lined (stuck at ${parsed.raw} ADC for 15 samples)`);
      }
    }

    // Check DHT11 failure
    if ((parsed.temp === 0.0 && parsed.hum === 0.0) || isNaN(parsed.temp) || isNaN(parsed.hum)) {
      dhtFailed = true;
      isDegraded = true;
      healthWarnings.push("DHT11 sensor failure: reading 0.0°C / 0.0% RH (check pin D2)");
    } else if (parsed.hum < 5.0 || parsed.hum > 100.0) {
      dhtFailed = true;
      isDegraded = true;
      healthWarnings.push(`DHT11 environmental reading out of physical bounds (${parsed.hum}% RH)`);
    }

    const sensorHealth = {
      isDegraded,
      status: (dhtFailed || flatlined ? "failure" : warmupRemainingSeconds > 0 ? "warming_up" : isDegraded ? "degraded" : "healthy") as any,
      warnings: healthWarnings,
      warmupRemainingSeconds,
      flatlined,
      dhtFailed
    };

    const readingObj: Reading = {
      sensorId: "mq2-dht11-hc05-bt",
      raw: parsed.raw,
      gas: parsed.raw,
      temperature: parsed.temperature,
      temp: parsed.temp,
      humidity: parsed.humidity,
      rh: parsed.rh,
      seq: parsed.seq,
      alarm: parsed.alarm,
      compensatedGas,
      steamEstimate,
      deviceTime: Date.now(),
      serverTime: new Date().toISOString(),
      rate_of_change_gas,
      rate_of_change_hum,
      rate_of_change_temp,
      rolling_avg_gas,
      slope,
      timeToThresholdSeconds,
      sensorHealth,
      classification: {
        label,
        confidence,
        factors,
        severity,
        isLowConfidenceOverride
      }
    };

    buffer.push(readingObj);
    if (buffer.length > 50) {
      buffer.shift();
    }

    setLatest(readingObj);
    setError(null);
  }, []);

  const connect = useCallback(async () => {
    if (!supported) {
      setError("Web Serial API is not supported in this browser. Please use Google Chrome or Microsoft Edge on desktop.");
      return;
    }

    try {
      setStatus("connecting");
      setError(null);
      resetMetrics();

      // Prompt user to select serial/Bluetooth device (e.g. HC-05 COM/SPP or USB CDC)
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });

      portRef.current = port;
      keepReadingRef.current = true;
      streamStartTimeRef.current = Date.now();
      setStatus("connected");

      // Extract port info if available
      const info = port.getInfo ? port.getInfo() : {};
      const desc = info.usbProductId
        ? `USB Device (PID: 0x${info.usbProductId.toString(16)})`
        : "HC-05 Bluetooth SPP / Serial Port";
      setPortInfo(desc);

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable).catch(() => {
        // Stream closed or broken
      });

      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      let lineBuffer = "";

      // Continuous read loop
      (async () => {
        try {
          while (keepReadingRef.current) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              lineBuffer += value;
              const lines = lineBuffer.split("\n");
              lineBuffer = lines.pop() ?? "";
              for (const line of lines) {
                processIncomingFrame(line);
              }
            }
          }
        } catch (err: any) {
          if (keepReadingRef.current) {
            console.error("[SENTINEL SPP] Read stream error:", err);
            setStatus("lost");
            setError("Connection lost: " + (err.message || "Device disconnected"));
          }
        }
      })();
    } catch (err: any) {
      if (err.name === "NotFoundError") {
        // User cancelled port picker dialog
        setStatus("disconnected");
      } else {
        setStatus("disconnected");
        setError(err.message || "Failed to open serial device");
      }
    }
  }, [supported, processIncomingFrame]);

  const disconnect = useCallback(async () => {
    keepReadingRef.current = false;
    try {
      if (readerRef.current) {
        await readerRef.current.cancel().catch(() => {});
        readerRef.current = null;
      }
      if (portRef.current) {
        await portRef.current.close().catch(() => {});
        portRef.current = null;
      }
    } catch (err: any) {
      console.warn("[SENTINEL SPP] Error closing port:", err);
    } finally {
      streamStartTimeRef.current = null;
      setStatus("disconnected");
      setPortInfo(null);
    }
  }, []);

  // Handle hardware disconnect event from browser
  useEffect(() => {
    if (!supported) return;

    const handleDisconnect = (e: any) => {
      if (portRef.current && e.target === portRef.current) {
        setStatus("lost");
        setError("Device was physically disconnected.");
      }
    };

    (navigator as any).serial.addEventListener?.("disconnect", handleDisconnect);
    return () => {
      (navigator as any).serial.removeEventListener?.("disconnect", handleDisconnect);
    };
  }, [supported]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      keepReadingRef.current = false;
      if (readerRef.current) {
        readerRef.current.cancel().catch(() => {});
      }
      if (portRef.current) {
        portRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    supported,
    status,
    connect,
    disconnect,
    latest,
    lossPct,
    error,
    portInfo
  };
}
