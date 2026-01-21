-- Create sensor_readings table in Supabase
CREATE TABLE IF NOT EXISTS sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    device_id TEXT,
    temperature REAL,
    humidity REAL,
    gas_analog INTEGER,
    gas_digital INTEGER
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_id ON sensor_readings(device_id);

-- Enable Row Level Security (optional, for future auth)
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations (adjust based on your auth needs)
CREATE POLICY "Allow all operations" ON sensor_readings
    FOR ALL
    USING (true)
    WITH CHECK (true);
