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

app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt erforderlich' });
  }

  const userContent = `Nutze die folgenden Intervals.icu-Daten und erstelle einen Wochenplan als Markdown-Tabelle.\n\n${prompt}`;

  try {
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
