function getWeekNumber(date) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.round((firstThursday - target) / 604800000);
}

function buildMarkdown(plan) {
  const created = new Date();
  const week = getWeekNumber(created);
  return `---\ntype: trainingsplan\nwoche: KW${week}\nerstellt: ${created.toISOString().slice(0, 10)}\nsportarten: [laufen, bjj, rad, kraft]\nstatus: entwurf\n---\n\n# Trainingsplan KW${week}\n\n${plan}`;
}

function download(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ObsidianExport({ plan, setStatus }) {
  const handleExport = () => {
    const content = buildMarkdown(plan);
    const created = new Date().toISOString().slice(0, 10);
    download(`Trainingsplan_${created}.md`, content);
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
