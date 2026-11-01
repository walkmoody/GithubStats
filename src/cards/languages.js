import { esc, frame } from '../svg.js';

// Languages card: one proportional bar plus a two-column legend.
export function languagesCard(model, theme) {
  const width = 560;
  const pad = 28;
  const langs = model.languages;

  if (langs.length === 0) {
    return frame({
      width,
      height: 110,
      theme,
      title: 'Most used languages',
      body: `  <text class="title" x="${pad}" y="42">Languages</text>
  <text class="sub" x="${pad}" y="72">No language data yet. Push code to a public repository to fill this in.</text>`,
    });
  }

  const barWidth = width - pad * 2;
  const barY = 60;
  const gap = 2;
  let x = pad;
  const segments = langs
    .map((l, i) => {
      const w = (l.percent / 100) * barWidth;
      const drawn = i === langs.length - 1 ? pad + barWidth - x : Math.max(w - gap, 1);
      const rect = `    <rect x="${x.toFixed(1)}" y="${barY}" width="${drawn.toFixed(1)}" height="10" fill="${color(l, theme)}"/>`;
      x += w;
      return rect;
    })
    .join('\n');

  const rows = Math.ceil(langs.length / 2);
  const colWidth = barWidth / 2;
  const legendY = 102;
  const rowGap = 26;
  const legend = langs
    .map((l, i) => {
      const col = Math.floor(i / rows);
      const row = i % rows;
      const lx = pad + col * colWidth;
      const ly = legendY + row * rowGap;
      return `  <circle cx="${lx + 5}" cy="${ly - 4}" r="5" fill="${color(l, theme)}"/>
  <text class="item" x="${lx + 18}" y="${ly}">${esc(l.name)}</text>
  <text class="label" x="${lx + colWidth - 24}" y="${ly}" text-anchor="end">${esc(formatPercent(l.percent))}</text>`;
    })
    .join('\n');

  return frame({
    width,
    height: legendY + (rows - 1) * rowGap + 26,
    theme,
    title: 'Most used languages',
    body: `  <text class="title" x="${pad}" y="42">Languages</text>
  <clipPath id="bar"><rect x="${pad}" y="${barY}" width="${barWidth}" height="10" rx="5"/></clipPath>
  <g clip-path="url(#bar)">
${segments}
  </g>
${legend}`,
  });
}

function color(lang, theme) {
  return lang.color ?? theme.muted;
}

function formatPercent(p) {
  return p < 1 ? '<1%' : `${p.toFixed(p < 10 ? 1 : 0)}%`;
}
