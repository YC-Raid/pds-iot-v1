
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DataExport } from "@/components/ui/data-export";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  AlertOctagon, 
  Play, 
  TrendingUp, 
  Bell, 
  MoreHorizontal, 
  X, 
  FileText, 
  FileSpreadsheet, 
  Filter,
  FileDown,
  Eye,
  UserCheck,
  AlertCircle,
  Thermometer,
  Droplets,
  Wind,
  Zap,
  User,
  MessageSquare,
  Calendar,
  Search,
  Shield,
  Settings,
  Pause,
  Users,
  Timer,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AlertsPanel = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [alertNotes, setAlertNotes] = useState<Record<string, string>>({});
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({});
  const [pendingAssignment, setPendingAssignment] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportTimeframe, setExportTimeframe] = useState("1week");

  // Fetch user profiles from Supabase
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, nickname');
        
        if (error) {
          console.error('Error fetching profiles:', error);
          return;
        }
        
        setProfiles(data || []);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchProfiles();
  }, []);

  // Fetch alerts from Supabase
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { data: alertsData, error: alertsError } = await supabase
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (alertsError) {
          console.error('Error fetching alerts:', alertsError);
          // Fall back to demo data if database is empty
          setAlerts(getDemoAlerts());
          return;
        }

        if (alertsData && alertsData.length > 0) {
          // Fetch notes for each alert
          const alertsWithNotes = await Promise.all(
            alertsData.map(async (alert) => {
              const { data: notesData } = await supabase
                .from('alert_notes')
                .select('*')
                .eq('alert_id', alert.id)
                .order('created_at', { ascending: true });
              
              return {
                ...alert,
                notes: notesData || [],
                icon: getIconForCategory(alert.category)
              };
            })
          );
          setAlerts(alertsWithNotes);
        } else {
          // If no alerts in database, use demo data
          setAlerts(getDemoAlerts());
        }
      } catch (error) {
        console.error('Error:', error);
        setAlerts(getDemoAlerts());
      }
    };

    fetchAlerts();
  }, []);

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'environmental': return Thermometer;
      case 'equipment': return Settings;
      case 'electrical': return Zap;
      case 'system': return Shield;
      case 'maintenance': return Calendar;
      default: return AlertTriangle;
    }
  };

  const getDemoAlerts = () => [
    {
      id: "demo-1",
      title: "Critical Temperature Threshold Breach",
      description: "Temperature sensor reading exceeds maximum safe operating range. Equipment protection systems may activate.",
      severity: "critical",
      category: "environmental",
      equipment: "HVAC System A",
      location: "North Storage Zone",
      sensor: "Temperature Sensor #2",
      created_at: "2024-01-15T14:30:00Z",
      status: "active",
      value: "42.5°C",
      threshold: "40°C",
      unit: "°C",
      duration: 25,
      impact: "Equipment damage risk",
      assigned_to: null,
      acknowledged_by: null,
      acknowledged_at: null,
      resolved_by: null,
      resolved_at: null,
      notes: [],
      escalated: false,
      root_cause: null,
      corrective_actions: [],
      icon: Thermometer,
      priority: "P1"
    }
  ];

  // Use real technicians from Supabase profiles
  const technicians = profiles.length > 0 ? profiles.map(p => p.nickname || `User ${p.user_id.slice(0, 8)}`) : [
    "John Smith",
    "Sarah Johnson", 
    "Mike Davis",
    "Lisa Chen",
    "David Wilson",
    "Emily Rodriguez"
  ];

  // Filter and search logic
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesCategory = categoryFilter === "all" || alert.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
    
    return matchesSearch && matchesSeverity && matchesCategory && matchesStatus;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-destructive bg-destructive/10 border-destructive/20";
      case "high":
        return "text-orange-600 bg-orange-100 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "low":
        return "text-blue-600 bg-blue-100 border-blue-200";
      case "info":
        return "text-muted-foreground bg-muted/50 border-muted";
      default:
        return "text-muted-foreground bg-muted/50 border-muted";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-destructive bg-destructive/10";
      case "acknowledged":
        return "text-yellow-600 bg-yellow-100";
      case "in-progress":
        return "text-blue-600 bg-blue-100";
      case "escalated":
        return "text-orange-600 bg-orange-100";
      case "resolved":
        return "text-green-600 bg-green-100";
      case "dismissed":
        return "text-muted-foreground bg-muted/50";
      default:
        return "text-muted-foreground bg-muted/50";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
  };

  // Alert actions with database updates
  const acknowledgeAlert = async (alertId: string, assignedTo?: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ 
          status: "acknowledged",
          acknowledged_by: "Current User",
          acknowledged_at: new Date().toISOString(),
          assigned_to: assignedTo || null
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              status: "acknowledged",
              acknowledged_by: "Current User",
              acknowledged_at: new Date().toISOString(),
              assigned_to: assignedTo || alert.assigned_to
            }
          : alert
      ));

      toast({
        title: "Alert Acknowledged",
        description: "Alert has been successfully acknowledged."
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert.",
        variant: "destructive"
      });
    }
  };

  const startProgress = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ status: "in-progress" })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: "in-progress" }
          : alert
      ));

      toast({
        title: "Work Started",
        description: "Alert marked as in progress."
      });
    } catch (error) {
      console.error('Error starting progress:', error);
      toast({
        title: "Error",
        description: "Failed to update alert status.",
        variant: "destructive"
      });
    }
  };

  const resolveAlert = async (alertId: string, rootCause?: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ 
          status: "resolved",
          resolved_by: "Current User",
          resolved_at: new Date().toISOString(),
          root_cause: rootCause || null
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              status: "resolved",
              resolved_by: "Current User",
              resolved_at: new Date().toISOString(),
              root_cause: rootCause || alert.root_cause
            }
          : alert
      ));

      toast({
        title: "Alert Resolved",
        description: "Alert has been successfully resolved."
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Error",
        description: "Failed to resolve alert.",
        variant: "destructive"
      });
    }
  };

  const escalateAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ status: "escalated", escalated: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: "escalated", escalated: true }
          : alert
      ));

      toast({
        title: "Alert Escalated",
        description: "Alert has been escalated to higher priority."
      });
    } catch (error) {
      console.error('Error escalating alert:', error);
      toast({
        title: "Error",
        description: "Failed to escalate alert.",
        variant: "destructive"
      });
    }
  };

  const addNote = async (alertId: string, noteText?: string) => {
    const text = noteText || (document.getElementById('note') as HTMLTextAreaElement)?.value;
    if (!text?.trim()) return;
    
    try {
      const { error } = await supabase
        .from('alert_notes')
        .insert({
          alert_id: alertId,
          text: text,
          author_name: "Current User"
        });

      if (error) throw error;

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              notes: [...alert.notes, {
                id: Date.now(),
                text: text,
                author_name: "Current User",
                created_at: new Date().toISOString()
              }]
            }
          : alert
      ));
      
      // Clear the note for this specific alert
      setAlertNotes(prev => ({ ...prev, [alertId]: "" }));
      
      toast({
        title: "Note Added",
        description: "Investigation note has been added."
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note.",
        variant: "destructive"
      });
    }
  };

  const assignAlert = async (alertId: string, technician: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ assigned_to: technician })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, assigned_to: technician }
          : alert
      ));

      toast({
        title: "Alert Assigned",
        description: `Alert assigned to ${technician}.`
      });
    } catch (error) {
      console.error('Error assigning alert:', error);
      toast({
        title: "Error",
        description: "Failed to assign alert.",
        variant: "destructive"
      });
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ 
          status: "dismissed",
          dismissed_by: "Current User",
          dismissed_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      setOpenDialogs(prev => ({ ...prev, [alertId]: false }));

      toast({
        title: "Alert Dismissed",
        description: "Alert has been dismissed and archived."
      });
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast({
        title: "Error",
        description: "Failed to dismiss alert.",
        variant: "destructive"
      });
    }
  };

  // Enhanced export functions with timeframe filtering
  const exportAlertData = async () => {
    setIsExporting(true);
    try {
      let startDate: Date;
      const endDate = new Date();

      switch (exportTimeframe) {
        case '1day':
          startDate = subDays(endDate, 1);
          break;
        case '1week':
          startDate = subDays(endDate, 7);
          break;
        case '1month':
          startDate = subDays(endDate, 30);
          break;
        case '3months':
          startDate = subDays(endDate, 90);
          break;
        default:
          startDate = subDays(endDate, 7);
      }

      // Fetch all alerts including dismissed ones within timeframe
      const { data: alertsData, error } = await supabase
        .from('alerts')
        .select('*')
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const exportData = (alertsData || []).map(alert => ({
        'Alert ID': alert.id,
        'Title': alert.title,
        'Severity': alert.severity.toUpperCase(),
        'Status': alert.status.replace('-', ' ').toUpperCase(),
        'Category': alert.category,
        'Equipment': alert.equipment,
        'Location': alert.location,
        'Assigned To': alert.assigned_to || 'Unassigned',
        'Created': new Date(alert.created_at).toLocaleString(),
        'Acknowledged By': alert.acknowledged_by || 'Not acknowledged',
        'Acknowledged At': alert.acknowledged_at ? new Date(alert.acknowledged_at).toLocaleString() : 'N/A',
        'Resolved By': alert.resolved_by || 'Not resolved',
        'Resolved At': alert.resolved_at ? new Date(alert.resolved_at).toLocaleString() : 'N/A',
        'Dismissed By': alert.dismissed_by || 'Not dismissed',
        'Dismissed At': alert.dismissed_at ? new Date(alert.dismissed_at).toLocaleString() : 'N/A',
        'Value': alert.value || 'N/A',
        'Threshold': alert.threshold || 'N/A',
        'Duration (minutes)': alert.duration || 0,
        'Impact': alert.impact || 'N/A',
        'Priority': alert.priority || 'P4',
        'Root Cause': alert.root_cause || 'Not identified',
        'Corrective Actions': (alert.corrective_actions || []).join('; ')
      }));

      return exportData;
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Error",
        description: "Failed to export alert data.",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsExporting(false);
    }
  };

  // Statistics
  const activeAlerts = filteredAlerts.filter(alert => alert.status === "active");
  const acknowledgedAlerts = filteredAlerts.filter(alert => alert.status === "acknowledged");
  const inProgressAlerts = filteredAlerts.filter(alert => alert.status === "in-progress");
  const escalatedAlerts = filteredAlerts.filter(alert => alert.status === "escalated");
  const resolvedAlerts = filteredAlerts.filter(alert => alert.status === "resolved");
  const criticalAlerts = filteredAlerts.filter(alert => alert.severity === "critical");
  const highPriorityAlerts = filteredAlerts.filter(alert => alert.priority === "P1" || alert.priority === "P2");

  const handleSaveAssignment = async () => {
    if (selectedAlert && pendingAssignment) {
      await assignAlert(selectedAlert.id, pendingAssignment);
      setPendingAssignment("");
      setOpenDialogs(prev => ({ ...prev, [selectedAlert.id]: false }));
    }
  };

  const openDialog = (alertId: string) => {
    setOpenDialogs(prev => ({ ...prev, [alertId]: true }));
  };

  const closeDialog = (alertId: string) => {
    setOpenDialogs(prev => ({ ...prev, [alertId]: false }));
  };

  const AlertCard = ({ alert }: { alert: any }) => {
    const IconComponent = alert.icon || AlertTriangle;
    
    return (
      <Card className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-base">{alert.title}</h4>
                    <Badge className={getSeverityColor(alert.severity)} variant="outline">
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(alert.status)} variant="outline">
                      {alert.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {alert.priority || 'P4'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <Settings className="h-3 w-3" />
                  <span className="font-medium">Equipment:</span>
                  <span>{alert.equipment}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="font-medium">Location:</span>
                  <span>{alert.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span className="font-medium">Value:</span>
                  <span className="font-mono">{alert.value}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">Duration:</span>
                  <span>{formatDuration(alert.duration)}</span>
                </div>
              </div>

              {alert.assigned_to && (
                <div className="flex items-center gap-1 text-xs">
                  <User className="h-3 w-3" />
                  <span className="font-medium">Assigned to:</span>
                  <span>{alert.assigned_to}</span>
                </div>
              )}

              {alert.impact && (
                <div className="flex items-center gap-1 text-xs">
                  <AlertOctagon className="h-3 w-3" />
                  <span className="font-medium">Impact:</span>
                  <span>{alert.impact}</span>
                </div>
              )}

              {alert.notes.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <MessageSquare className="h-3 w-3" />
                    Recent Notes:
                  </div>
                  <div className="text-xs bg-muted/50 p-2 rounded">
                    {alert.notes[alert.notes.length - 1].text}
                    <div className="text-muted-foreground mt-1">
                      - {alert.notes[alert.notes.length - 1].author_name || alert.notes[alert.notes.length - 1].author} • {formatTime(alert.notes[alert.notes.length - 1].created_at || alert.notes[alert.notes.length - 1].timestamp)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            {alert.status === "active" && (
              <>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  Acknowledge
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => escalateAlert(alert.id)}
                  className="flex items-center gap-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Escalate
                </Button>
              </>
            )}
            
            {alert.status === "acknowledged" && (
              <>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => startProgress(alert.id)}
                  className="flex items-center gap-1"
                >
                  <Play className="h-3 w-3" />
                  Start Work
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => resolveAlert(alert.id)}
                  className="flex items-center gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  Resolve
                </Button>
              </>
            )}
            
            {alert.status === "in-progress" && (
              <>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => resolveAlert(alert.id)}
                  className="flex items-center gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  Resolve
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => escalateAlert(alert.id)}
                  className="flex items-center gap-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Escalate
                </Button>
              </>
            )}
            
            {alert.status === "escalated" && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => resolveAlert(alert.id)}
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-3 w-3" />
                Resolve
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Dialog 
              open={openDialogs[alert.id] || false} 
              onOpenChange={(open) => {
                if (open) {
                  openDialog(alert.id);
                  setSelectedAlert(alert);
                  setPendingAssignment(alert.assigned_to || "");
                } else {
                  closeDialog(alert.id);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Alert Details - {alert.title}</DialogTitle>
                  <DialogDescription>
                    Manage alert details, notes, and assignments
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Assign to Technician</Label>
                    <Select 
                      value={pendingAssignment} 
                      onValueChange={setPendingAssignment}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select technician" />
                      </SelectTrigger>
                      <SelectContent>
                        {technicians.map(tech => (
                          <SelectItem key={tech} value={tech}>{tech}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Priority Actions</Label>
                    <div className="flex gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <X className="h-3 w-3" />
                            Dismiss
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Alert Dismissal</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to dismiss this alert? This action cannot be undone and the alert will be permanently archived in the system.
                              <br /><br />
                              <strong>Alert:</strong> {alert.title}
                              <br />
                              <strong>Severity:</strong> {alert.severity.toUpperCase()}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => dismissAlert(alert.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Yes, Dismiss Alert
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="note">Add Note</Label>
                    <Textarea
                      id="note"
                      placeholder="Add investigation notes, observations, or updates..."
                      defaultValue=""
                    />
                    <Button 
                      onClick={() => {
                        const textarea = document.getElementById('note') as HTMLTextAreaElement;
                        if (textarea && textarea.value.trim()) {
                          addNote(alert.id, textarea.value);
                          textarea.value = "";
                        }
                      }}
                      className="w-fit"
                    >
                      Add Note
                    </Button>
                  </div>
                  
                  {alert.notes.length > 0 && (
                    <div className="grid gap-2">
                      <Label>Investigation History</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {alert.notes.map((note: any) => (
                          <div key={note.id} className="p-2 bg-muted/50 rounded text-sm">
                            <p>{note.text}</p>
                            <div className="text-muted-foreground text-xs mt-1">
                              {note.author_name || note.author} • {formatTime(note.created_at || note.timestamp)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => closeDialog(alert.id)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveAssignment}
                    disabled={!pendingAssignment}
                  >
                    Save Assignment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Alert Statistics */}
      <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-7">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertOctagon className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Immediate action required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting acknowledgment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Play className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Being investigated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalated</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{escalatedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Elevated priority</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Completed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Timer className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">8m</div>
            <p className="text-xs text-muted-foreground">Response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MTTR</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">2.4h</div>
            <p className="text-xs text-muted-foreground">Mean time to repair</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Alert Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="environmental">Environmental</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {filteredAlerts.length} alerts found
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Alert Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage system alerts and incidents
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowExport(!showExport)}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Export Data Section */}
      {showExport && (
        <Card className="relative">
          <GlowingEffect
            spread={30}
            glow={true}
            disabled={false}
            proximity={48}
            inactiveZone={0.01}
          />
          <CardHeader>
            <CardTitle>Export Alert Data</CardTitle>
            <CardDescription>
              Export alert audit trail for analysis and reporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label>Export Timeframe</Label>
                  <Select value={exportTimeframe} onValueChange={setExportTimeframe}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1day">Last 24 Hours</SelectItem>
                      <SelectItem value="1week">Last 7 Days</SelectItem>
                      <SelectItem value="1month">Last 30 Days</SelectItem>
                      <SelectItem value="3months">Last 3 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={async () => {
                    const data = await exportAlertData();
                    if (data.length > 0) {
                      const ws = XLSX.utils.json_to_sheet(data);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, 'Alert Audit Trail');
                      XLSX.writeFile(wb, `alert_audit_trail_${exportTimeframe}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
                    }
                  }}
                  className="flex items-center gap-2"
                  variant="outline"
                  disabled={isExporting}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {isExporting ? "Exporting..." : "Export to Excel"}
                </Button>
                
                <Button 
                  onClick={async () => {
                    const data = await exportAlertData();
                    if (data.length > 0) {
                      const doc = new jsPDF({ orientation: 'landscape' });
                      
                      doc.setFontSize(16);
                      doc.text('Alert Audit Trail Report', 20, 20);
                      doc.setFontSize(10);
                      doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 20, 30);
                      doc.text(`Timeframe: ${exportTimeframe}`, 20, 35);
                      
                      const tableData = data.map(row => [
                        row['Alert ID'].toString().substring(0, 8),
                        row['Title'].substring(0, 25) + '...',
                        row['Severity'],
                        row['Status'],
                        row['Assigned To'].substring(0, 15),
                        row['Created'].substring(0, 16),
                        row['Resolved At'] !== 'N/A' ? row['Resolved At'].substring(0, 16) : 'N/A'
                      ]);
                      
                      autoTable(doc, {
                        head: [['ID', 'Title', 'Severity', 'Status', 'Assigned', 'Created', 'Resolved']],
                        body: tableData,
                        startY: 45,
                        styles: { fontSize: 8 },
                        headStyles: { fillColor: [51, 51, 51] },
                      });
                      
                      doc.save(`alert_audit_trail_${exportTimeframe}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
                    }
                  }}
                  className="flex items-center gap-2"
                  variant="outline"
                  disabled={isExporting}
                >
                  <FileText className="h-4 w-4" />
                  {isExporting ? "Exporting..." : "Export to PDF"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Industrial Alert Management System
          </CardTitle>
          <CardDescription>
            Comprehensive IIOT alert monitoring, investigation, and resolution tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                All ({filteredAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Active ({activeAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="acknowledged" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Acknowledged ({acknowledgedAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="in-progress" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                In Progress ({inProgressAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="escalated" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Escalated ({escalatedAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="resolved" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Resolved ({resolvedAlerts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
              ) : (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No alerts match your current filters</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {activeAlerts.length > 0 ? (
                activeAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">No active alerts - all systems operating normally</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="acknowledged" className="space-y-4">
              {acknowledgedAlerts.length > 0 ? (
                acknowledgedAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
              ) : (
                <div className="text-center py-12">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No acknowledged alerts</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="in-progress" className="space-y-4">
              {inProgressAlerts.length > 0 ? (
                inProgressAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
              ) : (
                <div className="text-center py-12">
                  <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No alerts currently in progress</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="escalated" className="space-y-4">
              {escalatedAlerts.length > 0 ? (
                escalatedAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No escalated alerts</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4">
              {resolvedAlerts.length > 0 ? (
                resolvedAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No resolved alerts today</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export { AlertsPanel };
