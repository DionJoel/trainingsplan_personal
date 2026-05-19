# Entwicklungskonzept – Intervals.icu Trainingscoach

## Ziel

Lokale Web-App die Intervals.icu-Daten mit Claude kombiniert, um kontextbewusste Trainingspläne zu erstellen und direkt in Intervals.icu zu pushen.

---

## Stack

|Schicht|Technologie|Begründung|
|---|---|---|
|Frontend|React + Vite|Schnell, kein Overhead|
|Styling|Tailwind CSS|Utility-first, kein Framework-Bloat|
|Backend|Express (Node.js)|API-Keys sicher, Proxy zu Intervals + Anthropic|
|KI|Anthropic API (claude-sonnet-4)|Trainingsplanung mit Kontext|
|Daten|Intervals.icu REST API|Single Source of Truth|

---

## Projektstruktur

```
/trainingscoach
├── .env                          # INTERVALS_KEY, ANTHROPIC_KEY, ATHLETE_ID
├── server.js                     # Express Backend
├── CLAUDE.md                     # KI-Systemkontext
├── package.json
└── /client
    ├── index.html
    ├── vite.config.js
    └── /src
        ├── App.jsx
        ├── /components
        │   ├── Chat.jsx          # Haupt-Chat-Interface
        │   ├── PlanPreview.jsx   # Trainingsplan Vorschau + Bestätigung
        │   └── ObsidianExport.jsx # MD Download
        └── /api
            ├── intervals.js      # Intervals.icu API Wrapper
            └── claude.js         # Anthropic API Wrapper
```

---

## Backend (server.js)

### Endpoints

|Methode|Route|Funktion|
|---|---|---|
|`GET`|`/api/activities`|Letzte 6 Monate Aktivitäten|
|`GET`|`/api/wellness`|Letzte 12 Wochen HRV/Schlaf|
|`GET`|`/api/events`|Events & Ziele|
|`POST`|`/api/chat`|Claude-Call mit Kontext|
|`POST`|`/api/workouts`|Workout in Intervals pushen|
|`PUT`|`/api/goals/:id`|Meilenstein updaten|

### Kontext-Aufbau pro Chat-Request

```javascript
// server.js - /api/chat
const [activities, wellness, events] = await Promise.all([
  getActivities(6 months),
  getWellness(12 weeks),
  getEvents()
]);

const systemPrompt = fs.readFileSync('CLAUDE.md', 'utf8');

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  system: systemPrompt,
  messages: [
    { role: 'user', content: buildContext(activities, wellness, events) + userMessage }
  ]
});
```

---

## Frontend

### Chat-Flow

```
Nutzer schreibt → Backend holt Intervals-Daten → Claude antwortet mit Plan
                                                         ↓
                                              PlanPreview zeigt MD-Tabelle
                                                         ↓
                                    Nutzer bestätigt → POST /api/workouts
                                                    → MD Download für Obsidian
```

### Bestätigungs-Dialog

Bevor ein Plan gepusht wird, zeigt die App:

- Trainingsplan als formatierte MD-Tabelle
- Zwei Buttons: **„In Intervals pushen"** | **„Nur als MD exportieren"**
- Kein Push ohne explizite Bestätigung

---

## Intervals.icu Datennutzung

### Abgerufene Daten

|Endpoint|Zeitraum|Verwendung|
|---|---|---|
|`activities`|6 Monate|Trainingshistorie, Load, Trends|
|`wellness`|12 Wochen|HRV, Schlaf, Gewicht, Readiness|
|`events`|alle|Wettkämpfe, Ziele|
|`athlete-goals`|alle|Meilensteine lesen + updaten|

### Sportarten-Mapping

Da BJJ in Intervals.icu keine native Kategorie hat:

```javascript
const SPORT_MAP = {
  'Ride': 'Rad',
  'Run': 'Laufen',
  'WeightTraining': 'Kraft',
  'MartialArts': 'BJJ',
  'Other': 'Sonstiges'
}
```

---

## Obsidian Export

### Frontmatter-Schema

```yaml
---
type: trainingsplan
woche: KW28
erstellt: 2025-07-07
sportarten: [laufen, bjj, rad, kraft]
status: entwurf
intervals_pushed: false
---
```

### Dateiname-Konvention

```
Trainingsplan_KW28_2025.md
```

Direkt in Obsidian Vault Ordner `/Training/Pläne/` ablegen.

---

## Sicherheit

- API-Keys **ausschließlich** in `.env`, nie im Frontend
- `.env` in `.gitignore`
- Intervals.icu Key rotieren nach jedem versehentlichen Leak
- CORS nur auf `localhost` beschränkt

---

## Setup (lokal)

```bash
# 1. Abhängigkeiten
npm install

# 2. .env anlegen
INTERVALS_KEY=dein_key
ANTHROPIC_KEY=dein_key
ATHLETE_ID=i484198

# 3. Starten
npm run dev        # Frontend (Vite, Port 5173)
node server.js     # Backend (Express, Port 3001)
```

---

## Entwicklungsphasen

### Phase 1 – Backend & Datenanbindung

- [ ] Express Setup mit `.env`
- [ ] Intervals.icu Proxy-Endpoints
- [ ] Aktivitäten + Wellness abrufen und normalisieren

### Phase 2 – KI-Integration

- [ ] Claude-Endpoint mit CLAUDE.md als Systemkontext
- [ ] Kontext-Builder (Aktivitäten + Wellness → strukturierter Prompt)
- [ ] Streaming-Response für Chat

### Phase 3 – Frontend

- [ ] Chat-UI (React)
- [ ] PlanPreview mit Bestätigungs-Dialog
- [ ] Obsidian MD-Export (Download)

### Phase 4 – Push-Funktionen

- [ ] Workouts in Intervals.icu schreiben
- [ ] Meilensteine updaten
- [ ] Fehlerbehandlung + Rollback

---

## Offene Fragen

- Welche Obsidian-Ordnerstruktur bevorzugst du?
- Soll der Plan tagesgenau oder nur als Wochenübersicht gepusht werden?
- Willst du Push-Benachrichtigungen wenn Claude kritische Erholungswerte erkennt? 
