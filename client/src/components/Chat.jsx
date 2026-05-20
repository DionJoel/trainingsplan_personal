import { useState, useEffect } from 'react';
import { sendChat } from '../api/claude';
import { fetchContext } from '../api/context';

const CLIENT_CONTEXT_MAX_LENGTH = 1000;

function truncateContext(context) {
  if (!context) return context;
  if (context.length <= CLIENT_CONTEXT_MAX_LENGTH) return context;
  const truncated = context.slice(0, CLIENT_CONTEXT_MAX_LENGTH);
  return truncated.replace(/\s+\S*$/, '') + ' ...';
}

export default function Chat({ onPlanReady, setStatus }) {
  const [prompt, setPrompt] = useState('Erstelle einen Wochenplan für Laufen, BJJ, Radfahren und Kraft.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientContext, setClientContext] = useState('');
  const [contextLoaded, setContextLoaded] = useState(false);
  const [useClientContext, setUseClientContext] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const ctx = await fetchContext();
        if (!mounted) return;
        const summary = buildSummary(ctx);
        setClientContext(summary);
        setContextLoaded(true);
      } catch (e) {
        // ignore context load errors; user can still use chat
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  function buildSummary(ctx) {
    if (!ctx) return '';
    const activities = Array.isArray(ctx.activities) ? ctx.activities.length : 0;
    let avgHrv = '-';
    let avgSleep = '-';
    if (Array.isArray(ctx.wellness) && ctx.wellness.length) {
      const points = ctx.wellness.slice(-14);
      const hrvSum = points.reduce((a, p) => a + Number(p.hrv ?? 0), 0);
      const sleepSum = points.reduce((a, p) => a + Number(p.sleep ?? 0), 0);
      avgHrv = Math.round(hrvSum / points.length) || 0;
      avgSleep = (sleepSum / points.length).toFixed(1) || '0.0';
    }
    const events = Array.isArray(ctx.events) ? ctx.events.slice(0,3).map(e => (e.name||e.title||'Event') + ' (' + (e.date||e.start_date||'?') + ')').join(', ') : '';
    return `Aktivitäten: ${activities} Einträge; Wellness (14d): HRV avg ${avgHrv}ms, Schlaf avg ${avgSleep}h; Events: ${events}`;
  }

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    setStatus('Chat wird ausgeführt...');

    try {
      const trimmedContext = useClientContext ? truncateContext(clientContext) : undefined;
      const result = await sendChat(prompt, trimmedContext);
      onPlanReady(result.content || '');
      setStatus(useClientContext ? 'Trainingsplan empfangen (Client-Kontext genutzt).' : 'Trainingsplan empfangen.');
    } catch (err) {
      setError(err.message);
      setStatus('Fehler beim Chat.');
    } finally {
      setLoading(false);
    }
  };

  const fillWithContext = () => {
    if (!clientContext) return;
    const base = 'Erstelle einen Wochenplan für Laufen, BJJ, Radfahren und Kraft.';
    setPrompt(base + '\n\nAktueller Kontext:\n' + clientContext + '\n\nErstelle den Plan:');
    setStatus('Prompt mit aktuellem Kontext gefüllt.');
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
          <button type="button" className="secondary" onClick={fillWithContext} disabled={!contextLoaded}>
            Kontext einfügen
          </button>
        </div>
        <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={useClientContext}
              onChange={(event) => setUseClientContext(event.target.checked)}
            />
            Client-Kontext verwenden
          </label>
          {contextLoaded && (
            <span style={{ color: '#374151' }}>
              Kontextlänge: {clientContext.length} Zeichen{clientContext.length > CLIENT_CONTEXT_MAX_LENGTH ? ' (wird gekürzt)' : ''}
            </span>
          )}
        </div>
        {error && <p style={{ color: '#b91c1c', marginTop: '12px' }}>{error}</p>}
      </form>
    </section>
  );
}
