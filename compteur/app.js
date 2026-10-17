/* Compteur de points : classement animé, objectif, manches, annulation. */
(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = BoardBox.createStore('compteur');

const t = BoardBox.i18n({
  fr: {
    title: 'Compteur de points',
    round: 'Manche {n}',
    target: 'Objectif',
    newGame: 'Nouvelle partie',
    empty: 'Ajoutez les joueurs pour commencer la partie.',
    playerName: 'Nom du joueur',
    newPlayer: 'Nom du nouveau joueur',
    add: 'Ajouter',
    undo: '↶ Annuler',
    nextRound: 'Manche suivante',
    reset: 'Remettre à zéro',
    confirm: 'Confirmer ?',
    remove: 'Retirer {name}',
    removed: '{name} a été retiré',
    cancel: 'Annuler',
    maxPlayers: '{n} joueurs maximum',
    nothingToUndo: 'Rien à annuler',
    resetDone: 'Scores remis à zéro',
    winner: '🏆 {name} atteint {target} points'
  },
  en: {
    title: 'Score counter',
    round: 'Round {n}',
    target: 'Target',
    newGame: 'New game',
    empty: 'Add players to start the game.',
    playerName: 'Player name',
    newPlayer: 'New player name',
    add: 'Add',
    undo: '↶ Undo',
    nextRound: 'Next round',
    reset: 'Reset scores',
    confirm: 'Confirm?',
    remove: 'Remove {name}',
    removed: '{name} was removed',
    cancel: 'Undo',
    maxPlayers: '{n} players maximum',
    nothingToUndo: 'Nothing to undo',
    resetDone: 'Scores reset',
    winner: '🏆 {name} reached {target} points'
  }
});
BoardBox.initTopbar();
BoardBox.applyI18n(t);

const MAX_PLAYERS = 12;
// Couleurs d'identité des joueurs : définies dans commun/base.css (--player-1 … --player-12)
const COLORS = Array.from({ length: 12 }, (_, i) => `var(--player-${i + 1})`);

/* ---------- Toast ---------- */
let toastEl = null, toastTimer = 0;
function toast(msg, action) {
  if (toastEl) toastEl.remove();
  clearTimeout(toastTimer);
  toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'status');
  const s = document.createElement('span'); s.textContent = msg; toastEl.append(s);
  if (action) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = action.label;
    b.onclick = () => { action.run(); toastEl.remove(); };
    toastEl.append(b);
  }
  document.body.append(toastEl);
  toastTimer = setTimeout(() => toastEl && toastEl.remove(), 4200);
}

/* ---------- Confettis ---------- */
function confetti() {
  if (RM) return;
  let c = $('#confetti');
  if (!c) { c = document.createElement('canvas'); c.id = 'confetti'; document.body.append(c); }
  const ctx = c.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.scale(dpr, dpr);
  const cols = ['--accent', '--accent-2', '--accent-3', '--signal', '--ok'].map(BoardBox.cssVar);
  const ps = Array.from({ length: 170 }, () => ({
    x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * .55,
    vx: (Math.random() - .5) * 15, vy: -Math.random() * 17 - 6, r: Math.random() * Math.PI, vr: (Math.random() - .5) * .35,
    w: 6 + Math.random() * 6, h: 3 + Math.random() * 5, col: cols[Math.floor(Math.random() * cols.length)]
  }));
  const t0 = performance.now();
  (function tick(now) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of ps) {
      p.vy += .42; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.col; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    }
    if (now - t0 < 3200) requestAnimationFrame(tick); else c.remove();
  })(t0);
}

/* ---------- État de la partie ---------- */
const fresh = () => ({ target: 100, round: 1, winner: null, history: [], next: 1, players: [] });
let st = store.get('partie', null);
if (!st || !Array.isArray(st.players)) st = fresh();

const list = $('#plList'), els = new Map();
const save = () => store.set('partie', st);
const snap = () => {
  st.history.push(JSON.stringify({ players: st.players, round: st.round, winner: st.winner, target: st.target }));
  if (st.history.length > 40) st.history.shift();
};

function makeEl(p) {
  const li = document.createElement('li'); li.className = 'pl glass'; li.dataset.id = p.id;
  // Gabarit fixe sans aucune donnée utilisateur ; les noms sont posés ensuite en value/textContent
  li.innerHTML = `<span class="pl-av"><span class="pl-ini"></span><span class="pl-rank"></span></span>
    <div class="pl-main"><input class="pl-name" maxlength="18"><div class="pl-bar"><i></i></div></div>
    <output class="pl-score" aria-live="polite"></output>
    <div class="pl-btns">
      <button type="button" data-d="-1">−1</button><button type="button" data-d="1">+1</button>
      <button type="button" data-d="5">+5</button><button type="button" data-d="10">+10</button>
      <button type="button" class="del">✕</button>
    </div>`;
  $('.pl-name', li).setAttribute('aria-label', t('playerName'));
  li.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('del')) return remove(p.id);
    change(p.id, +b.dataset.d);
  });
  const inp = $('.pl-name', li);
  inp.addEventListener('change', () => {
    const v = inp.value.trim(); const pl = st.players.find(x => x.id === p.id);
    if (!pl) return;
    if (!v) { inp.value = pl.name; return; }
    snap(); pl.name = v; render(); save();
  });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); });
  els.set(p.id, li);
  return li;
}

function render(pulseId) {
  const first = new Map();
  els.forEach((el, id) => first.set(id, el.getBoundingClientRect().top));
  const focused = document.activeElement;
  const sorted = [...st.players].sort((a, b) => b.score - a.score);
  const top = sorted.length ? sorted[0].score : 0;
  sorted.forEach((p, i) => {
    const el = els.get(p.id) || makeEl(p);
    const color = COLORS[p.c % COLORS.length];
    $('.pl-av', el).style.background = color;
    $('.pl-ini', el).textContent = (p.name[0] || '?').toUpperCase();
    $('.pl-rank', el).textContent = i + 1;
    const inp = $('.pl-name', el); if (document.activeElement !== inp) inp.value = p.name;
    $('.del', el).setAttribute('aria-label', t('remove', { name: p.name }));
    const sc = $('.pl-score', el); sc.textContent = p.score;
    const bar = $('.pl-bar i', el); bar.style.setProperty('--c', color);
    bar.style.width = Math.max(0, Math.min(100, p.score / st.target * 100)) + '%';
    el.classList.toggle('lead', i === 0 && p.score > 0 && sorted.filter(x => x.score === top).length === 1);
    if (pulseId === p.id && !RM) { sc.classList.remove('pop'); void sc.offsetWidth; sc.classList.add('pop'); }
    list.append(el);
  });
  els.forEach((el, id) => { if (!st.players.some(p => p.id === id)) { el.remove(); els.delete(id); } });
  if (focused && focused !== document.activeElement && document.contains(focused)) focused.focus({ preventScroll: true });
  if (!RM) els.forEach((el, id) => {
    const f = first.get(id);
    if (f == null) { el.animate([{ opacity: 0, transform: 'translateY(12px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 350, easing: 'cubic-bezier(.2,.8,.2,1)' }); return; }
    const dy = f - el.getBoundingClientRect().top;
    if (Math.abs(dy) > 1) el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
  $('#empty').hidden = st.players.length > 0;
  $('#round').textContent = t('round', { n: st.round });
  const tg = $('#target'); if (document.activeElement !== tg) tg.value = st.target;
  const w = st.players.find(p => p.id === st.winner);
  $('#win').hidden = !w;
  if (w) $('#winText').textContent = t('winner', { name: w.name, target: st.target });
}

function change(id, d) {
  const p = st.players.find(x => x.id === id); if (!p) return;
  snap(); p.score += d;
  if (!st.winner && p.score >= st.target) { st.winner = p.id; confetti(); }
  if (st.winner === p.id && p.score < st.target) st.winner = null;
  render(id); save();
}
function remove(id) {
  const p = st.players.find(x => x.id === id); if (!p) return;
  snap(); st.players = st.players.filter(x => x.id !== id);
  if (st.winner === id) st.winner = null;
  render(); save();
  toast(t('removed', { name: p.name }), { label: t('cancel'), run: undo });
}
function add(name) {
  if (st.players.length >= MAX_PLAYERS) { toast(t('maxPlayers', { n: MAX_PLAYERS })); return false; }
  snap();
  const used = new Set(st.players.map(p => p.c % COLORS.length));
  let c = 0; while (used.has(c) && c < COLORS.length - 1) c++;
  st.players.push({ id: 'p' + (st.next++), name, score: 0, c });
  render(); save(); return true;
}
function undo() {
  const s = st.history.pop();
  if (!s) { toast(t('nothingToUndo')); return; }
  Object.assign(st, JSON.parse(s)); render(); save();
}
function reset() {
  snap();
  st.players.forEach(p => p.score = 0); st.round = 1; st.winner = null;
  render(); save(); toast(t('resetDone'), { label: t('cancel'), run: undo });
}

$('#addForm').addEventListener('submit', e => {
  e.preventDefault();
  const inp = $('#addName'), v = inp.value.trim();
  if (!v) { inp.focus(); return; }
  if (add(v)) inp.value = '';
});
$('#undoBtn').onclick = undo;
$('#roundBtn').onclick = () => { snap(); st.round++; render(); save(); };
$('#winReset').onclick = reset;
let armed = 0;
$('#resetBtn').onclick = e => {
  const b = e.currentTarget;
  if (!armed) { b.textContent = t('confirm'); b.classList.add('warn'); armed = setTimeout(() => { b.textContent = t('reset'); b.classList.remove('warn'); armed = 0; }, 3000); return; }
  clearTimeout(armed); armed = 0; b.textContent = t('reset'); b.classList.remove('warn'); reset();
};
$('#target').addEventListener('change', e => {
  const v = Math.max(5, Math.min(9999, Math.round(+e.target.value || 100)));
  snap(); st.target = v;
  const best = [...st.players].sort((a, b) => b.score - a.score)[0];
  st.winner = best && best.score >= v ? best.id : null;
  render(); save();
});
render();
})();
