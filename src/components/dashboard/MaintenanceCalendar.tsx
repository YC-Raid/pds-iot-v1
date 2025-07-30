import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  Download,
  Wrench,
  AlertTriangle,
  Filter
} from "lucide-react";
import { DataExport } from "@/components/ui/data-export";

interface MaintenanceTask {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed";
  assignee: string;
  equipment: string;
  type: "routine" | "emergency" | "predictive";
}

const sampleTasks: MaintenanceTask[] = [
  {
    id: 1,
    title: "Temperature Sensor Calibration",
    description: "Calibrate all temperature sensors in Zone A",
    dueDate: "2024-01-15",
    priority: "high",
    status: "pending",
    assignee: "John Smith",
    equipment: "TempSensor-001 to TempSensor-005",
    type: "routine"
  },
  {
    id: 2,
    title: "Air Quality Monitor Cleaning", 
    description: "Clean PM2.5 and PM10 sensors",
    dueDate: "2024-01-18",
    priority: "medium",
    status: "in-progress",
    assignee: "Sarah Johnson",
    equipment: "AQM-001, AQM-002",
    type: "routine"
  },
  {
    id: 3,
    title: "Humidity Sensor Replacement",
    description: "Replace faulty humidity sensor in Zone C",
    dueDate: "2024-01-12", 
    priority: "high",
    status: "completed",
    assignee: "Mike Davis",
    equipment: "HumSensor-012",
    type: "emergency"
  }
];

export function MaintenanceCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<MaintenanceTask[]>(sampleTasks);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [showQR, setShowQR] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success/10 text-success";
      case "in-progress": return "bg-warning/10 text-warning";  
      case "pending": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "in-progress": return <Clock className="w-4 h-4" />;
      case "pending": return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "routine": return <Clock className="h-4 w-4" />;
      case "emergency": return <AlertTriangle className="h-4 w-4" />;
      case "predictive": return <Wrench className="h-4 w-4" />;
      default: return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const handleEditTask = (task: MaintenanceTask) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleDeleteTask = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const currentUrl = `${window.location.origin}/?tab=maintenance`;
  
  // Get upcoming tasks (next 7 days)
  const upcomingTasks = tasks
    .filter(task => {
      const taskDate = new Date(task.dueDate);
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return taskDate >= today && taskDate <= nextWeek && task.status !== 'completed';
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Maintenance Schedule</h2>
          <p className="text-muted-foreground">
            Manage sensor maintenance tasks and schedules
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowQR(!showQR)}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={handleAddTask} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Export Data Section */}
      {showQR && (
        <Card className="relative">
          <GlowingEffect
            spread={30}
            glow={true}
            disabled={false}
            proximity={48}
            inactiveZone={0.01}
          />
          <CardHeader>
            <CardTitle>Export Sensor Data</CardTitle>
            <CardDescription>
              Export sensor data for analysis and sharing with your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataExport 
              title="Sensor Data Export"
              description="Select a sensor and time period to export historical data as PDF or Excel files"
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar View */}
        <Card className="relative">
          <GlowingEffect
            spread={30}
            glow={true}
            disabled={false}
            proximity={48}
            inactiveZone={0.01}
          />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Schedule Calendar
            </CardTitle>
            <CardDescription>
              Click on dates to view scheduled tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Task List */}
        <Card className="lg:col-span-2 relative">
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
          />
          <CardHeader>
            <CardTitle>Maintenance Tasks</CardTitle>
            <CardDescription>
              Upcoming and ongoing maintenance activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${getStatusColor(task.status)}`}>
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeIcon(task.type)}
                      <h4 className="font-medium">{task.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant={getPriorityColor(task.priority) as any}>
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Assignee: {task.assignee}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTask(task)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Tasks Summary */}
      <Card className="relative">
        <GlowingEffect
          spread={30}
          glow={true}
          disabled={false}
          proximity={48}
          inactiveZone={0.01}
        />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming This Week
          </CardTitle>
          <CardDescription>
            Tasks scheduled for the next 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingTasks.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeIcon(task.type)}
                    <h5 className="font-medium text-sm">{task.title}</h5>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>📅 {new Date(task.dueDate).toLocaleDateString()}</p>
                    <p>👤 {task.assignee}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <Badge variant={getPriorityColor(task.priority) as any}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No upcoming maintenance tasks for this week
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit Task" : "Add New Task"}
            </DialogTitle>
            <DialogDescription>
              {editingTask ? "Update the maintenance task details." : "Create a new maintenance task for your equipment."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                placeholder="Enter task title"
                defaultValue={editingTask?.title || ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter task description"
                defaultValue={editingTask?.description || ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  defaultValue={editingTask?.dueDate || ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={editingTask?.priority || "medium"}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Input
                id="assignee"
                placeholder="Enter assignee name"
                defaultValue={editingTask?.assignee || ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="equipment">Equipment</Label>
              <Input
                id="equipment"
                placeholder="Enter equipment identifiers"
                defaultValue={editingTask?.equipment || ""}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>
              {editingTask ? "Update Task" : "Add Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}