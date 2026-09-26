# TechWiz 7 — SkillSprint AI

Dual-Pipeline AI Document Verification System for Personalized Onboarding.

SkillSprint AI turns a company's internal documents (policies, SOPs, handbooks, job descriptions) into learning paths for each job position. HR uploads documents and generates a path. A Reviewer checks that every lesson, task and quiz question is backed by a verbatim quote from the source, then publishes the path to a department or position. Employees study the path stage by stage.

## Repository layout

| Folder | Content |
| :--- | :--- |
| `frontend/` | React + Vite web app for HR, Reviewer and Employee ([frontend/README.md](frontend/README.md)) |
| `backend/` | FastAPI API, SQLAlchemy + Alembic database, document ingestion, Gemini pipeline, server-side checks ([backend/README.md](backend/README.md)) |
| `sample_documents/` | Sample company documents DOC-11…DOC-20 as PDF, with Markdown sources and test answer keys ([sample_documents/README_PHASE2.md](sample_documents/README_PHASE2.md)) |
| `documentation/` | Functional flows ([FRONTEND_FLOWS.md](documentation/FRONTEND_FLOWS.md)), the team work breakdown, and signs of AI-generated writing ([AI_WRITING_SIGNS.html](documentation/AI_WRITING_SIGNS.html)) |
| `Rules/` | Team coding and writing rules |
| `AI_USAGE.md` | Declaration of every AI-assisted change |

## Quick start

```powershell
# Backend  →  http://localhost:8000/api/docs
cd backend
python -m venv .venv; .venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env          # then set JWT_SECRET (and GEMINI_API_KEY to use Gemini)
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload

# Frontend  →  http://localhost:3000
cd frontend
npm install
echo VITE_API_URL=http://localhost:8000/api > .env.local   # omit to run fully in the browser
npm run dev
```

Demo accounts (password `Demo@123`): `hr@fourangrybirds.vn`, `reviewer@fourangrybirds.vn`, `alex.morgan@fourangrybirds.vn`.

## Tests

```powershell
cd backend;  pytest;  ruff check app tests alembic
cd frontend; npm test; npm run build
```
