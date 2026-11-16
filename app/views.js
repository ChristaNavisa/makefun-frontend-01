// The four surfaces, each a function from API data to HTML.
// Every string from the API goes through esc() in format.js first.

import { bytes, date, entriesLabel, esc, money, num, rate, shortAddr, stillOpen, timeLeft } from './format.js';

export function loadingView(label) {
  return '<p class="loading" role="status">Loading ' + esc(label) + '…</p>';
}

export function errorView(message, retryHash) {
  return '<section class="error"><h1>Could not load this page</h1><p>' +
    esc(message) + '</p><p><a class="btn" href="' + esc(retryHash) + '">Try again</a> ' +
    '<a class="btn ghost" href="#/">Back to the board</a></p></section>';
}

function bountyCard(b) {
  const open = stillOpen(b);
  const pot = money(b.potUsd ?? b.rewardAmount);
  const fee = b.entryFeeUsd ? money(b.entryFeeUsd) + ' fee' : 'Free to enter';
  return '<article class="card">' +
    '<h2><a href="#/bounty/' + encodeURIComponent(b.slug) + '">' + esc(b.title) + '</a></h2>' +
    '<p class="pot">' + pot + ' <span class="pot-label">live pot</span></p>' +
    '<p class="meta"><span class="pill' + (open ? '' : ' closed') + '">' + (open ? timeLeft(b.deadline) : 'ended') + '</span>' +
    '<span>' + esc(fee) + '</span><span>' + entriesLabel(b.submissionCount) + '</span></p>' +
    '<p class="cat">' + esc(b.category || '') + '</p>' +
    '<p class="card-links"><a href="#/bounty/' + encodeURIComponent(b.slug) + '">Bounty</a> · ' +
    '<a href="#/bounty/' + encodeURIComponent(b.slug) + '/leaderboard">Leaderboard</a></p>' +
    '</article>';
}

/** The board: stats, search / filter / sort, then a page of bounty cards. */
export function boardView(items, state, pageItems, totalPages) {
  const openCount = items.filter(stillOpen).length;
  const totalPot = items.reduce((sum, b) => sum + Number(b.potUsd ?? b.rewardAmount ?? 0), 0);
  const chips = [
    ['all', 'All bounties'],
    ['ending', 'Ending soon'],
    ['nofee', 'No entry fee'],
  ].map(([id, label]) =>
    '<button type="button" class="chip' + (state.filter === id ? ' on' : '') + '" data-filter="' + id + '">' + label + '</button>'
  ).join('');
  const cards = pageItems.map(bountyCard).join('') || '<p class="empty">No bounties match that search.</p>';
  return '<section>' +
    '<h1>Open bounties</h1>' +
    '<p class="stats"><strong>' + openCount + ' open</strong> · <strong>' + money(totalPot) + '</strong> in live pots · ' +
    num(items.reduce((s, b) => s + Number(b.submissionCount || 0), 0)) + ' entries</p>' +
    '<div class="toolbar" role="search">' +
    '<label class="search">Search <input id="q" type="search" value="' + esc(state.q) + '" placeholder="Search bounties…" autocomplete="off"></label>' +
    '<div class="chips">' + chips + '</div>' +
    '<label class="sort">Sort <select id="sort">' +
    '<option value="pot"' + (state.sort === 'pot' ? ' selected' : '') + '>Biggest pot</option>' +
    '<option value="deadline"' + (state.sort === 'deadline' ? ' selected' : '') + '>Ending soonest</option>' +
    '<option value="entries"' + (state.sort === 'entries' ? ' selected' : '') + '>Most entries</option>' +
    '<option value="newest"' + (state.sort === 'newest' ? ' selected' : '') + '>Newest</option>' +
    '</select></label>' +
    '</div>' +
    '<div class="grid" id="board-list">' + cards + '</div>' +
    '<p class="pager">Page ' + state.page + ' of ' + totalPages +
    (state.page > 1 ? ' <button type="button" class="btn ghost" data-page="' + (state.page - 1) + '">← Previous</button>' : '') +
    (state.page < totalPages ? ' <button type="button" class="btn ghost" data-page="' + (state.page + 1) + '">Next →</button>' : '') +
    '</p></section>';
}

/** One bounty's page: summary, live pot, rewards table, dates, rules. */
export function bountyView(b) {
  const open = stillOpen(b);
  const rows = (b.rewardsNow || []).map((r) =>
    '<tr><td>' + num(r.place) + '</td><td>' + money(r.amountUsd) + '</td></tr>'
  ).join('');
  const desc = String(b.description || b.summary || '').split(/\n\s*\n/).map((p) =>
    '<p>' + esc(p.trim()) + '</p>'
  ).join('');
  return '<section class="bounty">' +
    '<p class="crumbs"><a href="#/">All bounties</a> · <a href="#/bounty/' + encodeURIComponent(b.slug) + '/leaderboard">Leaderboard</a></p>' +
    '<h1>' + esc(b.title) + '</h1>' +
    '<p class="summary">' + esc(b.summary || '') + '</p>' +
    '<dl class="facts">' +
    '<dt>Live pot</dt><dd class="big">' + money(b.potUsd ?? b.rewardAmount) + '</dd>' +
    '<dt>Entry fee</dt><dd>' + (b.entryFeeUsd ? money(b.entryFeeUsd) : 'Free to enter') + '</dd>' +
    '<dt>Deadline</dt><dd>' + date(b.deadline) + ' (' + timeLeft(b.deadline) + ')</dd>' +
    '<dt>Status</dt><dd>' + (open ? 'Open — taking entries' : 'Closed to entries') + '</dd>' +
    '<dt>Entries</dt><dd>' + entriesLabel(b.submissionCount) + '</dd>' +
    '<dt>Category</dt><dd>' + esc(b.category || '—') + '</dd>' +
    '</dl>' +
    (rows ? '<h2>Rewards</h2><table class="rewards"><thead><tr><th>Place</th><th>Prize</th></tr></thead><tbody>' + rows + '</tbody></table>' : '') +
    '<h2>About this bounty</h2><div class="description">' + desc + '</div>' +
    '<p><a class="btn" href="#/bounty/' + encodeURIComponent(b.slug) + '/leaderboard">See the leaderboard →</a></p>' +
    '</section>';
}

/** A bounty's leaderboard, 25 entries a page. */
export function leaderboardView(lb, slug, pageItems, page, totalPages) {
  const rows = pageItems.map((e) =>
    '<tr><td>' + num(e.rank) + '</td>' +
    '<td><a href="#/u/' + encodeURIComponent(e.handle) + '">' + esc(e.handle) + '</a>' +
    (e.house ? ' <span class="pill">house</span>' : '') + '<br><span class="sub">' + esc(e.title || '') + '</span></td>' +
    '<td><strong>' + rate(e.values && e.values.judge) + '</strong></td>' +
    '<td>' + rate(e.values && e.values.judge_low) + ' – ' + rate(e.values && e.values.judge_high) + '</td>' +
    '<td>' + bytes(e.values && e.values.bytes) + '</td></tr>'
  ).join('');
  return '<section>' +
    '<p class="crumbs"><a href="#/">All bounties</a> · <a href="#/bounty/' + encodeURIComponent(slug) + '">' + esc(lb.competition ? lb.competition.title : slug) + '</a></p>' +
    '<h1>Leaderboard</h1>' +
    '<p class="stats">' + esc(lb.competition ? lb.competition.title : slug) + ' · ' + num(lb.entries ? lb.entries.length : 0) + ' ranked entries · win rate by the AI judge</p>' +
    (rows ? '<table class="board-table"><thead><tr><th>Rank</th><th>Entry</th><th>Win rate</th><th>90% interval</th><th>Size</th></tr></thead><tbody>' + rows + '</tbody></table>' : '<p class="empty">No ranked entries yet.</p>') +
    '<p class="pager">Page ' + page + ' of ' + totalPages +
    (page > 1 ? ' <button type="button" class="btn ghost" data-page="' + (page - 1) + '">← Previous</button>' : '') +
    (page < totalPages ? ' <button type="button" class="btn ghost" data-page="' + (page + 1) + '">Next →</button>' : '') +
    '</p></section>';
}

/** An account's public profile. */
export function profileView(p) {
  const rec = p.record || {};
  const avatar = p.avatar && p.avatar.url ? 'https://make.fun' + p.avatar.url : '';
  const solutions = (p.solutions || []).map((s) =>
    '<li><a href="#/bounty/' + encodeURIComponent(s.competition.slug) + '">' + esc(s.competition.title) + '</a>' +
    '<span>' + (s.placement ? 'Placed #' + num(s.placement) : 'Entered') +
    (s.prize_usd ? ' · ' + money(s.prize_usd) : '') + '</span></li>'
  ).join('');
  return '<section class="profile">' +
    (avatar ? '<img class="avatar" crossorigin="anonymous" src="' + esc(avatar) + '" alt="">' : '') +
    '<h1>@' + esc(p.handle) + '</h1>' +
    (p.bio ? '<p class="bio">' + esc(p.bio) + '</p>' : '') +
    '<dl class="facts">' +
    '<dt>Entered</dt><dd>' + num(rec.competitions_entered) + ' competitions</dd>' +
    '<dt>Placed</dt><dd>' + num(rec.competitions_placed) + ' times · ' + num(rec.competitions_won) + ' wins</dd>' +
    '<dt>Best placement</dt><dd>' + (rec.best_placement ? '#' + num(rec.best_placement) : '—') + '</dd>' +
    '<dt>Prizes won</dt><dd>' + money(rec.prize_usd) + '</dd>' +
    (p.github_login ? '<dt>GitHub</dt><dd><a href="https://github.com/' + encodeURIComponent(p.github_login) + '">' + esc(p.github_login) + '</a></dd>' : '') +
    (p.wallet && p.wallet.address ? '<dt>Wallet</dt><dd><a href="' + esc(p.wallet.explorer_url || '') + '">' + esc(shortAddr(p.wallet.address)) + '</a></dd>' : '') +
    '</dl>' +
    '<h2>Entries</h2>' +
    (solutions ? '<ul class="solutions">' + solutions + '</ul>' : '<p class="empty">No entries yet.</p>') +
    '</section>';
}
