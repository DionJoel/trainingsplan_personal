import { buildObsidianMarkdown, downloadMarkdown } from '../utils/markdown';

export default function ObsidianExport({ plan, setStatus }) {
  const handleExport = () => {
    const content = buildObsidianMarkdown(plan);
    const created = new Date().toISOString().slice(0, 10);
    downloadMarkdown(`Trainingsplan_${created}.md`, content);
    setStatus('Markdown exportiert.');
  };

  return (
    <section>
      <h2>Obsidian Export</h2>
      <p>Exportiere den Plan als Obsidian-kompatible Markdown-Datei.</p>
      <button className="secondary" onClick={handleExport}>
        Exportieren
      </button>
    </section>
  );
}
