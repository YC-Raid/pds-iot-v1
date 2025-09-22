// Quick test of mock data generation
import { generateMockSensorData, findDataGaps } from './mockDataGenerator';

// Test the mock data generation
const startDate = new Date('2025-09-11T00:00:00.000Z');
const endDate = new Date('2025-09-17T23:59:59.999Z');

console.log('Testing mock data generation...');
const mockData = generateMockSensorData(startDate, endDate, 12);
console.log(`Generated ${mockData.length} mock readings`);
console.log('Sample:', mockData[0]);

// Test gap detection
const existingData = [
  { recorded_at: '2025-09-10T23:55:00.000Z' },
  { recorded_at: '2025-09-18T11:37:14.000Z' }
];

const gaps = findDataGaps(existingData, new Date('2025-09-10'), new Date('2025-09-18'));
console.log('Found gaps:', gaps);

export { mockData, gaps };