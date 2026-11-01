import { formatDate, formatNumber, frame } from '../svg.js';

// Streak card: current streak, longest streak and active days over the last year.
export function streakCard(model, theme) {
  const width = 560;
  const height = 150;
  const pad = 28;
  const { current, longest, activeDays, totalDays } = model.streaks;

  const columns = [
    {
      value: current.length,
      unit: dayUnit(current.length),
      label: 'Current streak',
      detail: current.length ? range(current) : 'Contribute today to start one',
      accent: true,
    },
    {
      value: longest.length,
      unit: dayUnit(longest.length),
      label: 'Longest streak',
      detail: longest.length ? range(longest) : 'No streaks yet',
    },
    {
      value: activeDays,
      unit: `of ${totalDays}`,
      label: 'Active days',
      detail: totalDays ? `${Math.round((activeDays / totalDays) * 100)}% of the last year` : '',
    },
  ];

  const colWidth = (width - pad * 2) / columns.length;
  const body = columns
    .map((c, i) => {
      const fill = c.accent ? ` style="fill:${theme.accent}"` : '';
      return `  <g transform="translate(${(pad + i * colWidth).toFixed(1)} 0)">
    <text x="0" y="86"><tspan class="big"${fill}>${formatNumber(c.value)}</tspan><tspan class="label" dx="6">${c.unit}</tspan></text>
    <text class="item" y="108">${c.label}</text>
    <text class="small" y="126">${c.detail}</text>
  </g>`;
    })
    .join('\n');

  return frame({
    width,
    height,
    theme,
    title: `${model.name}'s contribution streaks`,
    body: `  <text class="title" x="${pad}" y="42">Streaks</text>
${body}`,
  });
}

function dayUnit(n) {
  return n === 1 ? 'day' : 'days';
}

function range({ start, end }) {
  return start === end ? formatDate(start) : `${formatDate(start)} to ${formatDate(end)}`;
}
