
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Wrench, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  Filter
} from "lucide-react";

const MaintenanceCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Mock maintenance data
  const maintenanceSchedule = [
    {
      id: 1,
      title: "Monthly Air Quality Sensor Calibration",
      type: "routine",
      priority: "medium",
      date: "2024-01-15",
      time: "09:00",
      duration: "2 hours",
      technician: "John Smith",
      status: "scheduled",
      description: "Calibrate all air quality sensors and check accuracy"
    },
    {
      id: 2,
      title: "Structural Integrity Check",
      type: "inspection",
      priority: "high",
      date: "2024-01-18",
      time: "14:00",
      duration: "4 hours",
      technician: "Sarah Johnson",
      status: "overdue",
      description: "Comprehensive structural assessment of hangar framework"
    },
    {
      id: 3,
      title: "Temperature Sensor Replacement",
      type: "repair",
      priority: "high",
      date: "2024-01-20",
      time: "10:30",
      duration: "1 hour",
      technician: "Mike Davis",
      status: "scheduled",
      description: "Replace faulty temperature sensor in north wall"
    },
    {
      id: 4,
      title: "Quarterly HVAC System Maintenance",
      type: "routine",
      priority: "medium",
      date: "2024-01-25",
      time: "08:00",
      duration: "6 hours",
      technician: "Alex Brown",
      status: "scheduled",
      description: "Full HVAC system inspection and filter replacement"
    },
    {
      id: 5,
      title: "Humidity Control System Check",
      type: "inspection",
      priority: "low",
      date: "2024-01-28",
      time: "11:00",
      duration: "1.5 hours",
      technician: "Lisa Wilson",
      status: "completed",
      description: "Verify humidity control systems are operating within parameters"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-100 border-green-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "scheduled":
        return "text-blue-600 bg-blue-100";
      case "overdue":
        return "text-red-600 bg-red-100";
      case "in-progress":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "routine":
        return <Clock className="h-4 w-4" />;
      case "inspection":
        return <AlertTriangle className="h-4 w-4" />;
      case "repair":
        return <Wrench className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  // Get upcoming tasks (next 7 days)
  const upcomingTasks = maintenanceSchedule
    .filter(task => {
      const taskDate = new Date(task.date);
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return taskDate >= today && taskDate <= nextWeek && task.status !== 'completed';
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Maintenance Schedule</h2>
          <p className="text-muted-foreground">Manage and track all maintenance activities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Schedule Maintenance
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar View */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendar
            </CardTitle>
            <CardDescription>Select a date to view scheduled activities</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Maintenance Schedule List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Scheduled Activities</CardTitle>
            <CardDescription>
              Upcoming and recent maintenance tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {maintenanceSchedule.map((task) => (
                <div key={task.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getTypeIcon(task.type)}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>📅 {task.date}</span>
                          <span>⏰ {task.time}</span>
                          <span>⏱️ {task.duration}</span>
                          <span>👤 {task.technician}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority} priority
                      </Badge>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {task.status === "overdue" && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Tasks Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
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
                    <p>📅 {task.date} at {task.time}</p>
                    <p>👤 {task.technician}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <Badge size="sm" className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge size="sm" className={getStatusColor(task.status)}>
                      {task.status}
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
    </div>
  );
};

export { MaintenanceCalendar };
