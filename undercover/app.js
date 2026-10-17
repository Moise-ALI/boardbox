/* Undercover — un seul téléphone qu'on se passe.
   Phases : setup → reveal (distribution des mots) → play (parole + vote) → eliminated → … → end */
(() => {
'use strict';

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 20;
const RECENT_MAX = 60;
const LANG = 'fr';
const THEMES = window.UNDERCOVER_THEMES;
const themeLabel = id => { const t = THEMES.find(x => x.id === id); return t ? t.label[LANG] : id; };

const store = Outils.createStore('undercover');
Outils.bindThemeButton(document.getElementById('themeBtn'));
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

/** Compare deux mots sans tenir compte de la casse, des accents, des articles ni du pluriel. */
function normalize(word) {
  return word.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .trim()
    .replace(/^(?:(?:le|la|les|un|une|des|du)\s+|l')/, '')
    .replace(/[^a-z0-9]/g, '')
    .replace(/s$/, '');
}

let toastTimer = 0;
function toast(msg) {
  document.querySelector('.toast')?.remove();
  clearTimeout(toastTimer);
  const t = el('div', { class: 'toast', role: 'status', text: msg });
  document.body.append(t);
  toastTimer = setTimeout(() => t.remove(), 3500);
}

function confirmBox(title, text, yesLabel = 'Confirmer') {
  const dlg = document.getElementById('confirmDlg');
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmText').textContent = text;
  document.getElementById('confirmYes').textContent = yesLabel;
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
  if (n < MIN_PLAYERS) return `Il faut au moins ${MIN_PLAYERS} joueurs.`;
  if (u + w === 0) return 'Il faut au moins un undercover ou Mister White.';
  if (c <= u + w) return 'Les civils doivent être plus nombreux que les imposteurs.';
  if (!pairPool().length) return 'Choisissez au moins un thème.';
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
  for (const [theme, pairs] of Object.entries(builtIn)) pairs.forEach(([a, b], i) => add(`s:${theme}:${i}`, theme, a, b));
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
    toast('Raté ! Ce n\'était pas le bon mot.');
    afterElimination();
  }
}

function quitGame() {
  st.game = null;
  save();
  render();
}

/* ---------- Écrans ---------- */
const ROLE_LABEL = { civil: 'Civil', undercover: 'Undercover', white: 'Mister White' };

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

  const input = el('input', { type: 'text', id: 'playerName', maxlength: '18', placeholder: 'Nom du joueur', autocomplete: 'off', 'aria-label': 'Nom du joueur' });
  const addPlayer = e => {
    e.preventDefault();
    const name = input.value.trim();
    if (!name) return input.focus();
    if (st.players.length >= MAX_PLAYERS) return toast(`${MAX_PLAYERS} joueurs maximum.`);
    if (st.players.some(p => p.toLowerCase() === name.toLowerCase())) return toast('Ce nom est déjà pris.');
    st.players.push(name);
    save();
    render();
    document.getElementById('playerName').focus();
  };

  app.append(
    el('h1', { class: 'grad-text', text: 'Undercover' }),
    el('p', { class: 'sub', text: 'Trouvez qui n\'a pas le même mot que vous… sans trahir le vôtre.' }),

    el('section', { class: 'card' },
      el('h2', { text: `Joueurs (${n})` }),
      el('div', { class: 'chips' },
        st.players.map((name, i) => el('span', { class: 'chip' },
          el('span', { class: 'n', text: i + 1 }), name,
          el('button', { type: 'button', 'aria-label': 'Retirer ' + name, text: '✕', onclick: () => { st.players.splice(i, 1); save(); render(); } })
        ))
      ),
      el('form', { class: 'row', onsubmit: addPlayer }, input, el('button', { class: 'btn primary', type: 'submit', text: 'Ajouter' })),
      el('p', { class: 'hint', text: 'Ajoutez les joueurs dans l\'ordre où vous êtes assis : c\'est l\'ordre de parole.' })
    ),

    el('section', { class: 'card' },
      el('h2', { text: 'Composition' }),
      el('div', { class: 'setting' },
        el('div', {}, el('b', { text: 'Undercovers' }), el('small', { text: 'Ont un mot différent, sans le savoir' })),
        el('div', { class: 'stepper' },
          el('button', { type: 'button', 'aria-label': 'Moins d\'undercovers', text: '−', disabled: u <= 0, onclick: () => { st.undercovers = u - 1; save(); render(); } }),
          el('output', { text: u }),
          el('button', { type: 'button', 'aria-label': 'Plus d\'undercovers', text: '+', disabled: u >= maxU, onclick: () => { st.undercovers = u + 1; save(); render(); } })
        )
      ),
      el('div', { class: 'setting' },
        el('div', {}, el('b', { text: 'Mister White' }), el('small', { text: 'N\'a aucun mot et doit bluffer' })),
        el('label', { class: 'switch' },
          el('input', { type: 'checkbox', 'aria-label': 'Jouer avec Mister White', checked: st.white, onchange: e => { st.white = e.target.checked; if (!st.white && st.undercovers === 0) st.undercovers = 1; save(); render(); } }),
          el('span')
        )
      ),
      UndercoverDonnees.enabled && el('div', { class: 'setting' },
        el('div', {}, el('b', { text: 'Associations de la communauté' }), el('small', { text: communityPairs.length ? `${communityPairs.length} paire(s) validée(s) en plus` : 'Aucune pour l\'instant' })),
        el('label', { class: 'switch' },
          el('input', { type: 'checkbox', 'aria-label': 'Inclure les associations de la communauté', checked: st.community, onchange: e => { st.community = e.target.checked; save(); render(); } }),
          el('span')
        )
      ),
      n >= MIN_PLAYERS && el('div', { class: 'compo' },
        el('span', { class: 'tag civil', text: `${c} civil${c > 1 ? 's' : ''}` }),
        u > 0 && el('span', { class: 'tag undercover', text: `${u} undercover${u > 1 ? 's' : ''}` }),
        w > 0 && el('span', { class: 'tag white', text: 'Mister White' })
      ),
      el('p', { class: 'error', text: err })
    ),

    renderThemePicker(),

    el('div', { class: 'stack' },
      el('button', { class: 'btn primary big', type: 'button', text: 'Distribuer les mots', disabled: Boolean(err), onclick: startGame }),
      UndercoverDonnees.enabled && el('button', { class: 'btn link', type: 'button', text: '+ Proposer une association de mots', onclick: openPropose })
    )
  );
}

function renderThemePicker() {
  const counts = {};
  for (const p of allPairs()) counts[p.theme] = (counts[p.theme] || 0) + 1;
  const available = THEMES.filter(t => counts[t.id]);
  const active = available.filter(t => !st.excludedThemes.includes(t.id));
  const setExcluded = list => { st.excludedThemes = list; save(); render(); };
  const toggle = id => setExcluded(st.excludedThemes.includes(id) ? st.excludedThemes.filter(x => x !== id) : [...st.excludedThemes, id]);

  return el('section', { class: 'card' },
    el('div', { class: 'card-head' },
      el('h2', { text: `Thèmes (${active.length}/${available.length})` }),
      el('div', { class: 'quick' },
        el('button', { class: 'btn link', type: 'button', text: 'Tous', onclick: () => setExcluded([]) }),
        el('button', { class: 'btn link', type: 'button', text: 'Aucun', onclick: () => setExcluded(available.map(t => t.id)) })
      )
    ),
    el('div', { class: 'themes' }, available.map(t => el('button', {
      class: 'theme', type: 'button', 'aria-pressed': String(!st.excludedThemes.includes(t.id)), onclick: () => toggle(t.id)
    }, el('span', { 'aria-hidden': 'true', text: t.icon }), t.label[LANG], el('small', { text: counts[t.id] }))))
  );
}

function renderReveal() {
  const g = st.game;
  const p = g.players[g.revealIdx];
  const progress = el('div', { class: 'progress', 'aria-hidden': 'true' }, g.players.map((_, i) => el('i', { class: i < g.revealIdx ? 'done' : '' })));

  if (!g.revealShown) {
    app.append(el('div', { class: 'stage' },
      progress,
      el('span', { class: 'eyebrow', text: `Joueur ${g.revealIdx + 1} sur ${g.players.length}` }),
      el('p', { class: 'sub', text: 'Passez le téléphone à' }),
      el('div', { class: 'who', text: p.name }),
      el('button', { class: 'btn primary big', type: 'button', text: `Je suis ${p.name}, voir mon mot`, onclick: () => { g.revealShown = true; save(); render(); } }),
      el('button', { class: 'btn link', type: 'button', text: 'Abandonner la partie', onclick: async () => { if (await confirmBox('Abandonner la partie ?', 'Les mots distribués seront perdus.', 'Abandonner')) quitGame(); } })
    ));
    return;
  }

  const word = wordOf(p);
  const last = g.revealIdx === g.players.length - 1;
  app.append(el('div', { class: 'stage' },
    progress,
    el('span', { class: 'eyebrow', text: p.name }),
    word
      ? el('div', { class: 'secret' }, el('span', { class: 'eyebrow', text: 'Ton mot' }), el('div', { class: 'word', text: word }), el('p', { text: 'Mémorise-le sans le montrer.' }))
      : el('div', { class: 'secret white' }, el('div', { class: 'word', text: 'Mister White' }), el('p', { text: 'Tu n\'as pas de mot. Écoute les autres, bluffe… et devine le mot des civils si tu es éliminé.' })),
    el('button', { class: 'btn primary big', type: 'button', text: last ? 'C\'est noté, commencer la partie' : 'C\'est noté, cacher mon mot', onclick: () => {
      g.revealShown = false;
      if (last) beginRound(); else { g.revealIdx++; save(); render(); }
    } })
  ));
}

function renderPlay() {
  const g = st.game;
  app.append(
    el('span', { class: 'eyebrow', text: `Manche ${g.round}` }),
    el('h1', { text: 'À vous de parler' }),
    el('p', { class: 'sub', text: 'Chacun dit un mot en lien avec son mot secret, dans l\'ordre. Puis débattez et votez pour éliminer un joueur.' }),
    el('section', { class: 'card' },
      el('h2', { text: 'Ordre de parole' }),
      el('div', { class: 'order' }, g.order.map(i => el('span', { text: g.players[i].name })))
    ),
    el('section', { class: 'card' },
      el('h2', { text: 'Qui éliminer ?' }),
      el('ul', { class: 'players' }, g.players.map((p, i) => el('li', { class: 'player' + (p.alive ? '' : ' out') },
        el('button', { class: 'btn vote', type: 'button', disabled: !p.alive, onclick: async () => {
          if (await confirmBox(`Éliminer ${p.name} ?`, 'Son rôle sera révélé à tout le monde.', 'Éliminer')) eliminate(i);
        } }, el('span', { text: p.name })),
        el('button', { class: 'btn peek', type: 'button', 'aria-label': `Revoir le mot de ${p.name}`, title: 'Revoir mon mot', text: '👁', onclick: () => openPeek(p) })
      )))
    ),
    el('button', { class: 'btn link', type: 'button', text: 'Abandonner la partie', onclick: async () => { if (await confirmBox('Abandonner la partie ?', 'La partie en cours sera perdue.', 'Abandonner')) quitGame(); } })
  );
}

function renderEliminated() {
  const g = st.game;
  const p = g.players[g.eliminated];
  const word = wordOf(p);
  const children = [
    el('span', { class: 'eyebrow', text: 'Éliminé' }),
    el('div', { class: 'who', text: p.name }),
    el('div', { class: 'secret' + (p.role === 'white' ? ' white' : '') },
      el('span', { class: 'eyebrow', text: 'était' }),
      el('div', { class: 'word', text: ROLE_LABEL[p.role] }),
      word && el('p', { text: `Son mot : ${word}` })
    )
  ];

  if (p.role === 'white') {
    const guess = el('input', { type: 'text', maxlength: '30', placeholder: 'Le mot des civils', autocomplete: 'off', 'aria-label': 'Mot proposé par Mister White' });
    children.push(
      el('p', { class: 'sub', text: `${p.name}, dernière chance : si tu trouves le mot des civils, tu gagnes seul !` }),
      el('form', { class: 'row', onsubmit: e => { e.preventDefault(); if (guess.value.trim()) whiteGuess(guess.value); } },
        guess, el('button', { class: 'btn primary', type: 'submit', text: 'Deviner' })),
      el('button', { class: 'btn link', type: 'button', text: 'Passer sans deviner', onclick: afterElimination })
    );
  } else {
    children.push(el('button', { class: 'btn primary big', type: 'button', text: 'Continuer', onclick: afterElimination }));
  }
  app.append(el('div', { class: 'stage' }, children));
}

function renderEnd() {
  const g = st.game;
  const banners = {
    civils: ['civils', 'Les civils gagnent !', 'Tous les imposteurs ont été démasqués.'],
    imposteurs: ['imposteurs', 'Les imposteurs gagnent !', 'Ils ont survécu jusqu\'au bout.'],
    white: ['white', 'Mister White gagne !', `Il a deviné le mot des civils : ${g.civil}.`]
  };
  const [cls, title, text] = banners[g.winner];
  app.append(
    el('div', { class: 'banner ' + cls }, el('b', { text: title }), el('span', { text: text })),
    el('div', { class: 'words' },
      el('div', {}, el('small', { text: 'Mot des civils' }), el('b', { text: g.civil })),
      el('div', {}, el('small', { text: 'Mot des undercovers' }), el('b', { text: g.under }))
    ),
    g.theme && el('p', { class: 'hint center', text: 'Thème : ' + themeLabel(g.theme) }),
    el('ul', { class: 'roles' }, g.players.map(p => el('li', { class: p.alive ? '' : 'out' },
      el('span', { text: p.name + (p.alive ? '' : ' ✝') }),
      el('span', { class: 'tag ' + p.role, text: ROLE_LABEL[p.role] })
    ))),
    el('div', { class: 'stack' },
      el('button', { class: 'btn primary big', type: 'button', text: 'Rejouer avec les mêmes joueurs', onclick: startGame }),
      el('button', { class: 'btn big', type: 'button', text: 'Modifier les joueurs', onclick: quitGame }),
      UndercoverDonnees.enabled && el('button', { class: 'btn link', type: 'button', text: '+ Proposer une association de mots', onclick: openPropose })
    )
  );
}

/* ---------- Revoir son mot ---------- */
function openPeek(p) {
  const dlg = document.getElementById('peekDlg');
  const wordEl = document.getElementById('peekWord');
  const showBtn = document.getElementById('peekShow');
  document.getElementById('peekTitle').textContent = `Mot de ${p.name}`;
  document.getElementById('peekText').textContent = `Seul ${p.name} doit regarder l'écran.`;
  wordEl.hidden = true;
  showBtn.hidden = false;
  showBtn.onclick = () => {
    wordEl.textContent = wordOf(p) || 'Mister White (pas de mot)';
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
  el('option', { value: '', text: 'Choisir un thème…', disabled: true, selected: true }),
  ...THEMES.map(t => el('option', { value: t.id, text: `${t.icon} ${t.label[LANG]}` }))
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
  if (normalize(a) && normalize(a) === normalize(b)) { errEl.textContent = 'Les deux mots doivent être différents.'; return; }
  if (!propTheme.value) { errEl.textContent = 'Choisissez un thème.'; return; }
  btn.disabled = true;
  const res = await UndercoverDonnees.submit(a, b, propTheme.value, LANG);
  btn.disabled = false;
  if (res.ok) { proposeDlg.close(); toast('Merci ! Votre association sera ajoutée après validation.'); return; }
  errEl.textContent = {
    doublon: 'Cette association existe déjà ou a déjà été proposée.',
    invalide: 'Deux mots différents, de 30 caractères maximum.',
    reseau: 'Envoi impossible pour le moment. Réessayez plus tard.'
  }[res.reason];
});

render();
})();
