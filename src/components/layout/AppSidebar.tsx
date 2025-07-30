
// Navigation sidebar component
import { 
  LayoutDashboard, 
  Calendar, 
  Settings, 
  LogOut, 
  Activity,
  Bell,
  TrendingUp,
  Building,
  Waves,
  Timer,
  User,
  AlertTriangle
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";

const mainItems = [
  { title: "Dashboard", url: "/?tab=overview", icon: LayoutDashboard },
  { title: "Sensors", url: "/?tab=sensors", icon: Activity },
  { title: "Vibration", url: "/?tab=vibration", icon: Waves },
  { title: "Longevity", url: "/?tab=longevity", icon: Timer },
  { title: "Maintenance", url: "/?tab=maintenance", icon: Calendar },
  { title: "Alerts", url: "/?tab=alerts", icon: Bell },
  { title: "Analytics", url: "/?tab=analytics", icon: TrendingUp },
];

const systemItems = [
  { title: "Settings", url: "/?tab=settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { profile, getInitials } = useUserProfile();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    if (path.startsWith("/?")) {
      return currentPath === "/" && location.search.includes(path.split("?")[1]);
    }
    return currentPath === path;
  };
  
  const handleNavigation = (url: string) => {
    navigate(url);
  };

  const getNavClass = (isActiveRoute: boolean) =>
    isActiveRoute 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground";

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} transition-all duration-300`}>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-lg font-semibold text-sidebar-foreground">Hangar Guardian</h2>
              <p className="text-xs text-sidebar-foreground/70">IoT Monitoring System</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                 <SidebarMenuItem key={item.title}>
                   <SidebarMenuButton
                     onClick={() => handleNavigation(item.url)}
                     className={`${getNavClass(isActive(item.url))} rounded-lg cursor-pointer`}
                     title={collapsed ? item.title : undefined}
                   >
                     <item.icon className="w-5 h-5" />
                     {!collapsed && <span className="ml-3">{item.title}</span>}
                   </SidebarMenuButton>
                 </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
               {systemItems.map((item) => (
                 <SidebarMenuItem key={item.title}>
                   <SidebarMenuButton
                     onClick={() => handleNavigation(item.url)}
                     className={`${getNavClass(isActive(item.url))} rounded-lg cursor-pointer`}
                     title={collapsed ? item.title : undefined}
                   >
                     <item.icon className="w-5 h-5" />
                     {!collapsed && <span className="ml-3">{item.title}</span>}
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {profile ? getInitials(profile.nickname) : 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium text-sidebar-foreground">
                {profile?.nickname || 'User'}
              </p>
              <p className="text-xs text-sidebar-foreground/70 capitalize">
                {profile?.role || 'viewer'}
              </p>
            </div>
          )}
        </div>
        {!collapsed && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start mt-2 text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
