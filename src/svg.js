// Shared SVG helpers: themes, escaping, number and date formatting, card frame.

export const themes = {
  dark: {
    bg: '#0F1A2B',
    border: '#1F2E45',
    text: '#E6EDF7',
    muted: '#8A9BB4',
    accent: '#5CC8FF',
    highlight: '#F2B84B',
    track: '#1A2840',
  },
  light: {
    bg: '#F7F9FC',
    border: '#DCE3EE',
    text: '#13223A',
    muted: '#5B6B82',
    accent: '#0E7AB8',
    highlight: '#B8770B',
    track: '#E6ECF4',
  },
};

// GitHub serves README images through a proxy that blocks web fonts,
// so the cards use a system font stack.
const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;

export function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatNumber(n) {
  if (n < 10_000) return n.toLocaleString('en-US');
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 100_000 ? 1 : 0).replace(/\.0$/, '')}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

export function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function frame({ width, height, theme, title, body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="card-title">
  <title id="card-title">${esc(title)}</title>
  <style>
    text { font-family: ${FONT}; font-variant-numeric: tabular-nums; }
    .title { font-size: 18px; font-weight: 600; fill: ${theme.text}; }
    .sub { font-size: 12px; fill: ${theme.muted}; }
    .num { font-size: 22px; font-weight: 600; fill: ${theme.text}; }
    .big { font-size: 28px; font-weight: 600; fill: ${theme.text}; }
    .label { font-size: 12px; fill: ${theme.muted}; }
    .small { font-size: 11px; fill: ${theme.muted}; }
    .item { font-size: 13px; fill: ${theme.text}; }
  </style>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="10" fill="${theme.bg}" stroke="${theme.border}"/>
${body}
</svg>
`;
}
