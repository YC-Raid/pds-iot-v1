
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
  DialogTrigger,
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
  Wrench
} from "lucide-react";

interface MaintenanceTask {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed";
  assignee: string;
  equipment: string;
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
    equipment: "TempSensor-001 to TempSensor-005"
  },
  {
    id: 2,
    title: "Air Quality Monitor Cleaning",
    description: "Clean PM2.5 and PM10 sensors",
    dueDate: "2024-01-18",
    priority: "medium",
    status: "in-progress",
    assignee: "Sarah Johnson",
    equipment: "AQM-001, AQM-002"
  },
  {
    id: 3,
    title: "Humidity Sensor Replacement",
    description: "Replace faulty humidity sensor in Zone C",
    dueDate: "2024-01-12",
    priority: "high",
    status: "completed",
    assignee: "Mike Davis",
    equipment: "HumSensor-012"
  }
];

export default function MaintenancePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<MaintenanceTask[]>(sampleTasks);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance Schedule</h1>
          <p className="text-muted-foreground">
            Manage sensor maintenance tasks and schedules
          </p>
        </div>
        <Button onClick={handleAddTask} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Full-width Calendar */}
      <Card className="relative card-shadow">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
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
            className="rounded-md border w-full max-w-4xl"
          />
        </CardContent>
      </Card>

      {/* Task List */}
      <Card className="relative card-shadow">
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
                  <h4 className="font-medium">{task.title}</h4>
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
