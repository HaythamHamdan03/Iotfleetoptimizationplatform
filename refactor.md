You are refactoring the IoT Fleet Optimization Platform project to follow best practices for a senior capstone submission. The project is a React + TypeScript frontend (Vite) with a Flask + MongoDB backend. Here is the current structure:

Iotfleetoptimizationplatform/
├─ src/
│  ├─ main.tsx
│  └─ app/
│     ├─ App.tsx
│     ├─ components/
│     │  ├─ dashboard/
│     │  ├─ mobile/
│     │  ├─ ui/
│     │  └─ figma/
│     ├─ config/
│     ├─ context/
│     ├─ data/
│     ├─ hooks/
│     ├─ i18n/
│     ├─ simulation/
│     └─ utils/
├─ optimizer_api.py
├─ db.py
├─ seed_db.py
└─ requirements.txt

Perform the following refactoring tasks. Do not change any business logic, component behaviour, or API behaviour — this is purely structural.

---

BACKEND

1. Create a Flask application factory structure:
   - app/__init__.py — create_app() factory that registers blueprints and initialises db
   - app/routes/optimization.py — move all /optimize and /geocode endpoint handlers here as a Blueprint
   - app/routes/__init__.py — empty init
   - app/services/vrp_solver.py — extract the OR-Tools / optimization logic out of the route handlers into pure functions; route handlers should call these functions
   - app/models/schemas.py — extract any request/response validation or data shape definitions here
   - Keep db.py at root (it is already correctly separated)
   - Create a new entrypoint run.py at root: from app import create_app; app = create_app(); if __name__ == "__main__": app.run()
   - After moving code, delete optimizer_api.py

2. Pin all dependencies in requirements.txt. For every package that does not already have a pinned version (e.g. flask instead of flask==3.0.3), run pip show <package> to get the installed version and add it. The file should have zero unpinned entries when done.

---

FRONTEND

3. Create src/app/types/ directory. Scan all .ts and .tsx files for inline interface and type declarations that are used in more than one file, or that describe a data model (fleet, vehicle, route, IoT reading, demand forecast). Move them into logical files under types/ (e.g. types/fleet.ts, types/iot.ts, types/api.ts). Update all import paths.

4. Create src/app/services/ directory with an api.ts file. Move all fetch/axios/HTTP calls out of components and hooks into this file as named async functions. Components and hooks should import from services/api.ts, not call fetch directly.

5. Move src/app/components/figma/ to src/dev/figma/. Update any import paths. This directory should not live inside the production components tree.

6. Rename src/app/data/ to src/app/fixtures/. Update all import paths. Add a comment at the top of each file in fixtures/: // Mock data — not used in production builds.

---

SECURITY & GITIGNORE

7. Check whether a .gitignore exists at the project root. If it does not exist, create one. Ensure the following entries are present (add only what is missing — do not remove existing entries):
   cert.pem
   key.pem
   *.pem
   *.key
   .env
   __pycache__/
   *.pyc
   node_modules/
   dist/
   .DS_Store

8. Check whether cert.pem or key.pem have been committed to git history (git log --all --full-history -- cert.pem). If they appear in history, warn me with the exact command needed to purge them using git filter-repo; do not run it automatically.

---

DEVOPS

9. Create a docker-compose.yml at the project root with two services:
   - api: builds from a new Dockerfile in the project root; runs the Flask app on port 5000; mounts .env as env_file; depends_on mongo
   - mongo: uses the mongo:7 image; exposes port 27017; uses a named volume for data persistence
   Create the Dockerfile for the Flask service: Python 3.11-slim base, copies requirements.txt, runs pip install, copies app source, sets CMD to run run.py.

10. Create a Makefile at the project root with the following targets:
    - install: pip install -r requirements.txt && npm install
    - seed: python seed_db.py
    - dev-api: python run.py
    - dev-frontend: npm run dev
    - dev: runs dev-api and dev-frontend concurrently
    - docker-up: docker compose up --build
    - docker-down: docker compose down

---

VERIFICATION

After completing all tasks:
- Run the Flask app (python run.py) and confirm it starts without errors
- Run npm run build and confirm it completes without TypeScript errors
- Print a final directory tree of the project root (2 levels deep) so I can verify the new structure
