/* CodeName — salle partagée par lien, synchronisée en temps réel.
   URL joueur : ?room=CODE   URL espion : ?room=CODE#spy=JETON
   Le jeton espion reste après le « # » : il n'est jamais envoyé au serveur web ni transmis en referrer.
   Les couleurs ne sont connues que de la base : la vue joueur ne les reçoit qu'au retournement. */
(() => {
'use strict';

const t = Outils.i18n(window.CODENAMES_I18N);
Outils.initTopbar();
Outils.applyI18n(t);

const app = document.getElementById('app');
const Data = window.CodenamesDonnees;
const WORDS = window.CODENAMES_WORDS;
const ROOM_RE = /^[a-z0-9]{10}$/;
const POLL_MS = 3000;          // rafraîchissement de secours si le direct ne fonctionne pas
const CONFIRM_MS = 4000;       // délai pour confirmer le retournement d'une carte

/* ---------- Utilitaires ---------- */
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

/** Remplace le contenu de la page ; ignore les éléments absents (false, null, undefined). */
const mount = (...nodes) => app.replaceChildren(...nodes.filter(n => n != null && n !== false));

let toastTimer = 0;
function toast(msg) {
  document.querySelector('.toast')?.remove();
  clearTimeout(toastTimer);
  const node = el('div', { class: 'toast', role: 'status', text: msg });
  document.body.append(node);
  toastTimer = setTimeout(() => node.remove(), 3500);
}

function confirmBox(text) {
  const dlg = document.getElementById('confirmDlg');
  document.getElementById('confirmText').textContent = text;
  return new Promise(resolve => {
    const done = v => { dlg.close(); resolve(v); };
    document.getElementById('confirmYes').onclick = () => done(true);
    document.getElementById('confirmNo').onclick = () => done(false);
    dlg.oncancel = () => resolve(false);
    dlg.showModal();
  });
}

/** 25 mots distincts tirés au hasard (tirage cryptographique) */
function pickWords(lang) {
  const list = [...WORDS[lang]];
  const rnd = new Uint32Array(list.length);
  crypto.getRandomValues(rnd);
  for (let i = list.length - 1; i > 0; i--) {
    const j = rnd[i] % (i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.slice(0, 25);
}

/* ---------- Lecture de l'URL ---------- */
const params = new URLSearchParams(location.search);
const roomParam = (params.get('room') || '').toLowerCase();
const spyToken = (new URLSearchParams(location.hash.slice(1)).get('spy') || '').replace(/[^a-f0-9]/g, '');
const baseUrl = location.origin + location.pathname;
const playerUrl = code => `${baseUrl}?room=${code}`;
const spyUrl = (code, token) => `${playerUrl(code)}#spy=${token}`;

if (!Data.available) {
  app.append(el('p', { class: 'card error', text: t('err.action') }));
  return;
}
if (roomParam && ROOM_RE.test(roomParam)) startGame(roomParam, spyToken);
else renderHome();

/* ---------- Accueil ---------- */
function renderHome(errorKey) {
  let gridLang = Outils.lang;
  const segBtn = l => el('button', { type: 'button', 'aria-pressed': String(l === gridLang), text: l.toUpperCase(), onclick: e => {
    gridLang = l;
    e.currentTarget.parentElement.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
  } });
  const createErr = el('p', { class: 'error' });
  const createBtn = el('button', { class: 'btn primary big', type: 'button', text: t('home.create'), onclick: async () => {
    createBtn.disabled = true; createBtn.textContent = t('home.creating'); createErr.textContent = '';
    try {
      const { game_id, spy_token } = await Data.create(gridLang, pickWords(gridLang));
      // Le créateur arrive en vue espion, avec la fenêtre de partage ouverte
      history.replaceState(null, '', spyUrl(game_id, spy_token));
      sessionStorage.setItem('codenames.justCreated', game_id);
      location.reload();
    } catch (e) {
      createErr.textContent = t('err.create');
      createBtn.disabled = false; createBtn.textContent = t('home.create');
    }
  } });

  const codeInput = el('input', { type: 'text', maxlength: '10', placeholder: 'k3f9x2a7qm', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': t('home.code') });
  const joinErr = el('p', { class: 'error' });
  const join = e => {
    e.preventDefault();
    const code = codeInput.value.trim().toLowerCase();
    if (!ROOM_RE.test(code)) { joinErr.textContent = t('home.codeInvalid'); return; }
    location.href = playerUrl(code);
  };

  mount(
    el('h1', { class: 'grad-text', text: t('title') }),
    el('p', { class: 'sub', text: t('tagline') }),
    errorKey && el('p', { class: 'card error', text: t(errorKey) }),
    el('section', { class: 'card' },
      el('h2', { text: t('home.newGame') }),
      el('span', { class: 'label', text: t('home.gridLang') }),
      el('div', { class: 'seg', role: 'group', 'aria-label': t('home.gridLang') }, segBtn('fr'), segBtn('en')),
      createBtn, createErr
    ),
    el('section', { class: 'card' },
      el('h2', { text: t('home.join') }),
      el('form', { class: 'row', onsubmit: join }, codeInput, el('button', { class: 'btn primary', type: 'submit', text: t('home.joinBtn') })),
      joinErr
    ),
    el('section', { class: 'card' },
      el('h2', { text: t('home.rules') }),
      el('ol', { class: 'rules' }, ['home.rule1', 'home.rule2', 'home.rule3', 'home.rule4'].map(k => el('li', { text: t(k) })))
    )
  );
}

/* ---------- Partie ---------- */
async function startGame(code, token) {
  let game = null;          // état public (table codenames_games)
  let key = null;           // couleurs (vue espion uniquement)
  let keyRound = 0;
  let isSpy = Boolean(token);
  let live = false;
  let selected = null, selectTimer = 0;
  const pending = new Set();

  async function refresh() {
    try {
      const g = await Data.getGame(code);
      if (!g) { history.replaceState(null, '', baseUrl); renderHome('err.notFound'); return false; }
      await apply(g);
      return true;
    } catch (e) { return true; }
  }

  async function apply(g) {
    if (game && g.updated_at < game.updated_at) return; // ignore une réponse plus ancienne
    game = g;
    for (const i of [...pending]) if (game.revealed[i]) pending.delete(i);
    if (isSpy && keyRound !== game.round) {
      try { key = await Data.getKey(code, token); keyRound = game.round; }
      catch (e) { isSpy = false; key = null; toast(t('err.spy')); history.replaceState(null, '', playerUrl(code)); }
    }
    render();
  }

  const ok = await refresh();
  if (!ok) return;

  // Temps réel + rafraîchissement de secours (téléphone en veille, réseau capricieux…)
  Data.subscribe(code, g => apply(g), status => { live = status; renderLive(); });
  setInterval(() => { if (!live && !document.hidden) refresh(); }, POLL_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });

  if (sessionStorage.getItem('codenames.justCreated') === code) {
    sessionStorage.removeItem('codenames.justCreated');
    openShare();
  }

  function counts() {
    const total = { red: game.starting_team === 'red' ? 9 : 8, blue: game.starting_team === 'blue' ? 9 : 8 };
    const found = { red: 0, blue: 0 };
    for (const role of Object.values(game.revealed)) if (role in found) found[role]++;
    return { red: total.red - found.red, blue: total.blue - found.blue };
  }

  async function act(fn) {
    try { await fn(); }
    catch (e) { toast(t('err.action')); }
    if (!live) refresh(); // sans direct, on récupère tout de suite le nouvel état
  }

  function onCard(i) {
    if (isSpy || game.winner || game.revealed[i] || pending.has(i)) return;
    if (selected !== i) {           // 1er toucher : sélection
      selected = i;
      clearTimeout(selectTimer);
      selectTimer = setTimeout(() => { selected = null; render(); }, CONFIRM_MS);
      render();
      return;
    }
    selected = null;                // 2e toucher : retournement
    clearTimeout(selectTimer);
    pending.add(i);
    render();
    act(() => Data.reveal(code, i)).then(() => { pending.delete(i); render(); });
  }

  function renderLive() {
    const node = document.querySelector('.live');
    if (!node) return;
    node.classList.toggle('on', live);
    node.lastChild.textContent = live ? t('game.live') : t('game.offline');
  }

  function render() {
    const c = counts();
    const assassinFound = Object.values(game.revealed).includes('assassin');
    const grid = el('div', { class: 'grid', lang: game.lang },
      game.words.map((word, i) => {
        const role = game.revealed[i];
        const cls = ['word'];
        if (word.length > 11) cls.push('xlong'); else if (word.length > 8) cls.push('long');
        if (role) cls.push('revealed', 'is-' + role);
        else if (isSpy && key) cls.push('key-' + key[i]);
        if (selected === i) cls.push('selected');
        if (pending.has(i)) cls.push('pending');
        const label = role ? `${word} — ${t('role.' + role)}` : (isSpy && key ? `${word} — ${t('role.' + key[i])}` : word);
        return el('button', {
          class: cls.join(' '), type: 'button', 'aria-label': label,
          disabled: isSpy || Boolean(role) || Boolean(game.winner),
          title: selected === i ? t('game.tapAgain') : null,
          onclick: () => onCard(i)
        }, el('span', { text: word }));
      })
    );

    mount(
      el('div', { class: 'bar' },
        el('div', { class: 'chips' },
          el('span', { class: 'chip', text: t('game.code', { code }) }),
          el('span', { class: 'chip' + (isSpy ? ' spy' : ''), text: isSpy ? t('game.spyView') : t('game.playerView') }),
          el('span', { class: 'chip', text: t('game.grid', { lang: game.lang.toUpperCase() }) }),
          game.round > 1 && el('span', { class: 'chip', text: t('game.round', { n: game.round }) })
        ),
        el('span', { class: 'live' + (live ? ' on' : '') }, el('i'), live ? t('game.live') : t('game.offline'))
      ),
      game.winner
        ? el('div', { class: 'banner ' + game.winner },
            el('b', { text: game.winner === 'red' ? t('game.winRed') : t('game.winBlue') }),
            assassinFound && el('span', { text: t('game.assassin') }))
        : el('div', { class: 'scores' },
            el('div', { class: 'score red' }, el('b', { text: c.red }), el('small', { text: t('game.red') })),
            el('div', { class: 'turn ' + game.current_team, text: game.current_team === 'red' ? t('game.turnRed') : t('game.turnBlue') }),
            el('div', { class: 'score blue' }, el('small', { text: t('game.blue') }), el('b', { text: c.blue }))
          ),
      isSpy && el('p', { class: 'hint', text: t('game.spyHint') }),
      selected !== null && el('p', { class: 'hint', text: t('game.tapAgain') }),
      grid,
      el('div', { class: 'actions' },
        !game.winner && el('button', { class: 'btn', type: 'button', text: t('game.endTurn'), onclick: () => act(() => Data.endTurn(code)) }),
        el('button', { class: 'btn', type: 'button', text: t('game.share'), onclick: openShare }),
        isSpy && el('button', { class: 'btn primary', type: 'button', text: t('game.newRound'), onclick: async () => {
          if (await confirmBox(t('game.newRoundConfirm'))) act(() => Data.newRound(code, token, pickWords(game.lang)));
        } })
      ),
      el('button', { class: 'leave', type: 'button', text: t('game.home'), onclick: () => { location.href = baseUrl; } })
    );
  }

  /* ---------- Partage ---------- */
  function openShare() {
    const dlg = document.getElementById('shareDlg');
    const links = [['player', playerUrl(code)], ['spy', isSpy ? spyUrl(code, token) : null]];
    document.getElementById('spyShare').hidden = !isSpy;
    for (const [kind, url] of links) {
      if (!url) continue;
      const input = document.getElementById(kind + 'Link');
      input.value = url;
      const copy = document.getElementById('copy' + (kind === 'spy' ? 'Spy' : 'Player'));
      copy.onclick = async () => {
        try { await navigator.clipboard.writeText(url); } catch (e) { input.select(); document.execCommand('copy'); }
        copy.textContent = t('share.copied');
        setTimeout(() => { copy.textContent = t('share.copy'); }, 1500);
      };
      const send = document.getElementById('send' + (kind === 'spy' ? 'Spy' : 'Player'));
      send.hidden = !navigator.share;
      send.onclick = () => navigator.share({ title: t('title'), url }).catch(() => {});
    }
    document.getElementById('shareClose').onclick = () => dlg.close();
    dlg.showModal();
  }
}
})();
