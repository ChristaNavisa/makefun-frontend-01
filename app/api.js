// make.fun's public API: read-only GET, open to any origin (CORS).
// One fetch per view at most: answers are cached in memory and revalidated
// with the API's per-minute ETag, so going back to a view costs no request.

const API = 'https://make.fun/api';
const cache = new Map(); // path -> { etag, at, data }

async function get(path) {
  const hit = cache.get(path);
  const headers = {};
  if (hit && hit.etag) headers['If-None-Match'] = hit.etag;
  const res = await fetch(API + path, { headers });
  if (res.status === 304 && hit) return hit.data;
  if (!res.ok) throw new Error('make.fun API ' + res.status + ' for ' + path);
  const data = await res.json();
  cache.set(path, { etag: res.headers.get('etag'), at: Date.now(), data });
  return data;
}

/** The open bounties, newest activity first. */
export const getBounties = () => get('/competitions?status=open&activity=times');

/** One bounty, by slug. */
export const getBounty = (slug) => get('/competitions/' + encodeURIComponent(slug));

/** A bounty's leaderboard: entries ranked by the judge's win rate. */
export const getLeaderboard = (slug) =>
  get('/competitions/' + encodeURIComponent(slug) + '/leaderboard');

/** An account's public profile, by handle. */
export const getProfile = (handle) => get('/profiles/' + encodeURIComponent(handle));
