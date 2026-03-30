import { useState, useEffect, useRef, useCallback } from "react";
import { Brain, Coffee, Moon } from "lucide-react";
import { useLocalStorage } from "./useLocalStorage";

export function usePomodoro() {
  const MODES = {
    focus: { label: "Foco", duration: 25 * 60, icon: Brain },
    short: { label: "Pausa curta", duration: 5 * 60, icon: Coffee },
    long:  { label: "Pausa longa", duration: 15 * 60, icon: Moon },
  };

  const [mode, setMode] = useState("focus");
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useLocalStorage("lifeos_sessions", 0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (mode === "focus") setSessions(s => s + 1);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode]);

  const switchMode = useCallback((m) => {
    setMode(m);
    setRunning(false);
    setTimeLeft(MODES[m].duration);
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    setTimeLeft(MODES[mode].duration);
  }, [mode]);

  const toggle = useCallback(() => setRunning(r => !r), []);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;
  const progress = 1 - timeLeft / MODES[mode].duration;

  return { mode, modes: MODES, timeLeft, running, sessions, switchMode, toggle, reset, fmt, progress };
}
