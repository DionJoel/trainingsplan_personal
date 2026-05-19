import { useState } from 'react';
import Chat from './components/Chat';
import PlanPreview from './components/PlanPreview';
import ObsidianExport from './components/ObsidianExport';

function App() {
  const [planText, setPlanText] = useState('');
  const [status, setStatus] = useState('');

  return (
    <div className="app-shell">
      <header>
        <h1>Trainingscoach</h1>
        <p>Erstelle einen Wochenplan aus Intervals.icu und exportiere ihn als Obsidian-Markdown.</p>
      </header>

      <main>
        <Chat onPlanReady={(text) => {
          setPlanText(text);
          setStatus('Plan geladen.');
        }} setStatus={setStatus} />

        <PlanPreview plan={planText} setStatus={setStatus} />

        {planText && <ObsidianExport plan={planText} setStatus={setStatus} />}
      </main>

      <footer>
        <p>{status}</p>
      </footer>
    </div>
  );
}

export default App;
