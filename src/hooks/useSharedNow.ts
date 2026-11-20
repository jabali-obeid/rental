import { useState, useEffect } from 'react';

type Listener = (now: number) => void;

const listeners = new Set<Listener>();
let intervalId: ReturnType<typeof setInterval> | null = null;
let currentNow = Date.now();

function startClockIfNeeded() {
  if (intervalId !== null || listeners.size === 0) return;
  currentNow = Date.now();
  intervalId = setInterval(() => {
    currentNow = Date.now();
    listeners.forEach((listener) => listener(currentNow));
  }, 1000);
}

function stopClockIfIdle() {
  if (listeners.size === 0 && intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/**
 * Subscribes to a single shared 1-second clock across the entire app.
 * Automatically stops the interval when no active subscribers remain.
 */
export function useSharedNow(enabled = true): number {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!enabled) return;

    const listener: Listener = (ts) => setNow(ts);
    listeners.add(listener);
    startClockIfNeeded();

    return () => {
      listeners.delete(listener);
      stopClockIfIdle();
    };
  }, [enabled]);

  return now;
}
