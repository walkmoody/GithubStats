// Fetches profile, contribution and repository data from the GitHub GraphQL API.

const ENDPOINT = 'https://api.github.com/graphql';

const PROFILE_QUERY = `
query ($login: String!) {
  user(login: $login) {
    login
    name
    followers { totalCount }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

const REPOS_QUERY = `
query ($login: String!, $after: String) {
  user(login: $login) {
    repositories(first: 100, after: $after, ownerAffiliations: OWNER, isFork: false) {
      pageInfo { hasNextPage endCursor }
      nodes {
        name
        isPrivate
        stargazerCount
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name color } }
        }
      }
    }
  }
}`;

async function graphql(token, query, variables) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'GithubStats',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status}: ${await res.text()}`);
  }
  const body = await res.json();
  if (body.errors?.length) {
    throw new Error(`GitHub API error: ${body.errors.map((e) => e.message).join('; ')}`);
  }
  return body.data;
}

export async function fetchGitHubData({ token, login, includePrivate = false }) {
  const { user: profile } = await graphql(token, PROFILE_QUERY, { login });
  if (!profile) throw new Error(`No GitHub user named "${login}".`);

  const repos = [];
  let after = null;
  do {
    const { user } = await graphql(token, REPOS_QUERY, { login, after });
    const page = user.repositories;
    repos.push(...page.nodes);
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);

  return {
    profile,
    repos: includePrivate ? repos : repos.filter((r) => !r.isPrivate),
  };
}
