#!/usr/bin/env node
// Generates the stat cards.
//   npm run generate   real data (needs GITHUB_TOKEN and GH_USERNAME)
//   npm run demo       sample data, written to preview/

import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { fetchGitHubData } from './github.js';
import { demoData } from './demo.js';
import { buildModel } from './stats.js';
import { themes } from './svg.js';
import { statsCard } from './cards/stats.js';
import { languagesCard } from './cards/languages.js';
import { streakCard } from './cards/streak.js';

const CARDS = { stats: statsCard, languages: languagesCard, streak: streakCard };

function loadDotEnv(path = '.env') {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
  }
}

const list = (value) =>
  (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

function previewPage(files) {
  const section = (theme) => `
  <section class="${theme}">
    <h2>${theme === 'dark' ? 'Dark' : 'Light'} theme</h2>
    ${files.filter((f) => f.endsWith(`-${theme}.svg`)).map((f) => `<img src="${f}" alt="${f}">`).join('\n    ')}
  </section>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>GithubStats preview</title>
<style>
  body { margin: 0; font-family: system-ui, sans-serif; }
  section { padding: 32px; display: flex; flex-direction: column; gap: 16px; align-items: flex-start; }
  .dark { background: #0d1117; color: #e6edf3; }
  .light { background: #ffffff; color: #1f2328; }
  h2 { margin: 0; font-size: 16px; font-weight: 600; }
  img { max-width: 100%; }
</style>
</head>
<body>${section('dark')}${section('light')}
</body>
</html>
`;
}

async function main() {
  loadDotEnv();
  const demo = process.argv.includes('--demo');
  const login = process.env.GH_USERNAME || process.env.GITHUB_REPOSITORY_OWNER || 'walkmoody';
  const outDir = demo ? 'preview' : process.env.OUT_DIR || 'output';

  let raw;
  if (demo) {
    raw = demoData(login);
  } else {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN is not set. Add it to .env, or run "npm run demo" to use sample data.');
    }
    raw = await fetchGitHubData({ token, login, includePrivate: process.env.INCLUDE_PRIVATE === 'true' });
  }

  const model = buildModel(raw, {
    excludeLangs: list(process.env.EXCLUDE_LANGS ?? 'HTML,CSS,Jupyter Notebook'),
    excludeRepos: list(process.env.EXCLUDE_REPOS),
    topN: Number(process.env.TOP_LANGUAGES) || 6,
  });

  await mkdir(outDir, { recursive: true });
  const files = [];
  for (const [name, render] of Object.entries(CARDS)) {
    for (const [themeName, theme] of Object.entries(themes)) {
      const file = `${name}-${themeName}.svg`;
      await writeFile(join(outDir, file), render(model, theme));
      files.push(file);
    }
  }
  await writeFile(join(outDir, 'preview.html'), previewPage(files));

  console.log(`Wrote ${files.length} cards for @${model.login} to ${outDir}/`);
  console.log(`Open ${join(outDir, 'preview.html')} in a browser to see them.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
