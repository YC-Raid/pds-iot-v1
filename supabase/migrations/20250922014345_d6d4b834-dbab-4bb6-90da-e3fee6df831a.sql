-- First, let's analyze existing data patterns to create realistic mock data
-- Then replace all data with mock data from Sept 1-15, 2025

-- Store some statistics from existing data for realistic ranges
DO $$
DECLARE
    start_date TIMESTAMPTZ := '2025-09-01 00:00:00+08'::timestamptz;
    end_date TIMESTAMPTZ := '2025-09-15 23:59:59+08'::timestamptz;
    current_time TIMESTAMPTZ := start_date;
    counter INTEGER := 1;
BEGIN
    -- Clear existing data
    DELETE FROM public.processed_sensor_readings;
    
    -- Reset the sequence to start from 1
    ALTER SEQUENCE processed_sensor_readings_id_seq RESTART WITH 1;
    
    -- Generate mock data every 5 minutes from Sept 1-15, 2025
    WHILE current_time <= end_date LOOP
        INSERT INTO public.processed_sensor_readings (
            original_id,
            recorded_at,
            temperature,
            humidity,
            pressure,
            gas_resistance,
            pm1_0,
            pm2_5,
            pm10,
            accel_x,
            accel_y,
            accel_z,
            accel_magnitude,
            gyro_x,
            gyro_y,
            gyro_z,
            gyro_magnitude,
            anomaly_score,
            predicted_failure_probability,
            quality_score,
            location,
            maintenance_recommendation,
            processing_version
        ) VALUES (
            counter,
            current_time,
            -- Temperature: 20-35°C with daily variation
            25.0 + 5.0 * sin(EXTRACT(HOUR FROM current_time) * PI() / 12) + (random() - 0.5) * 3.0,
            
            -- Humidity: 40-80% with inverse temperature correlation
            65.0 - 15.0 * sin(EXTRACT(HOUR FROM current_time) * PI() / 12) + (random() - 0.5) * 10.0,
            
            -- Pressure: 1000-1020 hPa with weather patterns
            1013.25 + 5.0 * sin(EXTRACT(DOY FROM current_time) * PI() / 15) + (random() - 0.5) * 3.0,
            
            -- Gas resistance: 10000-50000 ohms
            30000 + 15000 * (random() - 0.5),
            
            -- PM values: realistic air quality levels
            (5 + random() * 10)::INTEGER, -- PM1.0
            (8 + random() * 15)::INTEGER, -- PM2.5
            (12 + random() * 20)::INTEGER, -- PM10
            
            -- Accelerometer data: small vibrations around gravity
            (random() - 0.5) * 0.2, -- accel_x
            (random() - 0.5) * 0.2, -- accel_y
            9.81 + (random() - 0.5) * 0.3, -- accel_z (gravity + noise)
            
            -- Accelerometer magnitude
            sqrt(power((random() - 0.5) * 0.2, 2) + power((random() - 0.5) * 0.2, 2) + power(9.81 + (random() - 0.5) * 0.3, 2)),
            
            -- Gyroscope data: small rotational movements
            (random() - 0.5) * 0.1, -- gyro_x
            (random() - 0.5) * 0.1, -- gyro_y
            (random() - 0.5) * 0.1, -- gyro_z
            
            -- Gyroscope magnitude
            sqrt(power((random() - 0.5) * 0.1, 2) + power((random() - 0.5) * 0.1, 2) + power((random() - 0.5) * 0.1, 2)),
            
            -- Anomaly score: mostly normal with occasional spikes
            CASE WHEN random() > 0.95 THEN random() * 0.8 + 0.2 ELSE random() * 0.2 END,
            
            -- Predicted failure probability: low with occasional increases
            CASE WHEN random() > 0.98 THEN random() * 0.3 + 0.1 ELSE random() * 0.05 END,
            
            -- Quality score: mostly high quality
            (95 + random() * 5)::INTEGER,
            
            'hangar_01',
            
            -- Maintenance recommendations based on anomaly
            CASE 
                WHEN random() > 0.98 THEN 'Schedule inspection within 24 hours'
                WHEN random() > 0.95 THEN 'Monitor closely for changes'
                ELSE NULL
            END,
            
            'v1.0'
        );
        
        -- Increment time by 5 minutes
        current_time := current_time + INTERVAL '5 minutes';
        counter := counter + 1;
        
        -- Commit every 1000 rows to avoid memory issues
        IF counter % 1000 = 0 THEN
            COMMIT;
        END IF;
    END LOOP;
    
    -- Final commit
    COMMIT;
    
    RAISE NOTICE 'Successfully generated % mock sensor readings from % to %', 
                 counter - 1, start_date, end_date;
END $$;