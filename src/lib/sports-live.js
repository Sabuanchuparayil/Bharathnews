/** Live & upcoming sports matches from SportScore API (free, no key). */

const API_BASE = 'https://sportscore.com/api/widget/matches/';
const SPORTS = ['cricket', 'football'];
const LIMIT_PER_SPORT = 8;

async function fetchJson(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'BharathNews/1.0 (+https://thebharathnews.com)' },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

function normalizeMatch(match, sport) {
  return {
    sport,
    home: match.home,
    away: match.away,
    homeLogo: match.home_logo || null,
    awayLogo: match.away_logo || null,
    homeScore: match.home_score ?? null,
    awayScore: match.away_score ?? null,
    status: match.status,
    statusText: match.status_text,
    time: match.time,
    competition: match.competition,
    competitionLogo: match.competition_logo || null,
    url: match.url ? `https://sportscore.com${match.url}` : null,
  };
}

function categorizeMatches(matches) {
  const live = [];
  const upcoming = [];
  const recent = [];

  for (const m of matches) {
    if (m.status === 'inprogress' || m.status === 'live') {
      live.push(m);
    } else if (m.status === 'upcoming' || m.status === 'notstarted') {
      upcoming.push(m);
    } else {
      recent.push(m);
    }
  }

  return { live, upcoming, recent };
}

export async function fetchSportsLive() {
  const results = await Promise.all(
    SPORTS.map(sport =>
      fetchJson(`${API_BASE}?sport=${sport}&limit=${LIMIT_PER_SPORT}`)
        .then(data => (data.matches || []).map(m => normalizeMatch(m, sport)))
        .catch(() => [])
    )
  );

  const allMatches = results.flat();
  const { live, upcoming, recent } = categorizeMatches(allMatches);

  live.sort((a, b) => new Date(a.time) - new Date(b.time));
  upcoming.sort((a, b) => new Date(a.time) - new Date(b.time));
  recent.sort((a, b) => new Date(b.time) - new Date(a.time));

  return {
    updatedAt: new Date().toISOString(),
    live,
    upcoming: upcoming.slice(0, 6),
    recent: recent.slice(0, 4),
    attribution: 'Powered by SportScore',
  };
}
