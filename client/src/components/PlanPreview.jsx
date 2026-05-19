import { useState } from 'react';
import { pushWorkout } from '../api/intervals';

export default function PlanPreview({ plan, setStatus }) {
  const [pushResult, setPushResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePush = async () => {
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

  if (!plan) {
    return null;
  }

  return (
    <section>
      <h2>Plan Vorschau</h2>
      <pre>{plan}</pre>
      <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button className="primary" onClick={handlePush} disabled={loading}>
          {loading ? 'Push...' : 'In Intervals pushen'}
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
