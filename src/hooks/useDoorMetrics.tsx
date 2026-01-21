import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DoorMetrics {
  totalEntriesToday: number;
  currentDoorStatus: "OPEN" | "CLOSED" | null;
  doorOpenedAt: Date | null;
  isLoading: boolean;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

// Check if current time is within night mode (restricted hours)
const isWithinNightMode = (nightModeStart: string, nightModeEnd: string): boolean => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = nightModeStart.split(":").map(Number);
  const [endHour, endMin] = nightModeEnd.split(":").map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  // Handle overnight periods (e.g., 23:00 to 06:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
};

// Get security settings from localStorage
const getSecuritySettings = () => {
  try {
    const stored = localStorage.getItem("hangar-security-settings");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to read security settings:", e);
  }
  return { nightModeStart: "23:00", nightModeEnd: "06:00", maxOpenDurationSeconds: 300 };
};

export const useDoorMetrics = (): DoorMetrics => {
  const [totalEntriesToday, setTotalEntriesToday] = useState(0);
  const [currentDoorStatus, setCurrentDoorStatus] = useState<"OPEN" | "CLOSED" | null>(null);
  const [doorOpenedAt, setDoorOpenedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isSyncingRef = useRef(false);
  const disableSyncRef = useRef(false);
  const lastSyncAttemptMsRef = useRef(0);
  const lastAlertSentRef = useRef<number>(0); // Track when we last sent an alert

  // Send intrusion alert email via edge function
  const sendIntrusionAlert = useCallback(async (readingId?: number, openedAt?: Date) => {
    // Throttle alerts - only send once every 5 minutes
    const now = Date.now();
    if (now - lastAlertSentRef.current < 5 * 60 * 1000) {
      console.log("🚨 Intrusion alert throttled (already sent recently)");
      return;
    }

    try {
      console.log("🚨 Sending intrusion alert email via security-alert edge function...");
      console.log("🚨 Request payload:", { alert_type: "intrusion", reading_id: readingId, door_opened_at: openedAt?.toISOString() });
      
      const { data, error } = await supabase.functions.invoke("security-alert", {
        body: {
          alert_type: "intrusion",
          reading_id: readingId,
          door_opened_at: openedAt?.toISOString(),
        },
      });

      if (error) {
        console.error("❌ INTRUSION ALERT FAILED - Edge function error:", error);
        console.error("❌ Error details:", JSON.stringify(error, null, 2));
        return;
      }

      // Check if the response indicates failure
      if (data && data.success === false) {
        console.error("❌ INTRUSION ALERT FAILED - API error:", data.error);
        return;
      }

      lastAlertSentRef.current = now;
      console.log("✅ Intrusion alert sent successfully!");
      console.log("✅ Response:", JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("❌ INTRUSION ALERT EXCEPTION:", err);
      console.error("❌ Stack trace:", err instanceof Error ? err.stack : "No stack available");
    }
  }, []);

  const fetchDoorMetrics = useCallback(async () => {
    try {
      // Rolling 24h window (matches "24 hour day" expectation and avoids timezone edge cases)
      const sinceISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // 1) Fetch latest door status quickly
      const { data: latestRow, error: latestError } = await supabase
        .from("processed_sensor_readings")
        .select("recorded_at, door_status")
        .gte("recorded_at", sinceISO)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError) {
        console.error("Error fetching latest door status:", latestError);
        return;
      }

      const latestStatus = (latestRow?.door_status as "OPEN" | "CLOSED" | undefined) ?? "CLOSED";
      setCurrentDoorStatus(latestStatus);

      // 2) Fetch all door statuses in the last 24h (paginate to avoid hidden caps)
      const pageSize = 1000;
      let from = 0;
      const all: Array<{ recorded_at: string; door_status: string | null }> = [];

      while (true) {
        const { data, error } = await supabase
          .from("processed_sensor_readings")
          .select("recorded_at, door_status")
          .gte("recorded_at", sinceISO)
          .order("recorded_at", { ascending: true })
          .range(from, from + pageSize - 1);

        if (error) {
          console.error("Error fetching door history page:", error);
          return;
        }

        if (!data || data.length === 0) break;
        all.push(...data);

        if (data.length < pageSize) break;
        from += pageSize;

        // Safety guard (prevents runaway loops if something goes wrong)
        if (from > 20000) break;
      }

      if (all.length === 0) {
        setTotalEntriesToday(0);
        setDoorOpenedAt(null);
        setLastUpdated(new Date());
        return;
      }

      // Count CLOSED -> OPEN transitions over the last 24h
      let entries = 0;
      for (let i = 1; i < all.length; i++) {
        const prev = all[i - 1]?.door_status ?? "CLOSED";
        const curr = all[i]?.door_status ?? "CLOSED";
        if (prev === "CLOSED" && curr === "OPEN") entries++;
      }
      setTotalEntriesToday(entries);

      // Find when the door last opened (if currently open)
      if (latestStatus === "OPEN") {
        let openedAt: Date | null = null;

        // Walk backwards to find last CLOSED, then the next OPEN is the start of this open period.
        for (let i = all.length - 1; i >= 0; i--) {
          const status = all[i]?.door_status ?? "CLOSED";
          if (status === "CLOSED") {
            const candidate = all[i + 1];
            if (candidate?.door_status === "OPEN") {
              openedAt = new Date(candidate.recorded_at);
            }
            break;
          }
        }

        // If the door has been OPEN for the entire 24h window
        if (!openedAt && all[0]?.door_status === "OPEN") {
          openedAt = new Date(all[0].recorded_at);
        }

        setDoorOpenedAt(openedAt);
      } else {
        setDoorOpenedAt(null);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error in fetchDoorMetrics:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const maybeSyncFromRds = useCallback(async () => {
    if (disableSyncRef.current) return;
    if (isSyncingRef.current) return;

    // Throttle sync attempts - 5 seconds for faster door updates
    const now = Date.now();
    if (now - lastSyncAttemptMsRef.current < 5_000) return;
    lastSyncAttemptMsRef.current = now;

    try {
      isSyncingRef.current = true;
      const { error } = await supabase.functions.invoke("sync-rds-data", { body: {} });

      if (error) {
        // If the user isn't an admin, stop trying (expected 403)
        const msg = String(error.message ?? "");
        if (msg.includes("403") || msg.toLowerCase().includes("admin")) {
          disableSyncRef.current = true;
        }
        console.warn("RDS sync attempt failed:", error);
        return;
      }

      await fetchDoorMetrics();
    } finally {
      isSyncingRef.current = false;
    }
  }, [fetchDoorMetrics]);

  // Initial fetch and set up real-time subscription
  useEffect(() => {
    fetchDoorMetrics();

    // Set up real-time subscription for new readings - this makes door status update immediately
    const channel = supabase
      .channel("door-metrics-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "processed_sensor_readings",
        },
        (payload) => {
          console.log("🚪 Real-time door update received:", payload.new);
          // Immediately update door status from the new record
          const newReading = payload.new as { id?: number; door_status?: string; recorded_at?: string };
          if (newReading.door_status) {
            const prevStatus = currentDoorStatus;
            setCurrentDoorStatus(newReading.door_status as "OPEN" | "CLOSED");
            setLastUpdated(new Date());
            
            // If door just opened, set the opened time
            if (newReading.door_status === "OPEN") {
              const openedTime = new Date(newReading.recorded_at || Date.now());
              setDoorOpenedAt(openedTime);
              
              // 🚨 INTRUSION CHECK: Door opened during night mode
              const settings = getSecuritySettings();
              if (isWithinNightMode(settings.nightModeStart, settings.nightModeEnd)) {
                console.log("🚨 INTRUSION DETECTED: Door opened during restricted hours!");
                sendIntrusionAlert(newReading.id, openedTime);
              }
            } else {
              setDoorOpenedAt(null);
            }
          }
          // Refetch to update entry count
          fetchDoorMetrics();
        }
      )
      .subscribe();

    // Fast refresh (3s) + opportunistic RDS sync for near-real-time door status
    const interval = setInterval(() => {
      fetchDoorMetrics();
      maybeSyncFromRds();
    }, 3_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchDoorMetrics, sendIntrusionAlert, currentDoorStatus]);

  return {
    totalEntriesToday,
    currentDoorStatus,
    doorOpenedAt,
    isLoading,
    lastUpdated,
    refetch: fetchDoorMetrics,
  };
};

export default useDoorMetrics;
