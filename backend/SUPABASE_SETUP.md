# Supabase Integration Setup Guide

This guide will help you set up Supabase cloud storage for your sensor data and import the training data.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. Python 3.8+ with pip
3. Your training_data.json file

## Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This will install:
- `supabase==2.3.4` - Supabase Python client
- `psycopg2-binary==2.9.9` - PostgreSQL adapter
- `python-dotenv==1.0.0` - Environment variable management

## Step 2: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: EMD Sensor Data (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is sufficient for development

4. Wait for project to be created (takes ~2 minutes)

## Step 3: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 4: Create Database Table

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `database/supabase_schema.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. Verify the table was created by going to **Table Editor** → `sensor_readings`

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```env
   USE_SUPABASE=true
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key-here
   DB_PATH=sensor_data.db
   ```

   Replace:
   - `your-project.supabase.co` with your actual Project URL
   - `your-anon-key-here` with your actual anon key

## Step 6: Import Training Data

Import your training_data.json to Supabase:

```bash
python import_training_data.py
```

This script will:
- Load all records from `training_data.json`
- Connect to Supabase (if `USE_SUPABASE=true`) or SQLite (if `USE_SUPABASE=false`)
- Import all sensor readings in batches
- Show progress and any errors

**Expected output:**
```
Loading data from training_data.json...
Found 5761 records to import
Metadata: Sensor training data - 4 days of readings (1 per minute)
✓ Connected to Supabase
Progress: 100/5761 records processed (100 imported, 0 errors)
...
✓ Import complete!
  Total records: 5761
  Successfully imported: 5761
  Errors: 0
```

## Step 7: Verify Data Import

1. Go to Supabase dashboard → **Table Editor** → `sensor_readings`
2. You should see all your imported records
3. Check the row count matches your training data

## Step 8: Run the Backend Server

Start the server with Supabase:

```bash
python server.py
```

You should see:
```
✓ Connected to Supabase
✓ Database initialized (supabase)
```

## Switching Between SQLite and Supabase

To switch back to SQLite for local development:

1. Edit `.env`:
   ```env
   USE_SUPABASE=false
   ```

2. Restart the server

The database abstraction layer automatically handles the switch!

## Migration from SQLite to Supabase

If you have existing SQLite data and want to migrate it:

1. Set up Supabase (Steps 1-5 above)
2. Make sure `.env` has `USE_SUPABASE=true`
3. Run migration script:
   ```bash
   python migrate_to_supabase.py
   ```

## Troubleshooting

### Error: "SUPABASE_URL and SUPABASE_KEY must be set"
- Make sure your `.env` file exists and has the correct values
- Check that there are no extra spaces or quotes around the values

### Error: "Connection refused" or "Timeout"
- Verify your Supabase URL is correct
- Check your internet connection
- Ensure your Supabase project is active (not paused)

### Error: "relation 'sensor_readings' does not exist"
- Run the SQL schema from `database/supabase_schema.sql` in Supabase SQL Editor

### Import fails with "duplicate key" errors
- The data might already be imported
- Check Supabase table to see existing records
- You can clear the table if needed (be careful!)

## Benefits of Supabase

✅ **Cloud Storage**: Access your data from anywhere  
✅ **Scalability**: Handles millions of records  
✅ **Real-time**: Can subscribe to data changes (future feature)  
✅ **Backups**: Automatic daily backups  
✅ **Security**: Row-level security policies  
✅ **Performance**: Fast queries with indexes  
✅ **Free Tier**: 500MB database, 2GB bandwidth/month

## Next Steps

- Train ML models using cloud data: `python ml/train_model.py`
- The frontend will automatically use Supabase data
- All API endpoints work the same way

## Support

If you encounter issues:
1. Check Supabase dashboard for error logs
2. Verify your `.env` configuration
3. Test connection with a simple query in SQL Editor
