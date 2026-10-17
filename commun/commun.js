/* Utilitaires communs à tous les outils.
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

  // Thème clair/sombre partagé par tous les outils
  const themeStore = createStore('outils');
  function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
  }
  function currentTheme() {
    return document.documentElement.dataset.theme
      || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  applyTheme(themeStore.get('theme', null));

  function bindThemeButton(button) {
    if (!button) return;
    button.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      themeStore.set('theme', next);
    });
  }

  window.Outils = { createStore, bindThemeButton };
})();
