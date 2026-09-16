// src/hooks/useReadingHistory.ts
// Buffers the last N readings for sparkline trend charts

import { useState, useEffect } from "react";
import type { Reading } from "../types";

export function useReadingHistory(currentReading: Reading | null, bufferSize: number = 24) {
  const [history, setHistory] = useState<number[]>([180, 182, 185, 181, 184, 188, 185]);

  const rawValue = currentReading?.raw;
  const serverTime = currentReading?.serverTime;

  useEffect(() => {
    if (typeof rawValue === "number") {
      setHistory((prev) => {
        const next = [...prev, rawValue];
        if (next.length > bufferSize) {
          return next.slice(next.length - bufferSize);
        }
        return next;
      });
    }
  }, [rawValue, serverTime, bufferSize]);

  return history;
}
