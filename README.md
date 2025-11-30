## Thulla Escape Workspace

This repository is now organized as a two-project workspace to make it easier to evolve the React client and an eventual server/API layer independently.

```
/
├── backend/   # Reserved for APIs, game state services, etc. (coming soon)
└── frontend/  # Existing Vite + React experience
```

### Frontend
- Stack: Vite + React + TypeScript.
- Location: `frontend/`
- Usage: follow the detailed instructions in `frontend/README.md`, e.g.:
  1. `cd frontend`
  2. `npm install`
  3. `npm run dev` (or `npm run build`, `npm run preview`)

### Backend
- Location: `backend/`
- Current status: placeholder so the folder is tracked in Git.
- Suggested next steps: scaffold your preferred framework (Express, Fastify, tRPC, etc.) and expose real-time game state & analytics endpoints that the frontend can consume.

### Environment variables
- Frontend expects `GEMINI_API_KEY` via `frontend/.env.local` (see `frontend/README.md`).
- Backend-specific configuration can live under `backend/.env` once implemented.

### Contributing
Keep the contract between frontend and backend explicit (e.g., via shared schema files or API docs) to ensure each side can evolve independently.

