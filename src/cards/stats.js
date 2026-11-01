import { esc, formatNumber, frame } from '../svg.js';

// Overview card: headline numbers plus a weekly contribution line for the last year.
export function statsCard(model, theme) {
  const width = 560;
  const height = 224;
  const pad = 28;

  const items = [
    ['Contributions', model.totalContributions],
    ['Commits', model.commits],
    ['Pull requests', model.pullRequests],
    ['Stars earned', model.stars],
    ['Repositories', model.repoCount],
  ];
  const colWidth = (width - pad * 2) / items.length;
  const numbers = items
    .map(
      ([label, value], i) => `  <g transform="translate(${(pad + i * colWidth).toFixed(1)} 98)">
    <text class="num">${formatNumber(value)}</text>
    <text class="label" y="20">${label}</text>
  </g>`,
    )
    .join('\n');

  return frame({
    width,
    height,
    theme,
    title: `${model.name}'s GitHub activity`,
    body: `  <text class="title" x="${pad}" y="42">${esc(model.name)}</text>
  <text class="sub" x="${pad}" y="62">@${esc(model.login)} on GitHub, last 12 months</text>
${numbers}
${sparkline(model.weekly, theme, { x0: pad, x1: width - pad, top: 152, bottom: 194 })}
  <text class="small" x="${pad}" y="212">12 months ago</text>
  <text class="small" x="${width - pad}" y="212" text-anchor="end">This week</text>`,
  });
}

function sparkline(values, theme, { x0, x1, top, bottom }) {
  const baseline = `  <line x1="${x0}" y1="${bottom}" x2="${x1}" y2="${bottom}" stroke="${theme.track}" stroke-width="1"/>`;
  if (values.length < 2) return baseline;

  const max = Math.max(1, ...values);
  const step = (x1 - x0) / (values.length - 1);
  const pts = values.map((v, i) => [x0 + i * step, bottom - (v / max) * (bottom - top)]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${x1} ${bottom} L${x0} ${bottom} Z`;

  const peak = values.indexOf(Math.max(...values));
  const [px, py] = pts[peak];
  const anchor = px < x0 + 40 ? 'start' : px > x1 - 40 ? 'end' : 'middle';
  const peakMark =
    values[peak] > 0
      ? `  <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.5" fill="${theme.highlight}"/>
  <text class="small" x="${px.toFixed(1)}" y="${(py - 9).toFixed(1)}" text-anchor="${anchor}" style="fill:${theme.highlight}">Peak week: ${values[peak]}</text>`
      : '';

  return `${baseline}
  <path d="${area}" fill="${theme.accent}" fill-opacity="0.16"/>
  <path d="${line}" fill="none" stroke="${theme.accent}" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round"/>
${peakMark}`;
}
