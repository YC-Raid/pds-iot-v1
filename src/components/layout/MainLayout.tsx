
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopHeader } from "./TopHeader";
import { ProtectedRoute } from "../ProtectedRoute";

export function MainLayout() {
  // Get initial theme from localStorage or default to light
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false; // Default to light mode
  });

  useEffect(() => {
    // Apply dark mode class to html element and save to localStorage
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen w-full flex bg-background">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col">
            <TopHeader isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
            
            <main className="flex-1 p-6 overflow-auto">
              <div className="animate-fade-in">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
