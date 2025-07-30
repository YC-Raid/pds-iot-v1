-- Insert dummy alert data spanning 1-30 days with P1-P4 priorities

INSERT INTO public.alerts (
    title, description, severity, category, equipment, location, sensor, status, 
    value, threshold, unit, priority, created_at, assigned_to, acknowledged_by, 
    resolved_by, dismissed_by, impact, root_cause, corrective_actions
) VALUES
-- P1 Critical Alerts (1-7 days old)
(
    'Critical Temperature Spike in Zone A',
    'Temperature sensor readings exceeded critical threshold of 45°C in storage zone A',
    'critical', 'environmental', 'TempSensor-001', 'Zone A', 'Temperature Sensor', 'escalated',
    '48.5', '45.0', '°C', 'P1', NOW() - INTERVAL '1 day',
    'John Smith', 'Sarah Johnson', NULL, NULL,
    'High - Risk of equipment damage and product deterioration',
    'HVAC system malfunction', ARRAY['Emergency cooling activated', 'HVAC technician dispatched']
),
(
    'Humidity Control System Failure',
    'Critical humidity levels detected - system unable to maintain safe storage conditions',
    'critical', 'equipment', 'HumidityController-01', 'Zone B', 'Humidity Sensor', 'in-progress',
    '85.2', '60.0', '%', 'P1', NOW() - INTERVAL '3 days',
    'Mike Davis', 'Mike Davis', NULL, NULL,
    'Critical - Product quality at risk',
    'Dehumidifier pump failure', ARRAY['Backup dehumidifier activated', 'Replacement pump ordered']
),
(
    'Vibration Anomaly - Critical Equipment',
    'Excessive vibration detected in primary cooling compressor',
    'critical', 'equipment', 'Compressor-Primary', 'Equipment Room', 'Vibration Sensor', 'acknowledged',
    '12.8', '5.0', 'mm/s', 'P1', NOW() - INTERVAL '5 days',
    'Alex Turner', 'Alex Turner', NULL, NULL,
    'High - Potential equipment failure',
    'Bearing wear detected', ARRAY['Scheduled maintenance moved up', 'Vibration monitoring increased']
),

-- P2 High Priority Alerts (3-15 days old)
(
    'Air Quality Index Deterioration',
    'Air quality readings showing elevated particulate matter in Zone C',
    'high', 'environmental', 'AirQualitySensor-03', 'Zone C', 'Air Quality Monitor', 'resolved',
    '180', '150', 'AQI', 'P2', NOW() - INTERVAL '4 days',
    'Lisa Chen', 'Lisa Chen', 'Lisa Chen', NULL,
    'Medium - Potential health concerns for staff',
    'Filter replacement overdue', ARRAY['HEPA filters replaced', 'Ventilation system cleaned']
),
(
    'Pressure Fluctuation in Storage System',
    'Storage pressure readings showing irregular patterns outside normal range',
    'high', 'system', 'PressureSystem-01', 'Storage Tank 1', 'Pressure Sensor', 'in-progress',
    '1025.5', '1013.25', 'hPa', 'P2', NOW() - INTERVAL '7 days',
    'Emma Wilson', 'Emma Wilson', NULL, NULL,
    'Medium - Storage system efficiency reduced',
    'Pressure relief valve malfunction', ARRAY['Valve inspection scheduled', 'Backup pressure monitoring active']
),
(
    'Electrical System Voltage Irregularity',
    'Voltage fluctuations detected in main electrical panel',
    'high', 'electrical', 'MainPanel-01', 'Electrical Room', 'Voltage Monitor', 'acknowledged',
    '245.8', '240.0', 'V', 'P2', NOW() - INTERVAL '10 days',
    'David Rodriguez', 'David Rodriguez', NULL, NULL,
    'Medium - Risk of equipment damage',
    'Grid instability', ARRAY['UPS backup engaged', 'Power company notified']
),
(
    'Temperature Sensor Calibration Drift',
    'Temperature sensor showing calibration drift beyond acceptable limits',
    'high', 'equipment', 'TempSensor-005', 'Zone D', 'Temperature Sensor', 'resolved',
    '22.8', '20.0', '°C', 'P2', NOW() - INTERVAL '12 days',
    'Rachel Green', 'Rachel Green', 'Rachel Green', NULL,
    'Low - Monitoring accuracy affected',
    'Sensor aging', ARRAY['Sensor recalibrated', 'Replacement scheduled']
),

-- P3 Medium Priority Alerts (10-25 days old)
(
    'Routine Maintenance Window Approaching',
    'Scheduled maintenance window for HVAC system approaching deadline',
    'medium', 'maintenance', 'HVAC-System-01', 'Mechanical Room', 'System Monitor', 'active',
    'N/A', 'N/A', '', 'P3', NOW() - INTERVAL '15 days',
    'Tom Anderson', NULL, NULL, NULL,
    'Low - Preventive maintenance required',
    'Scheduled maintenance due', ARRAY['Maintenance team notified', 'Parts inventory verified']
),
(
    'Storage Door Sensor Intermittent',
    'Door sensor showing intermittent connection issues',
    'medium', 'equipment', 'DoorSensor-02', 'Main Entrance', 'Door Sensor', 'acknowledged',
    'N/A', 'N/A', '', 'P3', NOW() - INTERVAL '18 days',
    'Kevin Park', 'Kevin Park', NULL, NULL,
    'Low - Security monitoring affected',
    'Sensor connection loose', ARRAY['Sensor connection checked', 'Replacement ordered']
),
(
    'Backup Generator Test Required',
    'Monthly backup generator test cycle due for execution',
    'medium', 'electrical', 'BackupGen-01', 'Generator Room', 'System Monitor', 'resolved',
    'N/A', 'N/A', '', 'P3', NOW() - INTERVAL '20 days',
    'Steven Clarke', 'Steven Clarke', 'Steven Clarke', NULL,
    'Low - Backup power readiness',
    'Routine testing required', ARRAY['Generator test completed', 'Performance logged']
),
(
    'Network Connectivity Intermittent',
    'Sensor network showing occasional connectivity drops',
    'medium', 'system', 'NetworkSwitch-01', 'IT Room', 'Network Monitor', 'in-progress',
    '95.2', '99.0', '%', 'P3', NOW() - INTERVAL '22 days',
    'Anna Martinez', 'Anna Martinez', NULL, NULL,
    'Low - Data collection interrupted',
    'Network switch aging', ARRAY['Network diagnostics run', 'Switch replacement planned']
),

-- P4 Low Priority Alerts (15-30 days old)
(
    'Sensor Battery Level Low',
    'Wireless sensor battery approaching replacement threshold',
    'low', 'equipment', 'WirelessSensor-08', 'Zone E', 'Battery Monitor', 'active',
    '15', '20', '%', 'P4', NOW() - INTERVAL '25 days',
    'Grace Thompson', NULL, NULL, NULL,
    'Very Low - Sensor will continue operating',
    'Battery depletion', ARRAY['Battery replacement scheduled']
),
(
    'Software Update Available',
    'New firmware version available for environmental monitoring system',
    'info', 'system', 'MonitoringSystem-01', 'Control Room', 'System Monitor', 'acknowledged',
    'v2.1.3', 'v2.0.8', '', 'P4', NOW() - INTERVAL '28 days',
    'Paul Williams', 'Paul Williams', NULL, NULL,
    'Very Low - Enhanced features available',
    'Software update cycle', ARRAY['Update testing scheduled']
),
(
    'Calibration Certificate Expiring',
    'Temperature sensor calibration certificate expiring in 30 days',
    'low', 'maintenance', 'TempSensor-003', 'Zone B', 'Calibration Monitor', 'dismissed',
    'N/A', 'N/A', '', 'P4', NOW() - INTERVAL '30 days',
    'Jennifer Lee', 'Jennifer Lee', NULL, 'Jennifer Lee',
    'Very Low - Documentation update required',
    'Certificate expiration', ARRAY['Recalibration scheduled']
),
(
    'Data Archive Storage 80% Full',
    'Historical data storage approaching capacity limit',
    'low', 'system', 'DataServer-01', 'Server Room', 'Storage Monitor', 'resolved',
    '80.5', '85.0', '%', 'P4', NOW() - INTERVAL '29 days',
    'Chris Johnson', 'Chris Johnson', 'Chris Johnson', NULL,
    'Very Low - Archival process available',
    'Normal data accumulation', ARRAY['Old data archived', 'Storage cleaned']
);