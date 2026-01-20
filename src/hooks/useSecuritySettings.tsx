import { useState, useEffect, useCallback } from "react";

export interface SecuritySettings {
  nightModeStart: string; // HH:mm format
  nightModeEnd: string; // HH:mm format
  maxOpenDurationSeconds: number;
}

const DEFAULT_SETTINGS: SecuritySettings = {
  nightModeStart: "23:00",
  nightModeEnd: "06:00",
  maxOpenDurationSeconds: 300, // 5 minutes
};

const STORAGE_KEY = "hangar-security-settings";

export const useSecuritySettings = () => {
  const [settings, setSettings] = useState<SecuritySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error("Failed to load security settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: Partial<SecuritySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save security settings:", error);
    }
  }, [settings]);

  // Check if current time is within night mode (restricted hours)
  const isNightMode = useCallback((): boolean => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.nightModeStart.split(":").map(Number);
    const [endHour, endMin] = settings.nightModeEnd.split(":").map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Handle overnight periods (e.g., 23:00 to 06:00)
    if (startMinutes > endMinutes) {
      // Night mode spans midnight
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      // Normal range within same day
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
  }, [settings.nightModeStart, settings.nightModeEnd]);

  // Calculate security status based on door state, time, and duration
  const calculateSecurityStatus = useCallback((
    doorStatus: "OPEN" | "CLOSED",
    doorOpenDurationSeconds: number
  ): {
    status: "intrusion" | "door_open_too_long" | "door_open" | "secure";
    isRedAlert: boolean;
    isAmberWarning: boolean;
  } => {
    if (doorStatus === "CLOSED") {
      return { status: "secure", isRedAlert: false, isAmberWarning: false };
    }

    // Door is OPEN - check conditions
    const inNightMode = isNightMode();
    const exceededMaxDuration = doorOpenDurationSeconds >= settings.maxOpenDurationSeconds;

    // RED ALERT: Door open during night mode OR exceeded max duration
    if (inNightMode) {
      return { status: "intrusion", isRedAlert: true, isAmberWarning: false };
    }

    if (exceededMaxDuration) {
      return { status: "door_open_too_long", isRedAlert: true, isAmberWarning: false };
    }

    // AMBER WARNING: Door open during day, within time limit
    return { status: "door_open", isRedAlert: false, isAmberWarning: true };
  }, [isNightMode, settings.maxOpenDurationSeconds]);

  return {
    settings,
    saveSettings,
    isLoading,
    isNightMode,
    calculateSecurityStatus,
    DEFAULT_SETTINGS,
  };
};

export default useSecuritySettings;
