# LSTM training: TensorFlow / ml_dtypes error on Mac

If you see:
```text
TensorFlow not available (AttributeError: cannot import name 'float8_e3m4' from 'ml_dtypes')
```

**Cause:** On Mac, `tensorflow-macos` 2.15 pins `ml-dtypes~=0.2.0`, while JAX (pulled in by TensorFlow) expects `ml-dtypes>=0.5.0` (which provides `float8_e3m4`). If your **global** Python (e.g. pyenv) has JAX or newer ml-dtypes installed, TensorFlow’s import can fail.

**Fix: use a project-only virtualenv** so only this project’s dependencies are used (no global JAX):

```bash
cd "/Users/pratikkumar/Desktop/Projects/EMD Final/backend"

# Create venv (once)
python3 -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate

# Install in 3 steps (avoids pip getting stuck on supabase + tensorflow)
bash install_venv.sh

# Train (LSTM + anomaly)
python -m ml.train_model
```

If you prefer not to use the script: run `pip install -r requirements-base.txt`, then `pip install tensorflow==2.15.0`, then `pip install "supabase>=2.3.0,<3"`. Doing `pip install -r requirements.txt` in one go can make pip backtrack for a long time.

Use **this venv’s** `python` and `pip` for training. The anomaly detector will always train; LSTM models train only if TensorFlow imports successfully in this venv.

**Alternative:** Run LSTM training in **Google Colab** or a **Linux** environment where TensorFlow’s dependencies are usually compatible.
