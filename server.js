const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const {
  INTERVALS_KEY,
  ANTHROPIC_KEY,
  ATHLETE_ID,
  PORT = 3001,
  INTERVALS_BASE_URL = 'https://intervals.icu/api/v1',
  ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1'
} = process.env;

if (!INTERVALS_KEY || !ANTHROPIC_KEY || !ATHLETE_ID) {
  console.warn('Fehlende Umgebungsvariablen: Kopiere .env.example in .env und setze INTERVALS_KEY, ANTHROPIC_KEY, ATHLETE_ID.');
}

const systemPrompt = fs.readFileSync(path.resolve(__dirname, 'CLAUDE.md'), 'utf8');

const app = express();
app.use(cors());
app.use(express.json());

let contextCache = null;
let contextCacheTimestamp = 0;
const CONTEXT_CACHE_TTL_MS = 1000 * 60 * 5; // 5 Minuten

const intervalsClient = axios.create({
  baseURL: INTERVALS_BASE_URL,
  auth: {
    username: INTERVALS_KEY || '',
    password: ''
  },
  headers: {
    Accept: 'application/json'
  }
});

const anthropicClient = axios.create({
  baseURL: ANTHROPIC_BASE_URL,
  headers: {
    Authorization: `Bearer ${ANTHROPIC_KEY || ''}`,
    'Content-Type': 'application/json'
  }
});

function isoDateWeeksAgo(weeks) {
  const date = new Date();
  date.setDate(date.getDate() - weeks * 7);
  return date.toISOString().slice(0, 10);
}

function isoDateMonthsAgo(months) {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().slice(0, 10);
}

function summarizeActivities(activities) {
  if (!Array.isArray(activities) || activities.length === 0) {
    return 'Keine Aktivitäten in den letzten Monaten verfügbar.';
  }

  const activitiesByType = activities.reduce((acc, activity) => {
    const type = activity.type || activity.sport || 'Andere';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const totals = activities.reduce(
    (acc, activity) => {
      const load = Number(activity.load || activity.tss || 0);
      acc.load += load;
      return acc;
    },
    { load: 0 }
  );

  return `Aktivitäten: ${activities.length} Einträge, geschätzte Gesamtbelastung: ${Math.round(totals.load)}. Verteilung: ${Object.entries(activitiesByType)
    .map(([type, count]) => `${type}: ${count}`)
    .join(', ')}.`;
}

function summarizeWellness(wellness) {
  if (!Array.isArray(wellness) || wellness.length === 0) {
    return 'Keine Wellness-Daten verfügbar.';
  }

  const points = wellness.slice(-14);
  const avgHrv = points.reduce((acc, entry) => acc + Number(entry.hrv ?? 0), 0) / points.length;
  const avgSleep = points.reduce((acc, entry) => acc + Number(entry.sleep ?? 0), 0) / points.length;

  return `Wellness (letzte 14 Tage): HRV durchschnittlich ${Math.round(avgHrv)}ms, Schlaf durchschnittlich ${avgSleep.toFixed(1)}h. Letzte Messung: ${JSON.stringify(points[points.length - 1])}.`;
}

function summarizeEvents(events) {
  if (!Array.isArray(events) || events.length === 0) {
    return 'Keine kommenden Events oder Ziele bekannt.';
  }

  return `Aktuelle Events/Ziele: ${events
    .map((event) => {
      const name = event.name || event.title || 'Event';
      const date = event.date || event.start_date || event.due_date || 'unbekannt';
      return `${name} (${date})`;
    })
    .join(', ')}.`;
}

function buildContext(activities, wellness, events) {
  return [
    'Intervals.icu Daten:',
    `- Zeitraum Aktivitäten: letzte 6 Monate`,
    `- Zeitraum Wellness: letzte 12 Wochen`,
    '',
    summarizeActivities(activities),
    summarizeWellness(wellness),
    summarizeEvents(events),
    '',
    'Nutze diese Daten für die Planung und berücksichtige Gesamtbelastung über alle Sportarten. BJJ als hochintensiv, Kraft als neuromuskulär.',
    ''
  ].join('\n');
}

async function fetchIntervals(url, params = {}) {
  const response = await intervalsClient.get(url, { params });
  return response.data;
}

app.get('/api/activities', async (req, res) => {
  try {
    const data = await fetchIntervals(`/athlete/${ATHLETE_ID}/activities`, req.query);
    res.json(data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.get('/api/wellness', async (req, res) => {
  try {
    const data = await fetchIntervals(`/athlete/${ATHLETE_ID}/wellness`, req.query);
    res.json(data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const data = await fetchIntervals(`/athlete/${ATHLETE_ID}/events`, req.query);
    res.json(data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.get('/api/goals', async (req, res) => {
  try {
    const data = await fetchIntervals(`/athlete/${ATHLETE_ID}/athlete-goals`, req.query);
    res.json(data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.get('/api/context', async (req, res) => {
  try {
    const now = Date.now();
    if (contextCache && now - contextCacheTimestamp < CONTEXT_CACHE_TTL_MS) {
      return res.json(contextCache);
    }

    const [activities, wellness, events] = await Promise.all([
      fetchIntervals(`/athlete/${ATHLETE_ID}/activities`, {
        oldest: isoDateMonthsAgo(6),
        newest: new Date().toISOString().slice(0, 10)
      }),
      fetchIntervals(`/athlete/${ATHLETE_ID}/wellness`, {
        oldest: isoDateWeeksAgo(12),
        newest: new Date().toISOString().slice(0, 10)
      }),
      fetchIntervals(`/athlete/${ATHLETE_ID}/events`)
    ]);

    contextCache = { activities, wellness, events };
    contextCacheTimestamp = now;
    res.json(contextCache);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  const { prompt, clientContext } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt erforderlich' });
  }

  try {
    let context;
    if (clientContext) {
      // Client supplied a short context summary; use it directly
      context = `ClientContext:\n${clientContext}`;
    } else {
      const [activities, wellness, events] = await Promise.all([
        fetchIntervals(`/athlete/${ATHLETE_ID}/activities`, {
          oldest: isoDateMonthsAgo(6),
          newest: new Date().toISOString().slice(0, 10)
        }),
        fetchIntervals(`/athlete/${ATHLETE_ID}/wellness`, {
          oldest: isoDateWeeksAgo(12),
          newest: new Date().toISOString().slice(0, 10)
        }),
        fetchIntervals(`/athlete/${ATHLETE_ID}/events`)
      ]);
      context = buildContext(activities, wellness, events);
    }

    const userContent = `${context}\n\n${prompt}`;

    const response = await anthropicClient.post('/chat/completions', {
      model: 'claude-sonnet-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: 0.4,
      max_tokens_to_sample: 800
    });

    const completion = response.data?.choices?.[0]?.message?.content || response.data?.completion || '';
    res.json({ content: completion });
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
  }
});

app.post('/api/workouts', async (req, res) => {
  const { workout } = req.body;
  if (!workout) {
    return res.status(400).json({ error: 'Workout-Daten erforderlich' });
  }

  try {
    const response = await intervalsClient.post(`/athlete/${ATHLETE_ID}/workouts`, workout);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
  }
});

app.put('/api/goals/:id', async (req, res) => {
  try {
    const response = await intervalsClient.put(`/athlete/${ATHLETE_ID}/athlete-goal/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
