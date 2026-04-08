# VRChat Legends Group Tool — React UI

## Development

1. **Start the Flask backend** (from project root):
   ```bash
   python vrchat_auto_accept.py
   ```
   Or use `run.bat`. Backend runs at **http://localhost:5555**.

2. **Start the React dev server** (from this folder):
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:5173 — Vite proxies `/api`, `/login`, and `/assets` to Flask on port 5555.

## Production (serve UI from Flask)

1. Build the React app:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
   Or run `setup.bat` from the project root (installs Python deps + frontend and builds).

2. Run Flask with `run.bat` or `python vrchat_auto_accept.py`. Open **http://localhost:5555**. If `frontend/dist/index.html` exists, Flask serves the React app; login stays server-rendered.

## Stack

- React 18, React Router 6
- Vite 5
- Tailwind CSS 3
- No state library (context + fetch only)
