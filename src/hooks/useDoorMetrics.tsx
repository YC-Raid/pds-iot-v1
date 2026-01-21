import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DoorMetrics {
  totalEntriesToday: number;
  currentDoorStatus: "OPEN" | "CLOSED" | null;
  doorOpenedAt: Date | null;
  isLoading: boolean;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

export const useDoorMetrics = (): DoorMetrics => {
  const [totalEntriesToday, setTotalEntriesToday] = useState(0);
  const [currentDoorStatus, setCurrentDoorStatus] = useState<"OPEN" | "CLOSED" | null>(null);
  const [doorOpenedAt, setDoorOpenedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDoorMetrics = useCallback(async () => {
    try {
      // Get start of today in local timezone
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Fetch all readings from today with door_status, ordered by recorded_at
      const { data, error } = await supabase
        .from("processed_sensor_readings")
        .select("id, recorded_at, door_status")
        .gte("recorded_at", todayISO)
        .order("recorded_at", { ascending: false })
        .limit(500);

      if (error) {
        console.error("Error fetching door metrics:", error);
        return;
      }

      if (!data || data.length === 0) {
        setTotalEntriesToday(0);
        setCurrentDoorStatus(null);
        setDoorOpenedAt(null);
        setLastUpdated(new Date());
        return;
      }

      // Get current door status from the latest reading
      const latestReading = data[0];
      const latestStatus = (latestReading.door_status as "OPEN" | "CLOSED") || "CLOSED";
      setCurrentDoorStatus(latestStatus);

      // Reverse for chronological order to count transitions
      const chronologicalData = [...data].reverse();

      // Count complete entry cycles (CLOSED -> OPEN transitions = someone entered)
      let entries = 0;
      for (let i = 1; i < chronologicalData.length; i++) {
        const current = chronologicalData[i];
        const previous = chronologicalData[i - 1];

        if (current.door_status === "OPEN" && previous.door_status === "CLOSED") {
          entries++;
        }
      }

      setTotalEntriesToday(entries);

      // Find when door opened (if currently open)
      if (latestStatus === "OPEN") {
        // Find the most recent transition to OPEN
        let openedAt: Date | null = null;
        for (let i = 0; i < data.length; i++) {
          const current = data[i];
          const next = data[i + 1];
          
          if (current.door_status === "OPEN") {
            if (!next || next.door_status === "CLOSED") {
              openedAt = new Date(current.recorded_at);
              break;
            }
          } else {
            break;
          }
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
          const newReading = payload.new as { door_status?: string; recorded_at?: string };
          if (newReading.door_status) {
            setCurrentDoorStatus(newReading.door_status as "OPEN" | "CLOSED");
            setLastUpdated(new Date());
            
            // If door just opened, set the opened time
            if (newReading.door_status === "OPEN") {
              setDoorOpenedAt(new Date(newReading.recorded_at || Date.now()));
            } else {
              setDoorOpenedAt(null);
            }
          }
          // Refetch to update entry count
          fetchDoorMetrics();
        }
      )
      .subscribe();

    // Also refresh every 10 seconds as backup (reduced from 30s for faster updates)
    const interval = setInterval(fetchDoorMetrics, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchDoorMetrics]);

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
