import { useState, useEffect } from "react";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { DataExport } from "@/components/ui/data-export";

interface MaintenanceTask {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed";
  assignee_id: string | null;
  assignee_name?: string;
  equipment: string | null;
  task_type: "routine" | "emergency" | "predictive";
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface UserProfile {
  user_id: string;
  nickname: string;
}

export function MaintenanceCalendar() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [showQR, setShowQR] = useState(false);
  
  // Filtering and sorting state
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "priority">("date");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium" as "low" | "medium" | "high",
    status: "pending" as "pending" | "in-progress" | "completed",
    assignee_id: "",
    equipment: "",
    task_type: "routine" as "routine" | "emergency" | "predictive"
  });

  // Fetch user profiles
  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nickname')
        .order('nickname');
      
      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }
      
      setProfiles(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Fetch maintenance tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select(`
          *,
          profiles:assignee_id (
            nickname
          )
        `)
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching tasks:', error);
        toast.error('Failed to load maintenance tasks');
        return;
      }
      
      // Transform data to include assignee name
      const transformedTasks: MaintenanceTask[] = data?.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        priority: task.priority as "low" | "medium" | "high",
        status: task.status as "pending" | "in-progress" | "completed",
        assignee_id: task.assignee_id,
        assignee_name: (task.profiles as any)?.nickname || 'Unassigned',
        equipment: task.equipment,
        task_type: task.task_type as "routine" | "emergency" | "predictive",
        created_by: task.created_by,
        created_at: task.created_at,
        updated_at: task.updated_at,
        completed_at: task.completed_at
      })) || [];
      
      setTasks(transformedTasks);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load maintenance tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchTasks();
  }, []);

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
      case "completed": return "bg-success/10 text-success border-success/20";
      case "in-progress": return "bg-warning/10 text-warning border-warning/20";  
      case "pending": return "bg-muted/10 text-muted-foreground border-muted/20";
      default: return "bg-muted/10 text-muted-foreground border-muted/20";
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
    setFormData({
      title: "",
      description: "",
      due_date: selectedDate ? selectedDate.toISOString().split('T')[0] : "",
      priority: "medium",
      status: "pending",
      assignee_id: "unassigned",
      equipment: "",
      task_type: "routine"
    });
    setIsDialogOpen(true);
  };

  const handleEditTask = (task: MaintenanceTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      due_date: task.due_date,
      priority: task.priority,
      status: task.status,
      assignee_id: task.assignee_id || "unassigned",
      equipment: task.equipment || "",
      task_type: task.task_type
    });
    setIsDialogOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const { error } = await supabase
        .from('maintenance_tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        toast.error('Failed to delete task');
        return;
      }

      toast.success('Task deleted successfully');
      fetchTasks();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.due_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const taskData = {
        ...formData,
        assignee_id: formData.assignee_id === "unassigned" ? null : formData.assignee_id,
        created_by: user?.id,
        completed_at: formData.status === 'completed' ? new Date().toISOString() : null
      };

      if (editingTask) {
        const { error } = await supabase
          .from('maintenance_tasks')
          .update(taskData)
          .eq('id', editingTask.id);

        if (error) {
          console.error('Error updating task:', error);
          toast.error('Failed to update task');
          return;
        }

        toast.success('Task updated successfully');
      } else {
        const { error } = await supabase
          .from('maintenance_tasks')
          .insert([taskData]);

        if (error) {
          console.error('Error creating task:', error);
          toast.error('Failed to create task');
          return;
        }

        toast.success('Task created successfully');
      }

      setIsDialogOpen(false);
      fetchTasks();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save task');
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  // Get upcoming tasks (next 7 days) with filtering and sorting
  const upcomingTasks = tasks
    .filter(task => {
      const taskDate = new Date(task.due_date);
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const isInTimeRange = taskDate >= today && taskDate <= nextWeek && task.status !== 'completed';
      
      if (!isInTimeRange) return false;
      
      // Filter by task type
      if (filterType !== "all" && task.task_type !== filterType) return false;
      
      // Filter by priority
      if (filterPriority !== "all" && task.priority !== filterPriority) return false;
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      } else {
        // Sort by priority (high -> medium -> low)
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
    });

  // Get tasks for selected date
  const tasksForSelectedDate = selectedDate ? tasks.filter(task => {
    const taskDate = new Date(task.due_date);
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
    return selectedDateOnly.getTime() === taskDateOnly.getTime();
  }) : [];

  // Create modifiers for task types on calendar
  const routineDates = tasks
    .filter(task => task.task_type === 'routine')
    .map(task => new Date(task.due_date));
  
  const emergencyDates = tasks
    .filter(task => task.task_type === 'emergency')
    .map(task => new Date(task.due_date));
  
  const predictiveDates = tasks
    .filter(task => task.task_type === 'predictive')
    .map(task => new Date(task.due_date));

  if (loading) {
    return <div className="p-6">Loading maintenance tasks...</div>;
  }

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem onClick={() => setFilterType("all")}>
                All Task Types
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("routine")}>
                Routine Tasks Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("emergency")}>
                Emergency Tasks Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("predictive")}>
                Predictive Tasks Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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
        <Card>
          <CardHeader>
            <CardTitle>Export Maintenance Data</CardTitle>
            <CardDescription>
              Export maintenance data for analysis and sharing with your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataExport 
              title="Maintenance Data Export"
              description="Select a time period to export maintenance task data as PDF or Excel files"
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Schedule Calendar
            </CardTitle>
            <CardDescription>
              Click dates to view scheduled tasks. Color indicators show task types.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <style>{`
              .calendar-routine::after {
                content: '';
                position: absolute;
                bottom: 2px;
                left: 50%;
                transform: translateX(-50%);
                width: 6px;
                height: 6px;
                background: hsl(var(--primary));
                border-radius: 50%;
              }
              
              .calendar-emergency::after {
                content: '';
                position: absolute;
                bottom: 2px;
                left: 50%;
                transform: translateX(-50%);
                width: 6px;
                height: 6px;
                background: hsl(var(--destructive));
                border-radius: 50%;
              }
              
              .calendar-predictive::after {
                content: '';
                position: absolute;
                bottom: 2px;
                left: 50%;
                transform: translateX(-50%);
                width: 6px;
                height: 6px;
                background: hsl(var(--warning));
                border-radius: 50%;
              }
              
              .calendar-multiple::after {
                content: '';
                position: absolute;
                bottom: 2px;
                left: 50%;
                transform: translateX(-50%);
                width: 8px;
                height: 6px;
                background: linear-gradient(90deg, hsl(var(--primary)) 33%, hsl(var(--destructive)) 33% 66%, hsl(var(--warning)) 66%);
                border-radius: 3px;
              }
            `}</style>
            
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border"
                modifiers={{
                  routine: routineDates,
                  emergency: emergencyDates,
                  predictive: predictiveDates
                }}
                modifiersClassNames={{
                  routine: "calendar-routine",
                  emergency: "calendar-emergency", 
                  predictive: "calendar-predictive"
                }}
              />
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span>Routine</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-destructive"></div>
                <span>Emergency</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-warning"></div>
                <span>Predictive</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedDate ? `Tasks for ${selectedDate.toLocaleDateString()}` : 'All Maintenance Tasks'}
            </CardTitle>
            <CardDescription>
              {selectedDate ? 'Tasks scheduled for the selected date' : 'Upcoming and ongoing maintenance activities'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(selectedDate ? tasksForSelectedDate : tasks).map((task) => (
              <div
                key={task.id}
                className="group flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 hover:text-accent-foreground transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${getStatusColor(task.status)}`}>
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeIcon(task.task_type)}
                      <h4 className="font-medium">{task.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground group-hover:text-accent-foreground/80">{task.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant={getPriorityColor(task.priority) as any}>
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/70">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/70">
                        Assignee: {task.assignee_name || 'Unassigned'}
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
            {(selectedDate ? tasksForSelectedDate : tasks).length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                {selectedDate ? 'No tasks scheduled for this date' : 'No maintenance tasks found'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Tasks Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming This Week
                {(filterType !== "all" || filterPriority !== "all") && (
                  <Badge variant="secondary" className="ml-2">
                    Filtered ({upcomingTasks.length})
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Tasks scheduled for the next 7 days {filterType !== "all" ? `• ${filterType} tasks` : ''} {filterPriority !== "all" ? `• ${filterPriority} priority` : ''}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {/* Priority Filter */}
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Sort Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortBy(sortBy === "date" ? "priority" : "date")}
                className="flex items-center gap-1"
              >
                {sortBy === "date" ? (
                  <>
                    <CalendarIcon className="h-4 w-4" />
                    Date
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    Priority
                  </>
                )}
                <ArrowUpDown className="h-3 w-3" />
              </Button>
              
              {/* Clear Filters */}
              {(filterType !== "all" || filterPriority !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterType("all");
                    setFilterPriority("all");
                  }}
                  className="text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingTasks.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {upcomingTasks.map((task, index) => {
                const daysUntilDue = Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const isOverdue = daysUntilDue < 0;
                const isDueToday = daysUntilDue === 0;
                const isDueTomorrow = daysUntilDue === 1;
                
                return (
                  <div 
                    key={task.id} 
                    className={`border rounded-lg p-3 transition-all hover:shadow-md cursor-pointer ${
                      isOverdue ? 'border-destructive/50 bg-destructive/5' : 
                      isDueToday ? 'border-warning/50 bg-warning/5' : 
                      isDueTomorrow ? 'border-primary/50 bg-primary/5' : ''
                    }`}
                    onClick={() => handleEditTask(task)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {sortBy === "priority" && (
                        <div className="text-xs font-mono text-muted-foreground">
                          #{index + 1}
                        </div>
                      )}
                      {getTypeIcon(task.task_type)}
                      <h5 className="font-medium text-sm flex-1">{task.title}</h5>
                      {isOverdue && <ArrowDown className="h-3 w-3 text-destructive" />}
                      {isDueToday && <AlertCircle className="h-3 w-3 text-warning" />}
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1">
                        📅 {new Date(task.due_date).toLocaleDateString()}
                        <span className={`font-medium ${
                          isOverdue ? 'text-destructive' : 
                          isDueToday ? 'text-warning' : 
                          isDueTomorrow ? 'text-primary' : ''
                        }`}>
                          {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` :
                           isDueToday ? 'Due today' :
                           isDueTomorrow ? 'Due tomorrow' :
                           `${daysUntilDue} days left`}
                        </span>
                      </p>
                      <p>👤 {task.assignee_name || 'Unassigned'}</p>
                      {task.equipment && <p>🔧 {task.equipment}</p>}
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <Badge 
                        variant={getPriorityColor(task.priority) as any}
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <div className={`w-2 h-2 rounded-full ${
                          task.task_type === 'routine' ? 'bg-primary' :
                          task.task_type === 'emergency' ? 'bg-destructive' :
                          'bg-warning'
                        }`}></div>
                        {task.task_type}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-muted-foreground">
                {filterType !== "all" || filterPriority !== "all" 
                  ? "No tasks match your current filters" 
                  : "No upcoming maintenance tasks for this week"}
              </p>
              {(filterType !== "all" || filterPriority !== "all") && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setFilterType("all");
                    setFilterPriority("all");
                  }}
                  className="mt-2"
                >
                  Clear filters to see all tasks
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
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
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter task description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border z-50">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border z-50">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="taskType">Task Type</Label>
                <Select 
                  value={formData.task_type} 
                  onValueChange={(value) => setFormData({ ...formData, task_type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border z-50">
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="predictive">Predictive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assignee">Assigned To</Label>
              <Select 
                value={formData.assignee_id} 
                onValueChange={(value) => setFormData({ ...formData, assignee_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.user_id} value={profile.user_id}>
                      {profile.nickname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="equipment">Equipment</Label>
              <Input
                id="equipment"
                placeholder="Enter equipment identifiers"
                value={formData.equipment}
                onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingTask ? "Update Task" : "Add Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}