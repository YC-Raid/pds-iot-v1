import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, FileSpreadsheet, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface SensorData {
  timestamp: string;
  value: number;
  unit: string;
  sensor: string;
}

interface DataExportProps {
  title?: string;
  description?: string;
  className?: string;
}

// Mock sensor data generator
const generateSensorData = (sensorType: string, timeframe: string): SensorData[] => {
  const now = new Date();
  const dataPoints: SensorData[] = [];
  
  let days = 1;
  let interval = 30; // minutes
  
  switch (timeframe) {
    case '1day':
      days = 1;
      interval = 30;
      break;
    case '1week':
      days = 7;
      interval = 120;
      break;
    case '1month':
      days = 30;
      interval = 360;
      break;
  }
  
  const totalPoints = (days * 24 * 60) / interval;
  
  for (let i = 0; i < totalPoints; i++) {
    const timestamp = new Date(now.getTime() - (totalPoints - i) * interval * 60000);
    let value: number;
    let unit: string;
    
    switch (sensorType) {
      case 'temperature':
        value = 20 + Math.random() * 15 + Math.sin(i / 10) * 5;
        unit = '°C';
        break;
      case 'humidity':
        value = 40 + Math.random() * 30 + Math.sin(i / 8) * 10;
        unit = '%';
        break;
      case 'pressure':
        value = 1013 + Math.random() * 20 - 10;
        unit = 'hPa';
        break;
      case 'airquality':
        value = 50 + Math.random() * 200;
        unit = 'AQI';
        break;
      case 'vibration':
        value = Math.random() * 10 + Math.sin(i / 5) * 2;
        unit = 'mm/s';
        break;
      default:
        value = Math.random() * 100;
        unit = '';
    }
    
    dataPoints.push({
      timestamp: timestamp.toISOString(),
      value: Math.round(value * 100) / 100,
      unit,
      sensor: sensorType
    });
  }
  
  return dataPoints;
};

export function DataExport({ title = "Sensor Data Export", description, className = "" }: DataExportProps) {
  const [selectedSensor, setSelectedSensor] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const sensors = [
    { value: 'temperature', label: 'Temperature' },
    { value: 'humidity', label: 'Humidity' },
    { value: 'pressure', label: 'Pressure' },
    { value: 'airquality', label: 'Air Quality' },
    { value: 'vibration', label: 'Vibration' },
  ];

  const timeframes = [
    { value: '1day', label: 'Last 24 Hours' },
    { value: '1week', label: 'Last 7 Days' },
    { value: '1month', label: 'Last 30 Days' },
  ];

  const exportToPDF = async () => {
    if (!selectedSensor || !selectedTimeframe) return;
    
    setIsExporting(true);
    
    try {
      const data = generateSensorData(selectedSensor, selectedTimeframe);
      const sensorLabel = sensors.find(s => s.value === selectedSensor)?.label || selectedSensor;
      const timeframeLabel = timeframes.find(t => t.value === selectedTimeframe)?.label || selectedTimeframe;
      
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Hangar Guardian - Sensor Data Report', 20, 30);
      
      doc.setFontSize(14);
      doc.text(`Sensor: ${sensorLabel}`, 20, 45);
      doc.text(`Time Period: ${timeframeLabel}`, 20, 55);
      doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 20, 65);
      
      // Statistics
      const avgValue = data.reduce((sum, item) => sum + item.value, 0) / data.length;
      const maxValue = Math.max(...data.map(item => item.value));
      const minValue = Math.min(...data.map(item => item.value));
      
      doc.text(`Average: ${avgValue.toFixed(3)} ${data[0]?.unit || ''}`, 20, 80);
      doc.text(`Maximum: ${maxValue.toFixed(3)} ${data[0]?.unit || ''}`, 20, 90);
      doc.text(`Minimum: ${minValue.toFixed(3)} ${data[0]?.unit || ''}`, 20, 100);
      
      // Data table - matching Excel format exactly
      const tableData = data.map(item => [
        format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        item.value.toString(),
        item.unit,
        sensorLabel
      ]);
      
      autoTable(doc, {
        head: [['Timestamp', 'Value', 'Unit', 'Sensor']],
        body: tableData,
        startY: 115,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [51, 51, 51] },
      });
      
      doc.save(`${sensorLabel}_${selectedTimeframe}_report.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async () => {
    if (!selectedSensor || !selectedTimeframe) return;
    
    setIsExporting(true);
    
    try {
      const data = generateSensorData(selectedSensor, selectedTimeframe);
      const sensorLabel = sensors.find(s => s.value === selectedSensor)?.label || selectedSensor;
      
      // Prepare data for Excel
      const excelData = data.map(item => ({
        'Timestamp': format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        'Value': item.value,
        'Unit': item.unit,
        'Sensor': sensorLabel
      }));
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Sensor Data');
      
      // Save file
      XLSX.writeFile(wb, `${sensorLabel}_${selectedTimeframe}_data.xlsx`);
    } finally {
      setIsExporting(false);
    }
  };

  const canExport = selectedSensor && selectedTimeframe && !isExporting;

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sensor Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Sensor</label>
            <Select value={selectedSensor} onValueChange={setSelectedSensor}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a sensor..." />
              </SelectTrigger>
              <SelectContent>
                {sensors.map((sensor) => (
                  <SelectItem key={sensor.value} value={sensor.value}>
                    {sensor.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timeframe Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Time Period</label>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger>
                <SelectValue placeholder="Choose time period..." />
              </SelectTrigger>
              <SelectContent>
                {timeframes.map((timeframe) => (
                  <SelectItem key={timeframe.value} value={timeframe.value}>
                    {timeframe.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={exportToPDF}
              disabled={!canExport}
              className="flex items-center gap-2"
              variant="outline"
            >
              <FileText className="h-4 w-4" />
              Export to PDF
            </Button>
            
            <Button 
              onClick={exportToExcel}
              disabled={!canExport}
              className="flex items-center gap-2"
              variant="outline"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export to Excel
            </Button>
          </div>

          {selectedSensor && selectedTimeframe && (
            <div className="text-sm text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-4 w-4 inline mr-2" />
              Ready to export {sensors.find(s => s.value === selectedSensor)?.label} data for {timeframes.find(t => t.value === selectedTimeframe)?.label.toLowerCase()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}