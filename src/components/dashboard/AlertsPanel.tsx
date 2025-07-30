
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  X, 
  Eye, 
  Clock,
  Thermometer,
  Droplets,
  Wind,
  Zap,
  User,
  MessageSquare,
  TrendingUp,
  Calendar,
  Filter,
  Search,
  MoreHorizontal,
  FileText,
  AlertOctagon,
  Shield,
  Settings,
  Play,
  Pause,
  Users,
  Timer,
  MapPin
} from "lucide-react";

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      title: "Critical Temperature Threshold Breach",
      description: "Temperature sensor reading exceeds maximum safe operating range. Equipment protection systems may activate.",
      severity: "critical",
      category: "environmental",
      equipment: "HVAC System A",
      location: "North Storage Zone",
      sensor: "Temperature Sensor #2",
      timestamp: "2024-01-15T14:30:00Z",
      status: "active",
      value: "42.5°C",
      threshold: "40°C",
      unit: "°C",
      duration: 25,
      impact: "Equipment damage risk",
      assignedTo: null,
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolvedBy: null,
      resolvedAt: null,
      notes: [],
      escalated: false,
      rootCause: null,
      correctiveActions: [],
      icon: Thermometer,
      priority: "P1"
    },
    {
      id: 2,
      title: "Vibration Anomaly Detected",
      description: "Unusual vibration patterns detected on motor assembly. Potential bearing failure indication.",
      severity: "high",
      category: "equipment",
      equipment: "Ventilation Motor #3",
      location: "East Storage Zone",
      sensor: "Vibration Sensor #3",
      timestamp: "2024-01-15T13:45:00Z",
      status: "acknowledged",
      value: "8.2 mm/s",
      threshold: "6.0 mm/s",
      unit: "mm/s",
      duration: 45,
      impact: "Potential equipment failure",
      assignedTo: "John Smith",
      acknowledgedBy: "John Smith",
      acknowledgedAt: "2024-01-15T14:00:00Z",
      resolvedBy: null,
      resolvedAt: null,
      notes: [
        { id: 1, text: "Investigating bearing condition", author: "John Smith", timestamp: "2024-01-15T14:00:00Z" }
      ],
      escalated: false,
      rootCause: null,
      correctiveActions: ["Schedule bearing inspection", "Monitor trend for 24h"],
      icon: Settings,
      priority: "P2"
    },
    {
      id: 3,
      title: "Humidity Level Stabilized",
      description: "Humidity levels have returned to normal operating range after HVAC adjustment.",
      severity: "info",
      category: "environmental",
      equipment: "Climate Control System",
      location: "Central Storage Zone",
      sensor: "Humidity Sensor #1",
      timestamp: "2024-01-15T12:15:00Z",
      status: "resolved",
      value: "55%",
      threshold: "60%",
      unit: "%RH",
      duration: 120,
      impact: "None - Normal operation",
      assignedTo: "Sarah Johnson",
      acknowledgedBy: "Sarah Johnson",
      acknowledgedAt: "2024-01-15T12:20:00Z",
      resolvedBy: "Sarah Johnson",
      resolvedAt: "2024-01-15T13:30:00Z",
      notes: [
        { id: 1, text: "HVAC system adjusted", author: "Sarah Johnson", timestamp: "2024-01-15T12:20:00Z" },
        { id: 2, text: "Levels normalized", author: "Sarah Johnson", timestamp: "2024-01-15T13:30:00Z" }
      ],
      escalated: false,
      rootCause: "HVAC setpoint drift",
      correctiveActions: ["Recalibrated HVAC controls", "Updated maintenance schedule"],
      icon: Droplets,
      priority: "P4"
    },
    {
      id: 4,
      title: "Power Quality Event",
      description: "Voltage fluctuation detected in electrical distribution panel. Monitoring for equipment impact.",
      severity: "medium",
      category: "electrical",
      equipment: "Main Distribution Panel",
      location: "Electrical Room",
      sensor: "Power Quality Monitor",
      timestamp: "2024-01-15T11:20:00Z",
      status: "in-progress",
      value: "218V",
      threshold: "220V ±5%",
      unit: "VAC",
      duration: 15,
      impact: "Monitoring required",
      assignedTo: "Mike Davis",
      acknowledgedBy: "Mike Davis",
      acknowledgedAt: "2024-01-15T11:25:00Z",
      resolvedBy: null,
      resolvedAt: null,
      notes: [
        { id: 1, text: "Checking grid stability", author: "Mike Davis", timestamp: "2024-01-15T11:25:00Z" },
        { id: 2, text: "Contacted utility company", author: "Mike Davis", timestamp: "2024-01-15T11:45:00Z" }
      ],
      escalated: false,
      rootCause: null,
      correctiveActions: ["Monitor for 4 hours", "Document voltage trends"],
      icon: Zap,
      priority: "P3"
    },
    {
      id: 5,
      title: "Preventive Maintenance Due",
      description: "Quarterly sensor calibration and system inspection scheduled for tomorrow.",
      severity: "low",
      category: "maintenance",
      equipment: "All Sensor Systems",
      location: "Facility Wide",
      sensor: "Maintenance Schedule",
      timestamp: "2024-01-15T09:00:00Z",
      status: "active",
      value: "Due: Jan 16, 2024",
      threshold: "90 days",
      unit: "days",
      duration: 0,
      impact: "Scheduled activity",
      assignedTo: "Maintenance Team",
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolvedBy: null,
      resolvedAt: null,
      notes: [],
      escalated: false,
      rootCause: null,
      correctiveActions: ["Schedule maintenance window", "Prepare calibration equipment"],
      icon: Calendar,
      priority: "P4"
    },
    {
      id: 6,
      title: "Air Quality Sensor Offline",
      description: "Communication lost with air quality monitoring station. Backup monitoring activated.",
      severity: "medium",
      category: "system",
      equipment: "Air Quality Monitor #2",
      location: "West Storage Zone",
      sensor: "Air Quality Sensor #2",
      timestamp: "2024-01-15T08:30:00Z",
      status: "escalated",
      value: "No Data",
      threshold: "N/A",
      unit: "AQI",
      duration: 180,
      impact: "Reduced monitoring coverage",
      assignedTo: "Technical Support",
      acknowledgedBy: "Technical Support",
      acknowledgedAt: "2024-01-15T08:35:00Z",
      resolvedBy: null,
      resolvedAt: null,
      notes: [
        { id: 1, text: "Network connectivity issues suspected", author: "Tech Support", timestamp: "2024-01-15T08:35:00Z" },
        { id: 2, text: "Escalated to IT team", author: "Tech Support", timestamp: "2024-01-15T09:00:00Z" }
      ],
      escalated: true,
      rootCause: null,
      correctiveActions: ["Check network cables", "Reset communication module", "Replace if necessary"],
      icon: Shield,
      priority: "P2"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [newNote, setNewNote] = useState("");
  const [assignTo, setAssignTo] = useState("");

  const technicians = [
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
      case "closed":
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

  // Alert actions
  const acknowledgeAlert = (alertId: number, assignedTo?: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            status: "acknowledged",
            acknowledgedBy: "Current User",
            acknowledgedAt: new Date().toISOString(),
            assignedTo: assignedTo || alert.assignedTo
          }
        : alert
    ));
  };

  const startProgress = (alertId: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: "in-progress" }
        : alert
    ));
  };

  const resolveAlert = (alertId: number, rootCause?: string, resolution?: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            status: "resolved",
            resolvedBy: "Current User",
            resolvedAt: new Date().toISOString(),
            rootCause: rootCause || alert.rootCause
          }
        : alert
    ));
  };

  const escalateAlert = (alertId: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: "escalated", escalated: true }
        : alert
    ));
  };

  const addNote = (alertId: number) => {
    if (!newNote.trim()) return;
    
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            notes: [...alert.notes, {
              id: alert.notes.length + 1,
              text: newNote,
              author: "Current User",
              timestamp: new Date().toISOString()
            }]
          }
        : alert
    ));
    setNewNote("");
  };

  const assignAlert = (alertId: number, technician: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, assignedTo: technician }
        : alert
    ));
  };

  const dismissAlert = (alertId: number) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Statistics
  const activeAlerts = filteredAlerts.filter(alert => alert.status === "active");
  const acknowledgedAlerts = filteredAlerts.filter(alert => alert.status === "acknowledged");
  const inProgressAlerts = filteredAlerts.filter(alert => alert.status === "in-progress");
  const escalatedAlerts = filteredAlerts.filter(alert => alert.status === "escalated");
  const resolvedAlerts = filteredAlerts.filter(alert => alert.status === "resolved");
  const criticalAlerts = filteredAlerts.filter(alert => alert.severity === "critical");
  const highPriorityAlerts = filteredAlerts.filter(alert => alert.priority === "P1" || alert.priority === "P2");

  const AlertCard = ({ alert }: { alert: typeof alerts[0] }) => {
    const IconComponent = alert.icon;
    
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
                      {alert.priority}
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

              {alert.assignedTo && (
                <div className="flex items-center gap-1 text-xs">
                  <User className="h-3 w-3" />
                  <span className="font-medium">Assigned to:</span>
                  <span>{alert.assignedTo}</span>
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
                      - {alert.notes[alert.notes.length - 1].author} • {formatTime(alert.notes[alert.notes.length - 1].timestamp)}
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
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" onClick={() => setSelectedAlert(alert)}>
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Alert Details - {alert.title}</DialogTitle>
                  <DialogDescription>
                    Manage alert details, notes, and assignments
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Assign to Technician</Label>
                      <Select 
                        value={assignTo || alert.assignedTo || ""} 
                        onValueChange={(value) => {
                          setAssignTo(value);
                          assignAlert(alert.id, value);
                        }}
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
                    <div className="space-y-2">
                      <Label>Priority Actions</Label>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => dismissAlert(alert.id)}
                          className="flex items-center gap-1"
                        >
                          <X className="h-3 w-3" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Add Note</Label>
                    <div className="flex gap-2 mt-1">
                      <Textarea 
                        placeholder="Add investigation notes, observations, or updates..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => addNote(alert.id)}
                        disabled={!newNote.trim()}
                      >
                        Add Note
                      </Button>
                    </div>
                  </div>
                  
                  {alert.notes.length > 0 && (
                    <div>
                      <Label>Investigation History</Label>
                      <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                        {alert.notes.map(note => (
                          <div key={note.id} className="p-2 bg-muted/50 rounded text-sm">
                            <p>{note.text}</p>
                            <div className="text-muted-foreground text-xs mt-1">
                              {note.author} • {formatTime(note.timestamp)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
