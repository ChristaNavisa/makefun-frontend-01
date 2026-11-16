// Router and board state for the make.fun frontend.
//
//   #/                              the bounty board
//   #/bounty/<slug>                 one bounty
//   #/bounty/<slug>/leaderboard     that bounty's leaderboard
//   #/u/<handle>                    an account's public profile
//
// window.__shotReady is false while a route loads and true once its data has
// rendered, so a screenshot script knows when to capture. Board search edits
// only the card list, never the whole page, so typing never loses focus.

import { getBounties, getBounty, getLeaderboard, getProfile } from './api.js';
import { boardView, bountyView, errorView, leaderboardView, loadingView, profileView } from './views.js';
import { stillOpen } from './format.js';

const app = document.getElementById('app');
const PAGE = 20; // bounties per board page
const LB_PAGE = 25; // leaderboard entries per page

const boardState = { q: '', filter: 'all', sort: 'pot', page: 1 };
let boardData = null; // the fetched board, cached by api.js
let currentView = 'board'; // board | bounty | leaderboard | profile
let lbSlug = null; // slug of the leaderboard currently shown

// One delegated click handler for pager and filter buttons, so buttons
// re-created by a search re-render keep working without re-wiring.
app.addEventListener('click', (ev) => {
  const pageBtn = ev.target.closest('[data-page]');
  if (pageBtn) {
    const page = Number(pageBtn.getAttribute('data-page'));
    if (currentView === 'leaderboard' && lbSlug) renderLeaderboard(lbSlug, page);
    else if (currentView === 'board') { boardState.page = page; renderBoard(); }
    return;
  }
  const filterBtn = ev.target.closest('[data-filter]');
  if (filterBtn) {
    boardState.filter = filterBtn.getAttribute('data-filter');
    boardState.page = 1;
    renderBoard();
  }
});

function show(html, ready) {
  app.innerHTML = html;
  window.scrollTo(0, 0);
  // Loading screens are NOT ready: a screenshot script must wait for data.
  window.__shotReady = ready !== false;
}

function fail(err, retryHash) {
  window.__shotReady = true;
  show(errorView(err.message || 'Something went wrong.', retryHash));
}

function applyBoard() {
  const q = boardState.q.trim().toLowerCase();
  let items = boardData.items.slice();
  if (q) items = items.filter((b) => (b.title + ' ' + (b.category || '') + ' ' + (b.skills || []).join(' ')).toLowerCase().includes(q));
  if (boardState.filter === 'ending') {
    const soon = Date.now() + 48 * 3600000;
    items = items.filter((b) => stillOpen(b) && new Date(b.deadline).getTime() < soon);
  }
  if (boardState.filter === 'nofee') items = items.filter((b) => !b.entryFeeUsd);
  const by = {
    pot: (a, b) => Number(b.potUsd ?? b.rewardAmount ?? 0) - Number(a.potUsd ?? a.rewardAmount ?? 0),
    deadline: (a, b) => new Date(a.deadline) - new Date(b.deadline),
    entries: (a, b) => Number(b.submissionCount || 0) - Number(a.submissionCount || 0),
    newest: (a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0),
  };
  items.sort(by[boardState.sort] || by.pot);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE));
  if (boardState.page > totalPages) boardState.page = totalPages;
  return { items, pageItems: items.slice((boardState.page - 1) * PAGE, boardState.page * PAGE), totalPages };
}

async function renderBoard() {
  window.__shotReady = false;
  currentView = 'board';
  show(loadingView('the bounty board'), false);
  try {
    if (!boardData) boardData = await getBounties();
    const { items, pageItems, totalPages } = applyBoard();
    window.__shotReady = false;
    show(boardView(boardData.items, boardState, pageItems, totalPages));
    wireBoard();
    void items;
  } catch (err) {
    fail(err, '#/');
  }
}

function wireBoard() {
  const q = document.getElementById('q');
  const sort = document.getElementById('sort');
  if (q) {
    q.addEventListener('input', () => {
      boardState.q = q.value;
      boardState.page = 1;
      // Re-render only the list and pager: the input keeps focus.
      const { items, pageItems, totalPages } = applyBoard();
      const list = document.getElementById('board-list');
      if (list) list.innerHTML = pageItems.length ? pageItems.map((b) => cardHtml(b)).join('') : '<p class="empty">No bounties match that search.</p>';
      const pager = document.querySelector('.pager');
      if (pager) pager.innerHTML = pagerHtml(totalPages);
      void items;
    });
  }
  if (sort) sort.addEventListener('change', () => { boardState.sort = sort.value; boardState.page = 1; renderBoard(); });
}

function cardHtml(b) {
  const open = stillOpen(b);
  const pot = '$' + Number(b.potUsd ?? b.rewardAmount ?? 0).toLocaleString('en-US');
  const fee = b.entryFeeUsd ? '$' + Number(b.entryFeeUsd).toLocaleString('en-US') + ' fee' : 'Free to enter';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');
  return '<article class="card">' +
    '<h2><a href="#/bounty/' + encodeURIComponent(b.slug) + '">' + esc(b.title) + '</a></h2>' +
    '<p class="pot">' + pot + ' <span class="pot-label">live pot</span></p>' +
    '<p class="meta"><span class="pill' + (open ? '' : ' closed') + '">' + esc(open ? timeLeftText(b.deadline) : 'ended') + '</span>' +
    '<span>' + esc(fee) + '</span><span>' + Number(b.submissionCount || 0).toLocaleString('en-US') + ' entries</span></p>' +
    '<p class="cat">' + esc(b.category || '') + '</p>' +
    '<p class="card-links"><a href="#/bounty/' + encodeURIComponent(b.slug) + '">Bounty</a> · ' +
    '<a href="#/bounty/' + encodeURIComponent(b.slug) + '/leaderboard">Leaderboard</a></p></article>';
}

function timeLeftText(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'ended';
  const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return d + 'd ' + h + 'h left';
  if (h > 0) return h + 'h ' + m + 'm left';
  return m + 'm left';
}

function pagerHtml(totalPages) {
  return 'Page ' + boardState.page + ' of ' + totalPages +
    (boardState.page > 1 ? ' <button type="button" class="btn ghost" data-page="' + (boardState.page - 1) + '">← Previous</button>' : '') +
    (boardState.page < totalPages ? ' <button type="button" class="btn ghost" data-page="' + (boardState.page + 1) + '">Next →</button>' : '');
}

async function renderBounty(slug) {
  window.__shotReady = false;
  currentView = 'bounty';
  show(loadingView('bounty ' + slug), false);
  try {
    show(bountyView(await getBounty(slug)));
  } catch (err) {
    fail(err, '#/bounty/' + encodeURIComponent(slug));
  }
}

async function renderLeaderboard(slug, page) {
  window.__shotReady = false;
  currentView = 'leaderboard';
  lbSlug = slug;
  show(loadingView('the leaderboard'), false);
  try {
    const lb = await getLeaderboard(slug);
    const entries = lb.entries || [];
    const totalPages = Math.max(1, Math.ceil(entries.length / LB_PAGE));
    const p = Math.min(Math.max(1, page), totalPages);
    show(leaderboardView(lb, slug, entries.slice((p - 1) * LB_PAGE, p * LB_PAGE), p, totalPages));
  } catch (err) {
    fail(err, '#/bounty/' + encodeURIComponent(slug) + '/leaderboard');
  }
}

async function renderProfile(handle) {
  window.__shotReady = false;
  currentView = 'profile';
  show(loadingView('profile @' + handle), false);
  try {
    show(profileView(await getProfile(handle)));
  } catch (err) {
    fail(err, '#/u/' + encodeURIComponent(handle));
  }
}

function route() {
  const hash = location.hash || '#/';
  let m = hash.match(/^#\/bounty\/([^/]+)\/leaderboard$/);
  if (m) return renderLeaderboard(decodeURIComponent(m[1]), 1);
  m = hash.match(/^#\/bounty\/([^/]+)$/);
  if (m) return renderBounty(decodeURIComponent(m[1]));
  m = hash.match(/^#\/u\/([^/]+)$/);
  if (m) return renderProfile(decodeURIComponent(m[1]));
  return renderBoard();
}

window.addEventListener('hashchange', route);
route();
