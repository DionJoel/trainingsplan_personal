import { useState } from 'react';
import { sendChat } from '../api/claude';

export default function Chat({ onPlanReady, setStatus }) {
  const [prompt, setPrompt] = useState('Erstelle einen Wochenplan für Laufen, BJJ, Radfahren und Kraft.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    setStatus('Chat wird ausgeführt...');

    try {
      const result = await sendChat(prompt);
      onPlanReady(result.content || '');
      setStatus('Trainingsplan empfangen.');
    } catch (err) {
      setError(err.message);
      setStatus('Fehler beim Chat.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2>Chat mit Claude</h2>
      <form onSubmit={submit}>
        <label htmlFor="prompt">Prompt</label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Lädt...' : 'Plan erzeugen'}
          </button>
        </div>
        {error && <p style={{ color: '#b91c1c', marginTop: '12px' }}>{error}</p>}
      </form>
    </section>
  );
}
