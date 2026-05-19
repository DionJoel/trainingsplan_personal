import { useState } from 'react';
import { pushWorkout } from '../api/intervals';
import { buildObsidianMarkdown, downloadMarkdown } from '../utils/markdown';

export default function PlanPreview({ plan, setStatus }) {
  const [pushResult, setPushResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handlePush = async () => {
    if (!confirmed) {
      setStatus('Bitte erst bestätigen, bevor du in Intervals pushst.');
      return;
    }

    setLoading(true);
    setStatus('Workout wird nach Intervals gepusht...');
    setPushResult(null);

    try {
      const result = await pushWorkout({
        name: 'Claude Trainingsplan',
        description: plan,
        type: 'Other'
      });
      setPushResult(result);
      setStatus('Workout erfolgreich gepusht.');
    } catch (error) {
      setStatus('Push fehlgeschlagen.');
      setPushResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const content = buildObsidianMarkdown(plan);
    const created = new Date().toISOString().slice(0, 10);
    downloadMarkdown(`Trainingsplan_${created}.md`, content);
    setStatus('Markdown exportiert.');
  };

  if (!plan) {
    return null;
  }

  return (
    <section>
      <h2>Plan Vorschau</h2>
      <pre>{plan}</pre>
      <div style={{ marginTop: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          Ich habe den Plan geprüft und bestätige den Push nach Intervals.
        </label>
      </div>
      <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button className="primary" onClick={handlePush} disabled={loading || !confirmed}>
          {loading ? 'Push...' : 'In Intervals pushen'}
        </button>
        <button className="secondary" onClick={handleExport} disabled={loading}>
          Nur als MD exportieren
        </button>
      </div>
      {pushResult && (
        <div style={{ marginTop: '12px' }}>
          <strong>Resultat:</strong> {pushResult.error ? pushResult.error : 'Erfolgreich gepusht'}
        </div>
      )}
    </section>
  );
}
