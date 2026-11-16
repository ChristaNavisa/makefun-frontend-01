// Small helpers for showing API values. Everything from the API is escaped
// before it reaches the page, so a bounty title can never inject markup.

/** Text made safe to put inside HTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');
}

/** A dollar amount ('1000.00', '0.5' or 250) as '$1,000' or '$0.50'. */
export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '$0';
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
  });
}

/** A whole number with thousands separators. */
export function num(value) {
  return Number(value || 0).toLocaleString('en-US');
}

/** A deadline as a short date in UTC. */
export function date(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';
}

/** Time until a deadline: '2d 4h left', '35m left', or 'ended'. */
export function timeLeft(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'ended';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return days + 'd ' + hours + 'h left';
  if (hours > 0) return hours + 'h ' + minutes + 'm left';
  return minutes + 'm left';
}

/** True when a bounty still takes entries: status open AND deadline ahead. */
export function stillOpen(bounty) {
  return bounty.status === 'open' && new Date(bounty.deadline).getTime() > Date.now();
}

/** A win rate stored as micro units (950587) as '95.06%'. */
export function rate(micro) {
  if (micro == null) return '—';
  return (Number(micro) / 10000).toFixed(2) + '%';
}

/** Bytes as '661 KB'. */
export function bytes(n) {
  if (n == null) return '—';
  if (n < 1024) return n + ' B';
  return Math.round(n / 1024) + ' KB';
}

/** A wallet address shortened for display. */
export function shortAddr(addr) {
  const s = String(addr || '');
  return s.length > 12 ? s.slice(0, 6) + '…' + s.slice(-4) : s;
}

/** '1 entry' / '5 entries'. */
export function entriesLabel(n) {
  return num(n) + (Number(n) === 1 ? ' entry' : ' entries');
}
