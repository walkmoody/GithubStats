// Turns raw API data into the numbers the cards display.

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const emptyRun = () => ({ length: 0, start: null, end: null });

/**
 * Current and longest streaks from a list of { date, contributionCount } days.
 * A zero on today does not break the current streak, since the day isn't over.
 */
export function computeStreaks(days, todayISO) {
  const past = [...days]
    .filter((d) => d.date <= todayISO)
    .sort((a, b) => a.date.localeCompare(b.date));

  let longest = emptyRun();
  let run = emptyRun();
  for (const day of past) {
    if (day.contributionCount > 0) {
      if (run.length === 0) run.start = day.date;
      run.length += 1;
      run.end = day.date;
      if (run.length > longest.length) longest = { ...run };
    } else {
      run = emptyRun();
    }
  }

  const current = emptyRun();
  let i = past.length - 1;
  if (i >= 0 && past[i].date === todayISO && past[i].contributionCount === 0) i -= 1;
  while (i >= 0 && past[i].contributionCount > 0) {
    current.end ??= past[i].date;
    current.start = past[i].date;
    current.length += 1;
    i -= 1;
  }

  const activeDays = past.filter((d) => d.contributionCount > 0).length;
  return { current, longest, activeDays, totalDays: past.length };
}

/** Sums language bytes across repos, keeps the top N and buckets the rest as "Other". */
export function aggregateLanguages(repos, { exclude = [], topN = 6 } = {}) {
  const skip = new Set(exclude.map((s) => s.toLowerCase()));
  const totals = new Map();

  for (const repo of repos) {
    for (const edge of repo.languages?.edges ?? []) {
      const { name, color } = edge.node;
      if (skip.has(name.toLowerCase())) continue;
      const entry = totals.get(name) ?? { name, color: color ?? null, size: 0 };
      entry.size += edge.size;
      totals.set(name, entry);
    }
  }

  const sorted = [...totals.values()].sort((a, b) => b.size - a.size);
  const total = sorted.reduce((sum, l) => sum + l.size, 0);
  if (total === 0) return [];

  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN).reduce((sum, l) => sum + l.size, 0);
  if (rest > 0) top.push({ name: 'Other', color: null, size: rest });

  return top.map((l) => ({ ...l, percent: (l.size / total) * 100 }));
}

export function buildModel({ profile, repos }, options = {}) {
  const { excludeLangs = [], excludeRepos = [], topN = 6, today = new Date() } = options;
  const cc = profile.contributionsCollection;
  const weeks = cc.contributionCalendar.weeks;
  const days = weeks.flatMap((w) => w.contributionDays);

  const skipRepos = new Set(excludeRepos.map((s) => s.toLowerCase()));
  const kept = repos.filter((r) => !skipRepos.has(r.name.toLowerCase()));

  return {
    login: profile.login,
    name: profile.name || profile.login,
    followers: profile.followers.totalCount,
    totalContributions: cc.contributionCalendar.totalContributions,
    commits: cc.totalCommitContributions + cc.restrictedContributionsCount,
    pullRequests: cc.totalPullRequestContributions,
    issues: cc.totalIssueContributions,
    stars: kept.reduce((sum, r) => sum + r.stargazerCount, 0),
    repoCount: kept.length,
    weekly: weeks.map((w) => w.contributionDays.reduce((s, d) => s + d.contributionCount, 0)),
    streaks: computeStreaks(days, toISODate(today)),
    languages: aggregateLanguages(kept, { exclude: excludeLangs, topN }),
  };
}
