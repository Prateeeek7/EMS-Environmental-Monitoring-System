"""
Directly import training_data.json into Supabase using the REST API.
This bypasses the Python supabase client (which has version issues) and
uses simple HTTP POST requests instead.

Usage (from backend/):
    python import_training_to_supabase_direct.py

Requires:
    - SUPABASE_URL in .env
    - SUPABASE_KEY (Anon public key) in .env
"""

import json
import os
from datetime import datetime

import requests
from dotenv import load_dotenv


def main():
    load_dotenv()
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL or SUPABASE_KEY not set in environment/.env")
        return

    rest_url = supabase_url.rstrip("/") + "/rest/v1/sensor_readings"

    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        # Upsert: merge duplicates on primary key so re-import doesn't fail with 409
        "Prefer": "resolution=merge-duplicates,return=minimal"
    }

    json_file = "training_data.json"
    if not os.path.exists(json_file):
        print(f"Error: {json_file} not found")
        return

    print(f"Loading data from {json_file}...")
    with open(json_file, "r") as f:
        payload = json.load(f)

    records = payload.get("data", [])
    print(f"Found {len(records)} records to import to Supabase (direct REST).")

    if not records:
        print("No records to import.")
        return

    # Normalize timestamps to ISO format for Postgres; keep 'id' for upsert (merge-duplicates)
    for rec in records:
        ts = rec.get("timestamp")
        if isinstance(ts, str):
            try:
                # Accept "YYYY-MM-DD HH:MM:SS"
                dt = datetime.strptime(ts[:19], "%Y-%m-%d %H:%M:%S")
                rec["timestamp"] = dt.isoformat()
            except Exception:
                # Leave as-is if it doesn't match expected format
                pass

    # Batch insert to avoid overly large payloads
    batch_size = 500
    imported = 0
    errors = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        try:
            resp = requests.post(rest_url, headers=headers, json=batch, timeout=60)
            if resp.status_code in (200, 201, 204):
                imported += len(batch)
                print(f"Batch {i // batch_size + 1}: inserted {len(batch)} rows "
                      f"(total imported: {imported})")
            else:
                errors += len(batch)
                print(f"Batch {i // batch_size + 1}: HTTP {resp.status_code} - {resp.text}")
        except Exception as e:
            errors += len(batch)
            print(f"Batch {i // batch_size + 1}: error {e}")

    print("\n=== Supabase import (direct REST) complete ===")
    print(f"Total records: {len(records)}")
    print(f"Imported (best effort): {imported}")
    print(f"Errors (rows that may have failed): {errors}")


if __name__ == "__main__":
    main()

