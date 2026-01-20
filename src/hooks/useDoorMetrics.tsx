import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DoorTransition {
  id: number;
  recorded_at: string;
  door_status: string;
  prev_door_status: string | null;
}

interface DoorMetrics {
  doorOpensToday: number;
  doorClosesToday: number;
  isLoading: boolean;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

export const useDoorMetrics = (): DoorMetrics => {
  const [doorOpensToday, setDoorOpensToday] = useState(0);
  const [doorClosesToday, setDoorClosesToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDoorTransitions = useCallback(async () => {
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
        .order("recorded_at", { ascending: true });

      if (error) {
        console.error("Error fetching door metrics:", error);
        return;
      }

      if (!data || data.length === 0) {
        setDoorOpensToday(0);
        setDoorClosesToday(0);
        setLastUpdated(new Date());
        return;
      }

      // Count state transitions
      let opens = 0;
      let closes = 0;

      for (let i = 1; i < data.length; i++) {
        const current = data[i];
        const previous = data[i - 1];

        if (current.door_status !== previous.door_status) {
          if (current.door_status === "OPEN") {
            opens++;
          } else if (current.door_status === "CLOSED") {
            closes++;
          }
        }
      }

      setDoorOpensToday(opens);
      setDoorClosesToday(closes);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error in fetchDoorTransitions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and set up real-time subscription
  useEffect(() => {
    fetchDoorTransitions();

    // Set up real-time subscription for new readings
    const channel = supabase
      .channel("door-metrics-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "processed_sensor_readings",
        },
        () => {
          // Refetch when new data arrives
          fetchDoorTransitions();
        }
      )
      .subscribe();

    // Also refresh every 30 seconds as backup
    const interval = setInterval(fetchDoorTransitions, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchDoorTransitions]);

  return {
    doorOpensToday,
    doorClosesToday,
    isLoading,
    lastUpdated,
    refetch: fetchDoorTransitions,
  };
};

export default useDoorMetrics;
