
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { MainLayout } from "./components/layout/MainLayout";
import DashboardHome from "./pages/DashboardHome";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import CriticalAlert from "./pages/CriticalAlert";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import SensorDetail from "./pages/SensorDetail";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useSensorData, isDataFresh } from "./hooks/useSensorData";

const queryClient = new QueryClient();

const App = () => {
  const { sensorReadings } = useSensorData();
  const latestReading = sensorReadings[0];
  const dataIsFresh = latestReading ? isDataFresh(latestReading.recorded_at) : false;

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SidebarProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="sensor/:sensorType" element={<SensorDetail />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="/alert/:alertId" element={<CriticalAlert />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SidebarProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
