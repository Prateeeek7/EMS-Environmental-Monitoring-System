#!/bin/bash
# Install backend deps in order to avoid pip backtracking (supabase + tensorflow conflict).
# Run from backend/ with venv activated:  source .venv/bin/activate && bash install_venv.sh

set -e
echo "Step 1/3: Installing base packages..."
pip install -r requirements-base.txt

echo ""
echo "Step 2/3: Installing TensorFlow (this may take a few minutes)..."
pip install tensorflow==2.15.0

echo ""
echo "Step 3/3: Installing Supabase..."
pip install "supabase>=2.3.0,<3"

echo ""
echo "Done. Run:  python -m ml.train_model"
