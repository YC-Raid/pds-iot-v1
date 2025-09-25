
import { Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { NotificationBell } from "@/components/ui/notification-bell";
import { useNavigate } from "react-router-dom";
import { DataSourceToggle } from "@/components/ui/data-source-toggle";

interface TopHeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export function TopHeader({ isDarkMode, toggleDarkMode }: TopHeaderProps) {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const { profile, getInitials } = useUserProfile();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="hover:bg-accent z-50" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Hangar Guardian Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Real-time IoT monitoring system
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DataSourceToggle />
          <NotificationBell />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            className="hover:bg-accent"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile ? getInitials(profile.nickname) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.nickname || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    Role: {profile?.role || 'viewer'}
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/profile')}>Profile</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
