/* Modération des associations Undercover (réservée aux admins, interface en français uniquement).
   Les droits réels sont garantis côté base (RLS + is_admin()), pas par cette page. */
(() => {
'use strict';
Outils.bindThemeButton(document.getElementById('themeBtn'));
const $ = id => document.getElementById(id);
const cfg = window.UNDERCOVER_CONFIG || {};

if (!cfg.supabaseUrl || !cfg.supabaseKey) { $('noConfig').hidden = false; return; }
if (!window.supabase) {
  $('noConfig').textContent = 'La bibliothèque Supabase n\'a pas pu être chargée (connexion, ou bloqueur de publicités : autorisez cdn.jsdelivr.net sur cette page).';
  $('noConfig').hidden = false;
  return;
}

const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
  auth: { storageKey: 'undercover.admin.auth', persistSession: true, detectSessionInUrl: true }
});
const TABLE = 'undercover_pairs';
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
    options: { emailRedirectTo: location.origin + location.pathname }
  });
  if (error) { msg.className = 'msg err'; msg.textContent = 'Erreur : ' + error.message; return; }
  msg.textContent = 'Lien envoyé ! Ouvrez l\'e-mail sur cet appareil et cliquez sur le lien.';
});
$('logout').onclick = async () => { await db.auth.signOut(); refreshView(); };
db.auth.onAuthStateChange(() => refreshView());

/* ---------- Liste ---------- */
document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
  current = b.dataset.status;
  document.querySelectorAll('.tabs button').forEach(x => x.setAttribute('aria-pressed', x === b));
  load();
}));

async function load() {
  const list = $('list');
  list.replaceChildren(el('li', { class: 'empty', text: 'Chargement…' }));
  const { data, error } = await db.from(TABLE).select('*').eq('status', current).order('created_at', { ascending: current === 'pending' });
  if (error) { list.replaceChildren(el('li', { class: 'empty', text: 'Erreur : ' + error.message })); return; }
  const counts = await Promise.all(['pending', 'approved', 'rejected'].map(s => db.from(TABLE).select('id', { count: 'exact', head: true }).eq('status', s)));
  const labels = { pending: 'En attente', approved: 'Validées', rejected: 'Refusées' };
  document.querySelectorAll('.tabs button').forEach((b, i) => { b.textContent = `${labels[b.dataset.status]} (${counts[i].count ?? 0})`; });
  if (!data.length) { list.replaceChildren(el('li', { class: 'empty', text: 'Rien ici.' })); return; }
  list.replaceChildren(...data.map(renderItem));
}

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

function renderItem(row) {
  const date = new Date(row.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  const lang = el('span', { class: 'lang', text: (row.lang || 'fr').toUpperCase() });
  if (row.status === 'pending') {
    const a = el('input', { type: 'text', maxlength: '30', value: row.word_a, 'aria-label': 'Mot 1' });
    const b = el('input', { type: 'text', maxlength: '30', value: row.word_b, 'aria-label': 'Mot 2' });
    const theme = themeSelect(row.theme);
    return el('li', { class: 'item' },
      el('div', { class: 'words' }, a, b, theme),
      el('div', { class: 'meta' }, 'Proposée le ' + date + ' · mots et thème modifiables avant validation', lang),
      el('div', { class: 'actions' },
        el('button', { class: 'btn small danger', type: 'button', text: 'Refuser', onclick: () => update(row.id, { status: 'rejected' }) }),
        el('button', { class: 'btn small ok', type: 'button', text: 'Valider', onclick: () => update(row.id, { word_a: a.value.trim(), word_b: b.value.trim(), theme: theme.value, status: 'approved' }) })
      )
    );
  }
  return el('li', { class: 'item' },
    el('div', { class: 'plain' }, `${row.word_a}  ·  ${row.word_b}`, lang),
    el('div', { class: 'words' }, themeSelect(row.theme, e => update(row.id, { theme: e.target.value }, false))),
    el('div', { class: 'meta', text: 'Proposée le ' + date }),
    el('div', { class: 'actions' },
      row.status === 'approved'
        ? el('button', { class: 'btn small', type: 'button', text: 'Retirer du jeu', onclick: () => update(row.id, { status: 'rejected' }) })
        : el('button', { class: 'btn small', type: 'button', text: 'Valider finalement', onclick: () => update(row.id, { status: 'approved' }) }),
      el('button', { class: 'btn small danger', type: 'button', text: 'Supprimer', onclick: () => { if (confirm('Supprimer définitivement ?')) remove(row.id); } })
    )
  );
}

async function update(id, fields, reload = true) {
  const { error } = await db.from(TABLE).update({ ...fields, reviewed_at: new Date().toISOString() }).eq('id', id);
  if (error) return alert(error.code === '23505' ? 'Cette association existe déjà.' : 'Erreur : ' + error.message);
  if (reload) load();
}
async function remove(id) {
  const { error } = await db.from(TABLE).delete().eq('id', id);
  if (error) return alert('Erreur : ' + error.message);
  load();
}

$('addForm').addEventListener('submit', async e => {
  e.preventDefault();
  const a = $('addA').value.trim(), b = $('addB').value.trim();
  if (!a || !b || a.toLowerCase() === b.toLowerCase()) return alert('Deux mots différents.');
  const { error } = await db.from(TABLE).insert({ word_a: a, word_b: b, theme: $('addTheme').value, lang: $('addLang').value, status: 'approved', reviewed_at: new Date().toISOString() });
  if (error) return alert(error.code === '23505' ? 'Cette association existe déjà.' : 'Erreur : ' + error.message);
  $('addA').value = ''; $('addB').value = '';
  if (current === 'approved') load(); else document.querySelector('[data-status="approved"]').click();
});

refreshView();
})();
