/* Accès aux associations de la communauté (Supabase, API REST).
   Le jeu n'en dépend pas : en cas d'échec, il continue avec les paires intégrées. */
(function () {
  'use strict';

  const sb = window.BOARDBOX_SUPABASE || {};
  const cfg = { supabaseUrl: sb.url, supabaseKey: sb.key };
  const enabled = Boolean(cfg.supabaseUrl && cfg.supabaseKey);
  const base = enabled ? cfg.supabaseUrl.replace(/\/+$/, '') + '/rest/v1/undercover_pairs' : '';

  function headers(extra) {
    const h = { apikey: cfg.supabaseKey, 'Content-Type': 'application/json' };
    // Anciennes clés "anon" (JWT) : à envoyer aussi en Authorization. Les clés "publishable" non.
    if (cfg.supabaseKey.startsWith('eyJ')) h.Authorization = 'Bearer ' + cfg.supabaseKey;
    return Object.assign(h, extra);
  }

  function withTimeout(ms) {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), ms);
    return ctrl.signal;
  }

  /** Paires validées : [{ id, word_a, word_b, theme, lang }]. Renvoie [] si indisponible. */
  async function loadApproved() {
    if (!enabled) return [];
    try {
      const res = await fetch(base + '?select=id,word_a,word_b,theme,lang&status=eq.approved&order=id', {
        headers: headers(), signal: withTimeout(6000)
      });
      if (!res.ok) return [];
      const rows = await res.json();
      return Array.isArray(rows) ? rows : [];
    } catch (e) {
      return [];
    }
  }

  /** Propose une paire. Renvoie { ok: true } ou { ok: false, reason: 'doublon' | 'invalide' | 'reseau' }. */
  async function submit(wordA, wordB, theme, lang) {
    if (!enabled) return { ok: false, reason: 'reseau' };
    const a = wordA.trim(), b = wordB.trim();
    const knownTheme = (window.UNDERCOVER_THEMES || []).some(t => t.id === theme);
    if (!a || !b || a.length > 30 || b.length > 30 || a.toLowerCase() === b.toLowerCase() || !knownTheme) {
      return { ok: false, reason: 'invalide' };
    }
    try {
      const res = await fetch(base, {
        method: 'POST',
        // return=minimal : les paires en attente ne sont pas relisibles par le public
        headers: headers({ Prefer: 'return=minimal' }),
        body: JSON.stringify({ word_a: a, word_b: b, theme, lang: lang === 'en' ? 'en' : 'fr' }),
        signal: withTimeout(8000)
      });
      if (res.ok) return { ok: true };
      if (res.status === 409) return { ok: false, reason: 'doublon' };
      if (res.status === 400) {
        // P0001 = file d'attente pleine (trigger anti-saturation) : présenté comme une indisponibilité
        const body = await res.json().catch(() => ({}));
        return { ok: false, reason: body.code === 'P0001' ? 'reseau' : 'invalide' };
      }
      return { ok: false, reason: 'reseau' };
    } catch (e) {
      return { ok: false, reason: 'reseau' };
    }
  }

  window.UndercoverDonnees = { enabled, loadApproved, submit };
})();
