# Repository Guidelines

## Project Structure & Module Organization

This workspace contains a static frontend and a FastAPI backend:

- `backend/app/` contains the API and filesystem storage logic; `backend/uploads/` and `backend/metadata/` are created at runtime.
- `backend/requirements.txt` lists Python dependencies.
- `frontend/index.html` is the main page; `frontend/admin.html` is the administration page.
- Frontend assets are under `frontend/css/` and `frontend/js/`; `style.css` contains shared styling, while `app.js`, `admin.js`, `utils.js`, and `upload.js` handle page behavior.

Keep page assets in these existing folders and use relative paths so the pages continue to work when served from the project directory.

## Build, Test, and Development Commands

Run the API from `backend/` after installing dependencies:

```powershell
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Serve `frontend/` separately, for example with `python -m http.server 8001` from the workspace root, and open `http://localhost:8001/frontend/`. The frontend connects to the API at `http://localhost:8000` by default.

## Coding Style & Naming Conventions

Keep the frontend plain HTML, CSS, and browser JavaScript. Use four spaces for Python indentation and two spaces for frontend code; use descriptive lowercase filenames. Keep uploaded content in `backend/uploads/` and its JSON metadata in `backend/metadata/`, never serve the storage directory directly. No formatter or linter is currently configured.

## Testing Guidelines

No automated test suite or coverage requirement is configured. After API changes, exercise upload, public read, download, duplicate handling, expiry, and token deletion against a local server. Load both frontend pages, check the browser console, and verify narrow layouts after visual changes.

## Commit & Pull Request Guidelines

No Git history is available here to establish a commit convention. Use short, imperative commit subjects (for example, `Fix admin form validation`). A pull request should summarize the change, explain how it was checked, link any related issue, and include screenshots for visible UI changes.

## Security & Configuration

Do not commit credentials, private user data, or local environment files. Treat uploaded content and values entered into forms as untrusted; validate them before use or display.
