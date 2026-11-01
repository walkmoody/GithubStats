// Fake but realistic data so the cards can be previewed without a GitHub token.
import { toISODate } from './stats.js';

function seededRandom(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function demoData(login = 'walkmoody', today = new Date()) {
  const rand = seededRandom(42);

  // 53 weeks ending this week, Sunday-first like GitHub's calendar.
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay() - 52 * 7);

  const weeks = [];
  let total = 0;
  for (let w = 0; w < 53; w++) {
    const contributionDays = [];
    const busy = 0.4 + 0.6 * Math.sin((w / 52) * Math.PI * 2.2) ** 2; // semester rhythm
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      if (date > today) continue;
      const weekend = d === 0 || d === 6;
      const active = rand() < (weekend ? 0.45 : 0.8) * busy + 0.1;
      const count = active ? Math.ceil(rand() * 9 * busy) : 0;
      total += count;
      contributionDays.push({ date: toISODate(date), contributionCount: count });
    }
    weeks.push({ contributionDays });
  }

  // Make sure the demo shows an active current streak.
  const days = weeks.flatMap((w) => w.contributionDays);
  for (const day of days.slice(-12)) {
    if (day.contributionCount === 0) {
      day.contributionCount = 2;
      total += 2;
    }
  }

  const lang = (name, color, size) => ({ size, node: { name, color } });
  const repos = [
    { name: 'RedactionTool', stars: 1, langs: [lang('Python', '#3572A5', 182000)] },
    { name: 'CarelessSports', stars: 3, langs: [lang('JavaScript', '#f1e05a', 240000), lang('CSS', '#663399', 30000)] },
    { name: 'chatbot-ui', stars: 2, langs: [lang('TypeScript', '#3178c6', 150000)] },
    { name: 'identity-connector', stars: 0, langs: [lang('Go', '#00ADD8', 64000)] },
    { name: 'MarioPython', stars: 3, langs: [lang('Python', '#3572A5', 48000)] },
    { name: 'Solitaire', stars: 1, langs: [lang('C', '#555555', 22000)] },
    { name: 'ml-coursework', stars: 0, langs: [lang('Jupyter Notebook', '#DA5B0B', 90000), lang('C++', '#f34b7d', 26000)] },
    { name: 'shop-app', stars: 1, langs: [lang('Java', '#b07219', 41000), lang('Shell', '#89e051', 3000)] },
  ].map((r) => ({ name: r.name, isPrivate: false, stargazerCount: r.stars, languages: { edges: r.langs } }));

  return {
    profile: {
      login,
      name: 'Walker Moody',
      followers: { totalCount: 11 },
      contributionsCollection: {
        totalCommitContributions: Math.round(total * 0.82),
        totalPullRequestContributions: 37,
        totalIssueContributions: 14,
        restrictedContributionsCount: 0,
        contributionCalendar: { totalContributions: total, weeks },
      },
    },
    repos,
  };
}
