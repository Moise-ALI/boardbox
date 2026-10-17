/* Modération des associations Undercover (réservée aux admins, interface en français uniquement).
   Les droits réels sont garantis côté base (RLS + is_admin() + fonctions SQL), pas par cette page.
   Chaque association existe en FR et en EN : les deux versions partagent un group_id. */
(() => {
'use strict';
// Anti-clickjacking : GitHub Pages ne permet ni X-Frame-Options ni CSP frame-ancestors
// (ignoré dans une balise <meta>). Chargée dans un cadre, la page se vide et ne fait rien.
if (window.top !== window.self) {
  document.body.replaceChildren();
  return;
}
Outils.bindThemeButton(document.getElementById('themeBtn'));
const $ = id => document.getElementById(id);
const sb = window.OUTILS_SUPABASE || {};
const cfg = { supabaseUrl: sb.url, supabaseKey: sb.key };

if (!cfg.supabaseUrl || !cfg.supabaseKey) { $('noConfig').hidden = false; return; }
if (!window.supabase) {
  $('noConfig').textContent = 'La bibliothèque Supabase n\'a pas pu être chargée (connexion, ou bloqueur de publicités : autorisez cdn.jsdelivr.net sur cette page).';
  $('noConfig').hidden = false;
  return;
}

// Session admin limitée à l'onglet (sessionStorage) : elle disparaît à la fermeture et n'est pas
// lisible depuis les autres outils du domaine. On efface l'ancienne session gardée en localStorage.
try { localStorage.removeItem('undercover.admin.auth'); } catch (e) { /* stockage bloqué */ }
const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
  // flowType 'implicit' (explicite) : le lien reçu par e-mail s'ouvre dans un NOUVEL onglet ; en PKCE il lui
  // manquerait le code stocké dans le sessionStorage de l'onglet d'origine et la connexion échouerait.
  auth: { storageKey: 'undercover.admin.auth', storage: window.sessionStorage, persistSession: true, detectSessionInUrl: true, flowType: 'implicit' }
});
const TABLE = 'undercover_pairs';
const LANGS = ['fr', 'en'];
const other = lang => (lang === 'fr' ? 'en' : 'fr');
let current = 'pending';

function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'text') node.textContent = v;
    else if (k === 'value') node.value = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) node.append(c);
  return node;
}

function errorText(error) {
  if (!error) return '';
  if (error.code === '23505') return 'Cette association existe déjà dans cette langue.';
  if (error.code === '42501') return 'Action réservée aux administrateurs.';
  if (error.code === 'P0002') return 'Paire introuvable (déjà supprimée ?).';
  if (error.code === '23514') return 'Valeurs refusées : deux mots différents, 30 caractères maximum.';
  return 'Erreur : ' + error.message;
}

/* ---------- Session ---------- */
async function refreshView() {
  const { data: { session } } = await db.auth.getSession();
  $('loginView').hidden = Boolean(session);
  $('adminView').hidden = !session;
  if (!session) return;
  $('whoami').textContent = 'Connecté : ' + session.user.email;
  const { data: isAdmin } = await db.rpc('is_admin');
  $('notAdmin').hidden = Boolean(isAdmin);
  load();
}

$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('loginMsg');
  msg.className = 'msg'; msg.textContent = 'Envoi…';
  const { error } = await db.auth.signInWithOtp({
    email: $('email').value.trim(),
    options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: false }
  });
  if (error) { msg.className = 'msg err'; msg.textContent = 'Erreur : ' + error.message; return; }
  msg.textContent = 'Lien envoyé ! Ouvrez l\'e-mail sur cet appareil et cliquez sur le lien.';
});
$('logout').onclick = async () => { await db.auth.signOut(); refreshView(); };
db.auth.onAuthStateChange(() => refreshView());

/* ---------- Thèmes ---------- */
const THEMES = window.UNDERCOVER_THEMES || [];
function themeSelect(value, onchange) {
  const s = el('select', { 'aria-label': 'Thème', onchange },
    THEMES.map(t => el('option', { value: t.id, text: `${t.icon} ${t.label.fr}` })));
  // Thème inconnu (supprimé de themes.js) : on l'affiche quand même pour ne pas le perdre
  if (value && !THEMES.some(t => t.id === value)) s.prepend(el('option', { value, text: '? ' + value }));
  s.value = value || window.UNDERCOVER_DEFAULT_THEME;
  return s;
}
$('addTheme').append(...themeSelect(window.UNDERCOVER_DEFAULT_THEME).children);
$('addTheme').value = window.UNDERCOVER_DEFAULT_THEME; // la sélection ne suit pas les options déplacées

/* ---------- Chargement ---------- */
document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
  current = b.dataset.status;
  document.querySelectorAll('.tabs button').forEach(x => x.setAttribute('aria-pressed', x === b));
  load();
}));

/** Regroupe les lignes par group_id : [{ id, theme, created_at, fr: row|undefined, en: row|undefined }] */
function groupRows(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.group_id)) map.set(r.group_id, { id: r.group_id, theme: r.theme, created_at: r.created_at, fr: undefined, en: undefined });
    const g = map.get(r.group_id);
    g[r.lang] = r;
    if (r.created_at < g.created_at) g.created_at = r.created_at;
  }
  return [...map.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

async function load() {
  const list = $('list');
  list.replaceChildren(el('li', { class: 'empty', text: 'Chargement…' }));
  const { data: rows, error } = await db.from(TABLE).select('id,word_a,word_b,theme,lang,status,group_id,created_at').order('created_at');
  if (error) { list.replaceChildren(el('li', { class: 'empty', text: errorText(error) })); return; }

  const pending = rows.filter(r => r.status === 'pending');
  const approved = groupRows(rows.filter(r => r.status === 'approved'));
  const rejected = groupRows(rows.filter(r => r.status === 'rejected'));
  const missing = approved.filter(g => !g.fr || !g.en).length;
  const label = { pending: `En attente (${pending.length})`, approved: `Validées (${approved.length}${missing ? ` · ${missing} à traduire` : ''})`, rejected: `Refusées (${rejected.length})` };
  document.querySelectorAll('.tabs button').forEach(b => { b.textContent = label[b.dataset.status]; });

  const items = current === 'pending' ? pending.map(renderPending)
    : (current === 'approved' ? approved : rejected).map(renderGroup);
  list.replaceChildren(...(items.length ? items : [el('li', { class: 'empty', text: 'Rien ici.' })]));
}

/* ---------- Proposition en attente : correction + traduction obligatoire ---------- */
function renderPending(row) {
  const date = new Date(row.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  const tr = other(row.lang);
  const a = el('input', { type: 'text', maxlength: '30', value: row.word_a, 'aria-label': 'Mot 1' });
  const b = el('input', { type: 'text', maxlength: '30', value: row.word_b, 'aria-label': 'Mot 2' });
  const ta = el('input', { type: 'text', maxlength: '30', placeholder: `Traduction ${tr.toUpperCase()} – mot 1`, 'aria-label': `Traduction ${tr} du mot 1` });
  const tb = el('input', { type: 'text', maxlength: '30', placeholder: `Traduction ${tr.toUpperCase()} – mot 2`, 'aria-label': `Traduction ${tr} du mot 2` });
  const theme = themeSelect(row.theme);
  const approve = el('button', { class: 'btn small ok', type: 'button', text: 'Valider avec la traduction', disabled: true });
  const refresh = () => { approve.disabled = !(a.value.trim() && b.value.trim() && ta.value.trim() && tb.value.trim()); };
  [a, b, ta, tb].forEach(i => i.addEventListener('input', refresh));

  approve.onclick = async () => {
    if (ta.value.trim().toLowerCase() === tb.value.trim().toLowerCase()) return alert('Les deux mots traduits doivent être différents.');
    approve.disabled = true;
    const { error } = await db.rpc('undercover_approve', {
      p_id: row.id, p_word_a: a.value, p_word_b: b.value, p_theme: theme.value, p_tr_word_a: ta.value, p_tr_word_b: tb.value
    });
    if (error) { alert(errorText(error)); refresh(); return; }
    load();
  };

  return el('li', { class: 'item' },
    el('div', { class: 'lang-line' }, el('span', { class: 'lang', text: row.lang.toUpperCase() }), a, b),
    el('div', { class: 'lang-line tr' }, el('span', { class: 'lang', text: tr.toUpperCase() }), ta, tb),
    el('div', { class: 'words' }, theme),
    el('div', { class: 'meta', text: `Proposée le ${date} · corrigez si besoin, puis traduisez pour valider` }),
    el('div', { class: 'actions' },
      el('button', { class: 'btn small danger', type: 'button', text: 'Refuser', onclick: async () => {
        const { error } = await db.from(TABLE).update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', row.id);
        if (error) return alert(errorText(error));
        load();
      } }),
      approve
    )
  );
}

/* ---------- Association validée / refusée : les deux langues ensemble ---------- */
function renderGroup(g) {
  const date = new Date(g.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  const lines = LANGS.map(lang => {
    const row = g[lang];
    if (row) return el('div', { class: 'lang-line' }, el('span', { class: 'lang', text: lang.toUpperCase() }), el('span', { class: 'plain', text: `${row.word_a}  ·  ${row.word_b}` }));
    // Traduction manquante : saisie directe
    const source = g[other(lang)];
    const ta = el('input', { type: 'text', maxlength: '30', placeholder: `${lang.toUpperCase()} – mot 1`, 'aria-label': `Traduction ${lang} du mot 1` });
    const tb = el('input', { type: 'text', maxlength: '30', placeholder: `${lang.toUpperCase()} – mot 2`, 'aria-label': `Traduction ${lang} du mot 2` });
    const save = el('button', { class: 'btn small primary', type: 'button', text: 'Ajouter', onclick: async () => {
      if (!ta.value.trim() || !tb.value.trim()) return alert('Remplissez les deux mots.');
      const { error } = await db.rpc('undercover_set_translation', { p_id: source.id, p_word_a: ta.value, p_word_b: tb.value });
      if (error) return alert(errorText(error));
      load();
    } });
    return el('div', { class: 'lang-line tr' }, el('span', { class: 'lang', text: lang.toUpperCase() }), ta, tb, save);
  });

  const setGroup = async fields => {
    const { error } = await db.from(TABLE).update({ ...fields, reviewed_at: new Date().toISOString() }).eq('group_id', g.id);
    if (error) return alert(errorText(error));
    load();
  };

  return el('li', { class: 'item' },
    ...lines,
    el('div', { class: 'words' }, themeSelect(g.theme, e => setGroup({ theme: e.target.value }))),
    el('div', { class: 'meta' }, `Proposée le ${date} `, (!g.fr || !g.en) && el('span', { class: 'missing', text: 'Traduction manquante' })),
    el('div', { class: 'actions' },
      current === 'approved'
        ? el('button', { class: 'btn small', type: 'button', text: 'Retirer du jeu', onclick: () => setGroup({ status: 'rejected' }) })
        : el('button', { class: 'btn small', type: 'button', text: 'Valider finalement', onclick: () => setGroup({ status: 'approved' }) }),
      el('button', { class: 'btn small danger', type: 'button', text: 'Supprimer (FR + EN)', onclick: async () => {
        if (!confirm('Supprimer définitivement cette association dans les deux langues ?')) return;
        const { error } = await db.from(TABLE).delete().eq('group_id', g.id);
        if (error) return alert(errorText(error));
        load();
      } })
    )
  );
}

/* ---------- Ajout direct FR + EN ---------- */
$('addForm').addEventListener('submit', async e => {
  e.preventDefault();
  const v = id => $(id).value.trim();
  if (v('addFrA').toLowerCase() === v('addFrB').toLowerCase() || v('addEnA').toLowerCase() === v('addEnB').toLowerCase()) {
    return alert('Dans chaque langue, les deux mots doivent être différents.');
  }
  const { error } = await db.rpc('undercover_add', {
    p_theme: $('addTheme').value, p_fr_a: v('addFrA'), p_fr_b: v('addFrB'), p_en_a: v('addEnA'), p_en_b: v('addEnB')
  });
  if (error) return alert(errorText(error));
  ['addFrA', 'addFrB', 'addEnA', 'addEnB'].forEach(id => { $(id).value = ''; });
  if (current === 'approved') load(); else document.querySelector('[data-status="approved"]').click();
});

refreshView();
})();
