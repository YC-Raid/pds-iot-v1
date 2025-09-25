import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isUsingMockData ? (
                <TestTube className="h-5 w-5 text-accent" />
              ) : (
                <Database className="h-5 w-5 text-primary" />
              )}
              <span className="font-medium">
                {isUsingMockData ? 'Mock Dataset' : 'Real-time RDS Dataset'}
              </span>
            </div>
            <Badge variant={isUsingMockData ? "secondary" : "default"}>
              {isUsingMockData ? 'Demo Data' : 'Live Data'}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">RDS</span>
            <Switch
              checked={isUsingMockData}
              onCheckedChange={handleToggle}
            />
            <span className="text-sm text-muted-foreground">Mock</span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">
          {isUsingMockData 
            ? 'Currently displaying mock sensor data for demonstration purposes'
            : 'Currently displaying real-time data from AWS RDS database'
          }
        </p>
      </CardContent>
    </Card>
  );
};