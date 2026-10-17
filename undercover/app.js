/* Undercover — un seul téléphone qu'on se passe.
   Phases : setup → reveal (distribution des mots) → play (parole + vote) → eliminated → … → end */
(() => {
'use strict';

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 20;
const RECENT_MAX = 60;
const LANG = BoardBox.lang;
const THEMES = window.UNDERCOVER_THEMES;
const themeLabel = id => { const th = THEMES.find(x => x.id === id); return th ? th.label[LANG] : id; };

const t = BoardBox.i18n(window.UNDERCOVER_I18N);
BoardBox.initTopbar();
BoardBox.applyI18n(t);

const store = BoardBox.createStore('undercover');
const app = document.getElementById('app');

/* ---------- Petits utilitaires ---------- */
function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) node.append(c);
  return node;
}

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Compare deux mots sans tenir compte de la casse, des accents, des articles (FR/EN) ni du pluriel. */
function normalize(word) {
  return word.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .trim()
    .replace(/^(?:(?:le|la|les|un|une|des|du|the|a|an)\s+|l')/, '')
    .replace(/[^a-z0-9]/g, '')
    .replace(/s$/, '');
}

let toastTimer = 0;
function toast(msg) {
  document.querySelector('.toast')?.remove();
  clearTimeout(toastTimer);
  const node = el('div', { class: 'toast', role: 'status', text: msg });
  document.body.append(node);
  toastTimer = setTimeout(() => node.remove(), 3500);
}

function confirmBox(title, text, yesLabel) {
  const dlg = document.getElementById('confirmDlg');
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmText').textContent = text;
  document.getElementById('confirmYes').textContent = yesLabel || t('confirm');
  return new Promise(resolve => {
    const done = ok => { dlg.close(); cleanup(); resolve(ok); };
    const yes = () => done(true), no = () => done(false), cancel = () => { cleanup(); resolve(false); };
    function cleanup() {
      document.getElementById('confirmYes').removeEventListener('click', yes);
      document.getElementById('confirmNo').removeEventListener('click', no);
      dlg.removeEventListener('cancel', cancel);
    }
    document.getElementById('confirmYes').addEventListener('click', yes);
    document.getElementById('confirmNo').addEventListener('click', no);
    dlg.addEventListener('cancel', cancel);
    dlg.showModal();
  });
}

const plural = (n, one, many) => t(n > 1 ? many : one, { n });

/* ---------- État ---------- */
// excludedThemes plutôt qu'une liste de thèmes cochés : un thème ajouté plus tard est actif d'office
const defaults = () => ({ players: [], undercovers: 1, white: true, community: true, excludedThemes: [], recent: [], game: null });
let st = Object.assign(defaults(), store.get('etat', {}));
const save = () => store.set('etat', st);

let communityPairs = [];
UndercoverDonnees.loadApproved().then(rows => {
  communityPairs = rows;
  if (!st.game) render();
});

const maxImpostors = n => Math.max(1, Math.ceil(n / 2) - 1);

/** Composition effective : le réglage st.undercovers est conservé, mais plafonné selon le nombre de joueurs
    (sinon il tombe à 0 pendant qu'on ajoute les premiers joueurs et ne remonte jamais). */
function composition() {
  const n = st.players.length;
  const w = st.white ? 1 : 0;
  const maxU = Math.max(0, maxImpostors(n) - w);
  const u = Math.min(st.undercovers, maxU);
  return { n, u, w, c: n - u - w, maxU };
}

function setupError() {
  const { n, u, w, c } = composition();
  if (n < MIN_PLAYERS) return t('err.minPlayers', { n: MIN_PLAYERS });
  if (u + w === 0) return t('err.noImpostor');
  if (c <= u + w) return t('err.civilMajority');
  if (!pairPool().length) return t('err.noTheme');
  return '';
}

/* ---------- Choix de la paire ---------- */
/** Toutes les paires de la langue (intégrées + communauté si activée), sans doublon. */
function allPairs() {
  const seen = new Set();
  const pool = [];
  const add = (key, theme, a, b) => {
    const id = [normalize(a), normalize(b)].sort().join('|');
    if (seen.has(id)) return;
    seen.add(id);
    pool.push({ key, theme, a, b });
  };
  const builtIn = (window.UNDERCOVER_PAIRS || {})[LANG] || {};
  for (const [theme, pairs] of Object.entries(builtIn)) pairs.forEach(([a, b], i) => add(`s:${LANG}:${theme}:${i}`, theme, a, b));
  if (st.community) communityPairs.filter(p => p.lang === LANG).forEach(p => add('c' + p.id, p.theme, p.word_a, p.word_b));
  return pool;
}

function pairPool() {
  return allPairs().filter(p => !st.excludedThemes.includes(p.theme));
}

function pickPair() {
  const pool = pairPool();
  const fresh = pool.filter(p => !st.recent.includes(p.key));
  const choice = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length || pool.length))];
  st.recent = [choice.key, ...st.recent.filter(k => k !== choice.key)].slice(0, RECENT_MAX);
  // Le mot des civils est tiré au hasard dans la paire
  const [civil, under] = Math.random() < .5 ? [choice.a, choice.b] : [choice.b, choice.a];
  return { civil, under, theme: choice.theme };
}

/* ---------- Déroulement ---------- */
function startGame() {
  const { u, w } = composition();
  const pair = pickPair();
  const roles = shuffle([
    ...Array(u).fill('undercover'),
    ...Array(w).fill('white'),
    ...Array(st.players.length - u - w).fill('civil')
  ]);
  st.game = {
    civil: pair.civil,
    under: pair.under,
    theme: pair.theme,
    players: st.players.map((name, i) => ({ name, role: roles[i], alive: true })),
    phase: 'reveal',
    revealIdx: 0,
    revealShown: false,
    round: 1,
    order: [],
    eliminated: null,
    winner: null
  };
  save();
  render();
}

function wordOf(p) {
  const g = st.game;
  return p.role === 'civil' ? g.civil : p.role === 'undercover' ? g.under : null;
}

/** Ordre de parole : on part d'un joueur vivant au hasard (jamais Mister White), puis dans l'ordre de la table. */
function speakingOrder() {
  const alive = st.game.players.map((p, i) => ({ p, i })).filter(x => x.p.alive);
  const starters = alive.filter(x => x.p.role !== 'white');
  const start = (starters.length ? starters : alive)[Math.floor(Math.random() * (starters.length || alive.length))];
  const from = alive.indexOf(start);
  return [...alive.slice(from), ...alive.slice(0, from)].map(x => x.i);
}

function beginRound() {
  st.game.phase = 'play';
  st.game.order = speakingOrder();
  save();
  render();
}

function winner() {
  const alive = st.game.players.filter(p => p.alive);
  const impostors = alive.filter(p => p.role !== 'civil').length;
  const civils = alive.length - impostors;
  if (impostors === 0) return 'civils';
  if (civils <= 1) return 'imposteurs';
  return null;
}

function eliminate(idx) {
  const g = st.game;
  g.players[idx].alive = false;
  g.eliminated = idx;
  g.phase = 'eliminated';
  save();
  render();
}

function afterElimination() {
  const g = st.game;
  const w = winner();
  if (w) { g.winner = w; g.phase = 'end'; }
  else { g.round++; g.order = speakingOrder(); g.phase = 'play'; }
  save();
  render();
}

function whiteGuess(guess) {
  const g = st.game;
  if (normalize(guess) && normalize(guess) === normalize(g.civil)) {
    g.winner = 'white';
    g.phase = 'end';
    save();
    render();
  } else {
    toast(t('white.wrong'));
    afterElimination();
  }
}

function quitGame() {
  st.game = null;
  save();
  render();
}

/* ---------- Écrans ---------- */
const roleLabel = role => t('role.' + role);

function render() {
  app.replaceChildren();
  const g = st.game;
  if (!g) return renderSetup();
  if (g.phase === 'reveal') return renderReveal();
  if (g.phase === 'play') return renderPlay();
  if (g.phase === 'eliminated') return renderEliminated();
  return renderEnd();
}

function renderSetup() {
  const { n, u, w, c, maxU } = composition();
  const err = setupError();

  const input = el('input', { type: 'text', id: 'playerName', maxlength: '18', placeholder: t('setup.playerName'), autocomplete: 'off', 'aria-label': t('setup.playerName') });
  const addPlayer = e => {
    e.preventDefault();
    const name = input.value.trim();
    if (!name) return input.focus();
    if (st.players.length >= MAX_PLAYERS) return toast(t('setup.maxPlayers', { n: MAX_PLAYERS }));
    if (st.players.some(p => p.toLowerCase() === name.toLowerCase())) return toast(t('setup.nameTaken'));
    st.players.push(name);
    save();
    render();
    document.getElementById('playerName').focus();
  };

  app.append(
    el('h1', { class: 'grad-text', text: 'Undercover' }),
    el('p', { class: 'sub', text: t('setup.tagline') }),

    el('section', { class: 'card' },
      el('h2', { text: t('setup.players', { n }) }),
      el('div', { class: 'chips' },
        st.players.map((name, i) => el('span', { class: 'chip' },
          el('span', { class: 'n', text: i + 1 }), name,
          el('button', { type: 'button', 'aria-label': t('setup.remove', { name }), text: '✕', onclick: () => { st.players.splice(i, 1); save(); render(); } })
        ))
      ),
      el('form', { class: 'row', onsubmit: addPlayer }, input, el('button', { class: 'btn primary', type: 'submit', text: t('setup.add') })),
      el('p', { class: 'hint', text: t('setup.orderHint') })
    ),

    el('section', { class: 'card' },
      el('h2', { text: t('setup.composition') }),
      el('div', { class: 'setting' },
        el('div', {}, el('b', { text: t('setup.undercovers') }), el('small', { text: t('setup.undercoversHint') })),
        el('div', { class: 'stepper' },
          el('button', { type: 'button', 'aria-label': t('setup.lessUndercovers'), text: '−', disabled: u <= 0, onclick: () => { st.undercovers = u - 1; save(); render(); } }),
          el('output', { text: u }),
          el('button', { type: 'button', 'aria-label': t('setup.moreUndercovers'), text: '+', disabled: u >= maxU, onclick: () => { st.undercovers = u + 1; save(); render(); } })
        )
      ),
      el('div', { class: 'setting' },
        el('div', {}, el('b', { text: t('role.white') }), el('small', { text: t('setup.whiteHint') })),
        el('label', { class: 'switch' },
          el('input', { type: 'checkbox', 'aria-label': t('setup.whiteToggle'), checked: st.white, onchange: e => { st.white = e.target.checked; if (!st.white && st.undercovers === 0) st.undercovers = 1; save(); render(); } }),
          el('span')
        )
      ),
      UndercoverDonnees.enabled && el('div', { class: 'setting' },
        el('div', {},
          el('b', { text: t('setup.community') }),
          el('small', { text: communityPairs.filter(p => p.lang === LANG).length
            ? t('setup.communityCount', { n: communityPairs.filter(p => p.lang === LANG).length })
            : t('setup.communityNone') })
        ),
        el('label', { class: 'switch' },
          el('input', { type: 'checkbox', 'aria-label': t('setup.community'), checked: st.community, onchange: e => { st.community = e.target.checked; save(); render(); } }),
          el('span')
        )
      ),
      n >= MIN_PLAYERS && el('div', { class: 'compo' },
        el('span', { class: 'tag civil', text: plural(c, 'compo.civil', 'compo.civils') }),
        u > 0 && el('span', { class: 'tag undercover', text: plural(u, 'compo.undercover', 'compo.undercovers') }),
        w > 0 && el('span', { class: 'tag white', text: t('role.white') })
      ),
      el('p', { class: 'error', text: err })
    ),

    renderThemePicker(),

    el('div', { class: 'stack' },
      el('button', { class: 'btn primary big', type: 'button', text: t('setup.start'), disabled: Boolean(err), onclick: startGame }),
      UndercoverDonnees.enabled && el('button', { class: 'btn link', type: 'button', text: t('propose.open'), onclick: openPropose })
    )
  );
}

function renderThemePicker() {
  const counts = {};
  for (const p of allPairs()) counts[p.theme] = (counts[p.theme] || 0) + 1;
  const available = THEMES.filter(th => counts[th.id]);
  const active = available.filter(th => !st.excludedThemes.includes(th.id));
  const setExcluded = list => { st.excludedThemes = list; save(); render(); };
  const toggle = id => setExcluded(st.excludedThemes.includes(id) ? st.excludedThemes.filter(x => x !== id) : [...st.excludedThemes, id]);

  return el('section', { class: 'card' },
    el('div', { class: 'card-head' },
      el('h2', { text: t('themes.title', { active: active.length, total: available.length }) }),
      el('div', { class: 'quick' },
        el('button', { class: 'btn link', type: 'button', text: t('themes.all'), onclick: () => setExcluded([]) }),
        el('button', { class: 'btn link', type: 'button', text: t('themes.none'), onclick: () => setExcluded(available.map(th => th.id)) })
      )
    ),
    el('div', { class: 'themes' }, available.map(th => el('button', {
      class: 'theme', type: 'button', 'aria-pressed': String(!st.excludedThemes.includes(th.id)), onclick: () => toggle(th.id)
    }, el('span', { 'aria-hidden': 'true', text: th.icon }), th.label[LANG], el('small', { text: counts[th.id] }))))
  );
}

function renderReveal() {
  const g = st.game;
  const p = g.players[g.revealIdx];
  const progress = el('div', { class: 'progress', 'aria-hidden': 'true' }, g.players.map((_, i) => el('i', { class: i < g.revealIdx ? 'done' : '' })));

  if (!g.revealShown) {
    app.append(el('div', { class: 'stage' },
      progress,
      el('span', { class: 'eyebrow', text: t('reveal.progress', { i: g.revealIdx + 1, n: g.players.length }) }),
      el('p', { class: 'sub', text: t('reveal.passTo') }),
      el('div', { class: 'who', text: p.name }),
      el('button', { class: 'btn primary big', type: 'button', text: t('reveal.show', { name: p.name }), onclick: () => { g.revealShown = true; save(); render(); } }),
      el('button', { class: 'btn link', type: 'button', text: t('quit'), onclick: async () => { if (await confirmBox(t('quit.title'), t('quit.reveal'), t('quit.yes'))) quitGame(); } })
    ));
    return;
  }

  const word = wordOf(p);
  const last = g.revealIdx === g.players.length - 1;
  app.append(el('div', { class: 'stage' },
    progress,
    el('span', { class: 'eyebrow', text: p.name }),
    word
      ? el('div', { class: 'secret' }, el('span', { class: 'eyebrow', text: t('reveal.yourWord') }), el('div', { class: 'word', text: word }), el('p', { text: t('reveal.memorize') }))
      : el('div', { class: 'secret white' }, el('div', { class: 'word', text: t('role.white') }), el('p', { text: t('reveal.whiteHint') })),
    el('button', { class: 'btn primary big', type: 'button', text: last ? t('reveal.start') : t('reveal.hide'), onclick: () => {
      g.revealShown = false;
      if (last) beginRound(); else { g.revealIdx++; save(); render(); }
    } })
  ));
}

function renderPlay() {
  const g = st.game;
  app.append(
    el('span', { class: 'eyebrow', text: t('play.round', { n: g.round }) }),
    el('h1', { text: t('play.title') }),
    el('p', { class: 'sub', text: t('play.rules') }),
    el('section', { class: 'card' },
      el('h2', { text: t('play.order') }),
      el('div', { class: 'order' }, g.order.map(i => el('span', { text: g.players[i].name })))
    ),
    el('section', { class: 'card' },
      el('h2', { text: t('play.vote') }),
      el('ul', { class: 'players' }, g.players.map((p, i) => el('li', { class: 'player' + (p.alive ? '' : ' out') },
        el('button', { class: 'btn vote', type: 'button', disabled: !p.alive, onclick: async () => {
          if (await confirmBox(t('play.eliminateTitle', { name: p.name }), t('play.eliminateText'), t('play.eliminateYes'))) eliminate(i);
        } }, el('span', { text: p.name })),
        el('button', { class: 'btn peek', type: 'button', 'aria-label': t('peek.aria', { name: p.name }), title: t('peek.title'), text: '👁', onclick: () => openPeek(p) })
      )))
    ),
    el('button', { class: 'btn link', type: 'button', text: t('quit'), onclick: async () => { if (await confirmBox(t('quit.title'), t('quit.play'), t('quit.yes'))) quitGame(); } })
  );
}

function renderEliminated() {
  const g = st.game;
  const p = g.players[g.eliminated];
  const word = wordOf(p);
  const children = [
    el('span', { class: 'eyebrow', text: t('elim.eliminated') }),
    el('div', { class: 'who', text: p.name }),
    el('div', { class: 'secret' + (p.role === 'white' ? ' white' : '') },
      el('span', { class: 'eyebrow', text: t('elim.was') }),
      el('div', { class: 'word', text: roleLabel(p.role) }),
      word && el('p', { text: t('elim.word', { word }) })
    )
  ];

  if (p.role === 'white') {
    const guess = el('input', { type: 'text', maxlength: '30', placeholder: t('white.placeholder'), autocomplete: 'off', 'aria-label': t('white.aria') });
    children.push(
      el('p', { class: 'sub', text: t('white.lastChance', { name: p.name }) }),
      el('form', { class: 'row', onsubmit: e => { e.preventDefault(); if (guess.value.trim()) whiteGuess(guess.value); } },
        guess, el('button', { class: 'btn primary', type: 'submit', text: t('white.guess') })),
      el('button', { class: 'btn link', type: 'button', text: t('white.skip'), onclick: afterElimination })
    );
  } else {
    children.push(el('button', { class: 'btn primary big', type: 'button', text: t('continue'), onclick: afterElimination }));
  }
  app.append(el('div', { class: 'stage' }, children));
}

function renderEnd() {
  const g = st.game;
  const banners = {
    civils: ['civils', t('end.civils'), t('end.civilsText')],
    imposteurs: ['imposteurs', t('end.impostors'), t('end.impostorsText')],
    white: ['white', t('end.white'), t('end.whiteText', { word: g.civil })]
  };
  const [cls, title, text] = banners[g.winner];
  app.append(
    el('div', { class: 'banner ' + cls }, el('b', { text: title }), el('span', { text })),
    el('div', { class: 'words' },
      el('div', {}, el('small', { text: t('end.civilWord') }), el('b', { text: g.civil })),
      el('div', {}, el('small', { text: t('end.underWord') }), el('b', { text: g.under }))
    ),
    g.theme && el('p', { class: 'hint center', text: t('end.theme', { theme: themeLabel(g.theme) }) }),
    el('ul', { class: 'roles' }, g.players.map(p => el('li', { class: p.alive ? '' : 'out' },
      el('span', { text: p.name + (p.alive ? '' : ' ✝') }),
      el('span', { class: 'tag ' + p.role, text: roleLabel(p.role) })
    ))),
    el('div', { class: 'stack' },
      el('button', { class: 'btn primary big', type: 'button', text: t('end.replay'), onclick: startGame }),
      el('button', { class: 'btn big', type: 'button', text: t('end.editPlayers'), onclick: quitGame }),
      UndercoverDonnees.enabled && el('button', { class: 'btn link', type: 'button', text: t('propose.open'), onclick: openPropose })
    )
  );
}

/* ---------- Revoir son mot ---------- */
function openPeek(p) {
  const dlg = document.getElementById('peekDlg');
  const wordEl = document.getElementById('peekWord');
  const showBtn = document.getElementById('peekShow');
  document.getElementById('peekTitle').textContent = t('peek.dialogTitle', { name: p.name });
  document.getElementById('peekText').textContent = t('peek.onlyYou', { name: p.name });
  wordEl.hidden = true;
  showBtn.hidden = false;
  showBtn.onclick = () => {
    wordEl.textContent = wordOf(p) || t('peek.noWord');
    wordEl.hidden = false;
    showBtn.hidden = true;
  };
  document.getElementById('peekClose').onclick = () => dlg.close();
  dlg.showModal();
}

/* ---------- Proposer une association ---------- */
const proposeDlg = document.getElementById('proposeDlg');
const propTheme = document.getElementById('propTheme');
propTheme.append(
  el('option', { value: '', text: t('propose.chooseTheme'), disabled: true, selected: true }),
  ...THEMES.map(th => el('option', { value: th.id, text: `${th.icon} ${th.label[LANG]}` }))
);
function openPropose() {
  document.getElementById('propA').value = '';
  document.getElementById('propB').value = '';
  propTheme.value = '';
  document.getElementById('propErr').textContent = '';
  proposeDlg.showModal();
}
document.getElementById('propCancel').onclick = () => proposeDlg.close();
document.getElementById('proposeForm').addEventListener('submit', async e => {
  e.preventDefault();
  const a = document.getElementById('propA').value, b = document.getElementById('propB').value;
  const errEl = document.getElementById('propErr'), btn = document.getElementById('propSend');
  if (normalize(a) && normalize(a) === normalize(b)) { errEl.textContent = t('propose.same'); return; }
  if (!propTheme.value) { errEl.textContent = t('propose.noTheme'); return; }
  btn.disabled = true;
  const res = await UndercoverDonnees.submit(a, b, propTheme.value, LANG);
  btn.disabled = false;
  if (res.ok) { proposeDlg.close(); toast(t('propose.thanks')); return; }
  errEl.textContent = t('propose.err.' + res.reason);
});

render();
})();
