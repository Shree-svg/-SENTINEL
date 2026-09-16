import { useEffect, useRef } from 'react';

export function usePolling<T>(callback: () => Promise<T>, intervalMs: number, onData: (data: T) => void) {
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const run = async () => {
      try {
        const data = await callback();
        if (isMounted.current) onData(data);
      } catch (e) {
        console.error(e);
      }
    };
    run();
    const timer = setInterval(run, intervalMs);
    return () => {
      isMounted.current = false;
      clearInterval(timer);
    };
  }, [callback, intervalMs, onData]);
}
