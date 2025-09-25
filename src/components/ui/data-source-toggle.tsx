import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Database, TestTube } from 'lucide-react';
import { useDataSource } from '@/contexts/DataSourceContext';
import { toast } from '@/hooks/use-toast';

export const DataSourceToggle: React.FC = () => {
  const { dataSource, setDataSource, isUsingMockData } = useDataSource();

  const handleToggle = (checked: boolean) => {
    const newSource = checked ? 'mock_sensor_dataset' : 'processed_sensor_readings';
    setDataSource(newSource);
    
    toast({
      title: "Data Source Changed",
      description: `Switched to ${checked ? 'Mock Dataset' : 'Real-time RDS Dataset'}`,
    });
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg border bg-card">
      <div className="flex items-center gap-2">
        {isUsingMockData ? (
          <TestTube className="h-4 w-4 text-accent" />
        ) : (
          <Database className="h-4 w-4 text-primary" />
        )}
        <Badge variant={isUsingMockData ? "secondary" : "default"} className="text-xs">
          {isUsingMockData ? 'Mock' : 'Live'}
        </Badge>
      </div>
      
      <Switch
        checked={isUsingMockData}
        onCheckedChange={handleToggle}
      />
    </div>
  );
};