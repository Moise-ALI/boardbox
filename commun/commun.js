/* Utilitaires communs à tous les outils. Chargé dans le <head> : il applique le thème
   et la langue AVANT l'affichage (pas de flash).
   Tous les outils partagent le même localStorage (même domaine github.io) :
   chaque outil DOIT passer par createStore('<nom-outil>') pour préfixer ses clés. */
(function () {
  'use strict';

  function createStore(prefix) {
    const full = k => prefix + '.' + k;
    return {
      get(key, fallback) {
        try { const v = localStorage.getItem(full(key)); return v ? JSON.parse(v) : fallback; }
        catch (e) { return fallback; }
      },
      set(key, value) {
        try { localStorage.setItem(full(key), JSON.stringify(value)); } catch (e) { /* stockage plein ou bloqué */ }
      },
      remove(key) {
        try { localStorage.removeItem(full(key)); } catch (e) { /* ignoré */ }
      }
    };
  }
  const prefs = createStore('outils');

  /* ---------- Thème clair/sombre ---------- */
  function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
  }
  function currentTheme() {
    return document.documentElement.dataset.theme
      || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  applyTheme(prefs.get('theme', null));

  function bindThemeButton(button) {
    if (!button) return;
    button.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      prefs.set('theme', next);
    });
  }

  /* ---------- Langue ---------- */
  const LANGS = ['fr', 'en'];
  const saved = prefs.get('lang', null);
  const lang = LANGS.includes(saved) ? saved
    : ((navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en');
  document.documentElement.lang = lang;

  // Textes communs à toutes les pages (barre du haut)
  const COMMON = {
    fr: { 'common.back': '← Boîte à outils', 'common.theme': 'Changer de thème', 'common.lang': 'Switch to English' },
    en: { 'common.back': '← Toolbox', 'common.theme': 'Change theme', 'common.lang': 'Passer en français' }
  };

  /** Crée la fonction de traduction d'une page : t('cle', { variable: valeur }).
      Repli : langue courante → français → la clé elle-même (visible, donc facile à repérer). */
  function i18n(dict) {
    return function t(key, vars) {
      const pick = l => (dict[l] && dict[l][key]) ?? COMMON[l][key];
      let s = pick(lang) ?? pick('fr') ?? key;
      if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
      return s;
    };
  }

  /** Traduit le HTML statique : data-i18n (texte), data-i18n-placeholder, data-i18n-aria-label, data-i18n-title. */
  function applyI18n(t, root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    for (const attr of ['placeholder', 'aria-label', 'title']) {
      scope.querySelectorAll(`[data-i18n-${attr}]`).forEach(el => el.setAttribute(attr, t(el.getAttribute(`data-i18n-${attr}`))));
    }
  }

  function bindLangButton(button) {
    if (!button) return;
    const other = lang === 'fr' ? 'en' : 'fr';
    button.textContent = other.toUpperCase();
    button.setAttribute('aria-label', COMMON[lang]['common.lang']);
    button.addEventListener('click', () => { prefs.set('lang', other); location.reload(); });
  }

  /** Barre du haut standard : boutons #themeBtn et #langBtn. */
  function initTopbar() {
    bindThemeButton(document.getElementById('themeBtn'));
    bindLangButton(document.getElementById('langBtn'));
  }

  window.Outils = { createStore, bindThemeButton, bindLangButton, initTopbar, lang, i18n, applyI18n };
})();
