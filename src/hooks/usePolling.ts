// src/hooks/usePolling.ts
// Generic interval polling hook for real-time telemetry (REQ-SEN-4)

import { useEffect, useState, useRef } from "react";

export function usePolling<T>(fetchFn: () => Promise<T>, intervalMs: number = 2000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const fetchRef = useRef(fetchFn);

  useEffect(() => {
    fetchRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    let isMounted = true;

    const runFetch = async () => {
      try {
        const result = await fetchRef.current();
        if (isMounted) {
          setData(result);
          setLastUpdated(new Date());
          setError(null);
          setIsOnline(true);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to fetch telemetry");
          setIsOnline(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    runFetch();
    const intervalId = setInterval(runFetch, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [intervalMs]);

  return { data, loading, error, lastUpdated, isOnline };
}
