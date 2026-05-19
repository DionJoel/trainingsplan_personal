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

export function buildObsidianMarkdown(plan) {
  const created = new Date();
  const week = getWeekNumber(created);
  return `---\ntype: trainingsplan\nwoche: KW${week}\nerstellt: ${created.toISOString().slice(0, 10)}\nsportarten: [laufen, bjj, rad, kraft]\nstatus: entwurf\nintervals_pushed: false\n---\n\n# Trainingsplan KW${week}\n\n${plan}`;
}

export function downloadMarkdown(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
