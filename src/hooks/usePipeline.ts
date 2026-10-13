// src/hooks/usePipeline.ts
// Reusable SENTINEL analysis pipeline hook for live hardware & simulated telemetry

import { useState, useRef, useEffect, useCallback } from "react";
import {
  createPipeline,
  type Analysis,
  type Counters,
  type Cls,
  type Level,
  CFG,
} from "../sim/pipeline";
import type { Reading as DeviceReading } from "../types";

export type HistoryPoint = { raw: number; comp: number; rh: number };

export interface PipelineReadingShape {
  seq: number;
  gas: number;
  temp: number;
  rh: number;
  alarm: boolean;
  t: number;
  [key: string]: unknown;
}

export function mapToPipelineReading(
  r: DeviceReading | (Partial<DeviceReading> & Record<string, unknown>)
): DeviceReading & PipelineReadingShape {
  const raw =
    typeof r.raw === "number"
      ? r.raw
      : typeof (r as Record<string, unknown>).gas === "number"
      ? ((r as Record<string, unknown>).gas as number)
      : 0;
  const gas =
    typeof (r as Record<string, unknown>).gas === "number"
      ? ((r as Record<string, unknown>).gas as number)
      : raw;

  const temperature =
    typeof r.temperature === "number"
      ? r.temperature
      : typeof (r as Record<string, unknown>).temp === "number"
      ? ((r as Record<string, unknown>).temp as number)
      : 25;
  const temp =
    typeof (r as Record<string, unknown>).temp === "number"
      ? ((r as Record<string, unknown>).temp as number)
      : temperature;

  const humidity =
    typeof r.humidity === "number"
      ? r.humidity
      : typeof (r as Record<string, unknown>).rh === "number"
      ? ((r as Record<string, unknown>).rh as number)
      : typeof (r as Record<string, unknown>).hum === "number"
      ? ((r as Record<string, unknown>).hum as number)
      : 50;
  const rh =
    typeof (r as Record<string, unknown>).rh === "number"
      ? ((r as Record<string, unknown>).rh as number)
      : humidity;

  const seq = typeof r.seq === "number" ? r.seq : 0;
  const alarm = Boolean(r.alarm);
  const t =
    typeof (r as Record<string, unknown>).t === "number"
      ? ((r as Record<string, unknown>).t as number)
      : typeof r.deviceTime === "number"
      ? r.deviceTime
      : Date.now();

  return {
    ...r,
    sensorId: r.sensorId || "node-1",
    raw,
    gas,
    temperature,
    temp,
    humidity,
    rh,
    seq,
    alarm,
    deviceTime: r.deviceTime ?? t,
    serverTime: r.serverTime ?? new Date().toISOString(),
    t,
  } as DeviceReading & PipelineReadingShape;
}

export interface UsePipelineResult {
  analysis: Analysis | null;
  history: HistoryPoint[];
  counters: Counters;
  ack: () => void;
  reset: () => void;
  // Proxy properties from Analysis for direct access
  cls?: Cls;
  level?: Level;
  calibrating?: boolean;
  calibProgress?: number;
  baseline?: number;
  compensated?: number;
  residual?: number;
  slope?: number;
  rhSlope?: number;
  timeToDanger?: number | null;
  naiveAlarm?: boolean;
  smartAlarm?: boolean;
  saturated?: boolean;
  alarmTicks?: number;
  events?: string[];
}

export function usePipeline(
  reading: DeviceReading | (Partial<DeviceReading> & Record<string, unknown>) | null | undefined,
  truth: "benign" | "hazard" = "benign"
): UsePipelineResult {
  const pipeRef = useRef(createPipeline());
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [counters, setCounters] = useState<Counters>({
    naiveFalse: 0,
    naiveTrue: 0,
    smartFalse: 0,
    smartTrue: 0,
  });
  const lastProcessedRef = useRef<unknown>(null);
  const lastSeqRef = useRef<number | null>(null);

  const ack = useCallback(() => {
    pipeRef.current.ack();
    setAnalysis((prev) => (prev ? { ...prev, level: "ACKNOWLEDGED" } : null));
  }, []);

  const reset = useCallback(() => {
    pipeRef.current = createPipeline();
    setAnalysis(null);
    setHistory([]);
    setCounters({ naiveFalse: 0, naiveTrue: 0, smartFalse: 0, smartTrue: 0 });
    lastProcessedRef.current = null;
    lastSeqRef.current = null;
  }, []);

  useEffect(() => {
    if (!reading) return;
    if (lastProcessedRef.current === reading) return;
    lastProcessedRef.current = reading;

    // Reset pipeline if device sequence resets
    if (lastSeqRef.current !== null && lastSeqRef.current > 5 && reading.seq === 0) {
      pipeRef.current = createPipeline();
    }
    if (typeof reading.seq === "number") {
      lastSeqRef.current = reading.seq;
    }

    const mapped = mapToPipelineReading(reading);
    const result = pipeRef.current.process(mapped, truth);

    setAnalysis(result);
    setCounters({ ...pipeRef.current.counters });
    setHistory((prev) => [
      ...prev,
      { raw: mapped.gas, comp: result.compensated, rh: mapped.rh },
    ].slice(-90));
  }, [reading, truth]);

  return {
    analysis,
    history,
    counters,
    ack,
    reset,
    ...analysis,
  };
}

export { CFG };
