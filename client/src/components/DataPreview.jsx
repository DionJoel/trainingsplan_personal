import { useEffect, useState } from 'react';
import { fetchContext } from '../api/context';

export default function DataPreview({ setStatus }) {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadContext = async () => {
    setLoading(true);
    setError('');
    setStatus('Lade Intervals-Daten...');

    try {
      const result = await fetchContext();
      setContext(result);
      setStatus('Intervals-Daten geladen.');
    } catch (err) {
      setError(err.message);
      setStatus('Fehler beim Laden der Daten.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContext();
  }, []);

  return (
    <section>
      <h2>Intervals-Daten</h2>
      <button className="secondary" onClick={loadContext} disabled={loading}>
        {loading ? 'Lädt...' : 'Aktualisieren'}
      </button>
      {error && <p style={{ color: '#b91c1c', marginTop: '12px' }}>{error}</p>}
      {context && (
        <div style={{ marginTop: '16px' }}>
          <p><strong>Aktivitäten:</strong> {Array.isArray(context.activities) ? context.activities.length : 0}</p>
          <p><strong>Wellness-Einträge:</strong> {Array.isArray(context.wellness) ? context.wellness.length : 0}</p>
          <p><strong>Events:</strong> {Array.isArray(context.events) ? context.events.length : 0}</p>
          <details>
            <summary>Rohdaten anzeigen</summary>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: '12px' }}>
              {JSON.stringify(context, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </section>
  );
}
