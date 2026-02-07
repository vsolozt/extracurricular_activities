# GitHub Copilot instructions for contributors and AI agents ✅

## Quick summary
- This repository is a minimal FastAPI app that serves a small frontend and a tiny in-memory API for extracurricular activities. The FastAPI app object is in `src/app.py` and static assets live in `src/static/`.

## How to run (developer workflow) 🔧
- Create a virtualenv and install: `python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
- Launch the dev server (recommended): `uvicorn src.app:app --reload --port 8000`
- Open API docs at: `http://localhost:8000/docs` or `http://localhost:8000/redoc`

Note: `src/README.md` mentions `python app.py` but `src/app.py` does not start the server; prefer the `uvicorn src.app:app` command above.

## Big-picture architecture & important files 🏗️
- `src/app.py` — The entire backend lives here. Key points:
  - `app = FastAPI(...)` is the ASGI app; mount point for static files: `/static` -> `src/static`
  - In-memory `activities` dict is the data store (no DB). Activity name string is used as the resource identifier.
  - Endpoints:
    - `GET /activities` — returns the full `activities` dict
    - `POST /activities/{activity_name}/signup?email=...` — appends an email to `activity["participants"]`
- `src/static/app.js` — the single-page frontend that fetches `/activities` and POSTs to signup. Look here for the exact client behavior (how query params and encoding are used).
- `README.md` and `src/README.md` — contain setup hints; root README contains the correct uvicorn example.

## Project-specific behaviors and conventions 📝
- Data is stored in-memory and reset on process restart — tests and features should not assume persistence.
- Activity names are used as keys/identifiers (not numeric IDs). When constructing URLs, use `encodeURIComponent(activityName)` (as the frontend does) to match existing calls.
- Signups are permissive: the POST handler appends the email without checking for duplicates or enforcing `max_participants`.
- Error handling is minimal: a missing activity raises `HTTPException(status_code=404)`; other validations are absent.

## Integration points and external dependencies 🔗
- External dependencies are only `fastapi` and `uvicorn` (see `requirements.txt`).
- No database, auth, or external services are integrated.

## Testing & CI notes ⚠️
- There are currently no tests in the repository. If you add tests, use `pytest` and place tests under `tests/`.
- No GitHub Actions workflows are present; CI must be added when needed.

## Examples (useful for unit/integration tests and debugging) 💡
- Fetch activities (curl):
  - `curl -s http://localhost:8000/activities | jq .`
- Sign up (curl):
  - `curl -X POST "http://localhost:8000/activities/Chess%20Club/signup?email=user%40example.com"`
- The frontend expects the server to be reachable at the site root and serves the UI at `/static/index.html`.

## Common places to change for new features 🔭
- Move `activities` into a small data layer (module or class) if adding persistence or tests.
- Update `src/static/app.js` when changing API contract since the UI expects the endpoints listed above.

---

If anything in this doc is unclear or you'd like more detail (for example, recommended test patterns or examples of adding fixtures), tell me which areas to expand and I will iterate. ✍️
# Create a new local branch
git checkout -b prueba

# Push the branch to the remote repository
git push -u origin prueba