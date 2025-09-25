import React, { createContext, useContext, useState, ReactNode } from 'react';

export type DataSourceType = 'processed_sensor_readings' | 'mock_sensor_dataset';

interface DataSourceContextType {
  dataSource: DataSourceType;
  setDataSource: (source: DataSourceType) => void;
  isUsingMockData: boolean;
}

const DataSourceContext = createContext<DataSourceContextType | undefined>(undefined);

export const useDataSource = () => {
  const context = useContext(DataSourceContext);
  if (context === undefined) {
    throw new Error('useDataSource must be used within a DataSourceProvider');
  }
  return context;
};

interface DataSourceProviderProps {
  children: ReactNode;
}

export const DataSourceProvider: React.FC<DataSourceProviderProps> = ({ children }) => {
  const [dataSource, setDataSource] = useState<DataSourceType>('processed_sensor_readings');

  const value = {
    dataSource,
    setDataSource,
    isUsingMockData: dataSource === 'mock_sensor_dataset',
  };

  return (
    <DataSourceContext.Provider value={value}>
      {children}
    </DataSourceContext.Provider>
  );
};