# trainingsplan_personal

Lokale Web-App für einen Intervals.icu-Trainingscoach mit Claude.

## Setup

1. `npm install`
2. `cd client && npm install`
3. `.env` aus `.env.example` anlegen und Werte setzen
4. `npm run dev`

## Struktur

- `server.js` — Express-Backend mit Intervals.icu-/Anthropic-Proxy
- `client/` — Vite + React Frontend
- `CLAUDE.md` — KI-Systemkontext
- `Entwicklungskonzept.md` — Architektur und Konzept

## Entwicklung

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`

## Wichtige Umgebungsvariablen

- `INTERVALS_KEY`
- `ANTHROPIC_KEY`
- `ATHLETE_ID`
- `PORT`
