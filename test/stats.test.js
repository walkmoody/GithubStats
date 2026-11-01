import { test } from 'node:test';
import assert from 'node:assert/strict';

import { aggregateLanguages, buildModel, computeStreaks } from '../src/stats.js';
import { esc, formatNumber } from '../src/svg.js';
import { demoData } from '../src/demo.js';
import { statsCard } from '../src/cards/stats.js';
import { languagesCard } from '../src/cards/languages.js';
import { streakCard } from '../src/cards/streak.js';
import { themes } from '../src/svg.js';

const days = (counts, startDay = 1) =>
  counts.map((c, i) => ({ date: `2026-10-${String(startDay + i).padStart(2, '0')}`, contributionCount: c }));

test('current streak counts back from the last active day', () => {
  const s = computeStreaks(days([1, 0, 2, 3, 1]), '2026-10-05');
  assert.equal(s.current.length, 3);
  assert.equal(s.current.start, '2026-10-03');
  assert.equal(s.current.end, '2026-10-05');
});

test('a zero today does not break the current streak', () => {
  const s = computeStreaks(days([1, 1, 1, 0]), '2026-10-04');
  assert.equal(s.current.length, 3);
});

test('a zero yesterday does break the current streak', () => {
  const s = computeStreaks(days([1, 1, 0, 0]), '2026-10-04');
  assert.equal(s.current.length, 0);
});

test('longest streak and active days', () => {
  const s = computeStreaks(days([1, 1, 1, 1, 0, 2, 0, 1]), '2026-10-08');
  assert.equal(s.longest.length, 4);
  assert.equal(s.longest.start, '2026-10-01');
  assert.equal(s.activeDays, 6);
});

test('future days are ignored', () => {
  const s = computeStreaks(days([1, 1, 0, 0]), '2026-10-02');
  assert.equal(s.totalDays, 2);
  assert.equal(s.current.length, 2);
});

test('languages are summed, excluded and bucketed into Other', () => {
  const repo = (edges) => ({ languages: { edges } });
  const e = (name, size) => ({ size, node: { name, color: '#000' } });
  const langs = aggregateLanguages(
    [repo([e('Python', 50), e('HTML', 100)]), repo([e('Python', 30), e('Go', 15), e('C', 5)])],
    { exclude: ['html'], topN: 2 },
  );
  assert.deepEqual(langs.map((l) => l.name), ['Python', 'Go', 'Other']);
  assert.equal(langs[0].percent, 80);
  assert.equal(langs[2].color, null);
});

test('number formatting', () => {
  assert.equal(formatNumber(987), '987');
  assert.equal(formatNumber(4321), '4,321');
  assert.equal(formatNumber(12_345), '12.3k');
  assert.equal(formatNumber(250_000), '250k');
});

test('text is escaped for SVG', () => {
  assert.equal(esc(`<a & "b">`), '&lt;a &amp; &quot;b&quot;&gt;');
});

test('every card renders valid-looking SVG from demo data', () => {
  const model = buildModel(demoData('walkmoody', new Date('2026-11-01T12:00:00')), {
    today: new Date('2026-11-01T12:00:00'),
  });
  for (const render of [statsCard, languagesCard, streakCard]) {
    for (const theme of Object.values(themes)) {
      const svg = render(model, theme);
      assert.match(svg, /^<svg[\s\S]*<\/svg>\n$/);
      assert.doesNotMatch(svg, /undefined|NaN/);
    }
  }
});

test('languages card handles an account with no code', () => {
  const svg = languagesCard({ languages: [] }, themes.dark);
  assert.match(svg, /No language data yet/);
});
