/* Accès Supabase de CodeName : fonctions SQL (supabase/codenames.sql) + temps réel.
   Aucune session n'est créée ni stockée : tout passe par la clé publique et les fonctions
   security definer, qui valident les entrées et gardent la grille des couleurs secrète. */
window.CodenamesDonnees = (function () {
  'use strict';

  const sb = window.OUTILS_SUPABASE || {};
  const db = (window.supabase && sb.url && sb.key)
    ? window.supabase.createClient(sb.url, sb.key, {
        // detectSessionInUrl: false — le # de l'URL contient le jeton espion, pas une session
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      })
    : null;

  const ok = ({ data, error }) => { if (error) throw error; return data; };

  return {
    available: Boolean(db),

    async create(lang, words) {
      const rows = ok(await db.rpc('codenames_create', { p_lang: lang, p_words: words }));
      return rows[0]; // { game_id, spy_token }
    },

    async getGame(id) {
      return ok(await db.from('codenames_games').select('*').eq('id', id).maybeSingle());
    },

    async getKey(id, token) {
      return ok(await db.rpc('codenames_key', { p_id: id, p_token: token }));
    },

    async reveal(id, index) {
      ok(await db.rpc('codenames_reveal', { p_id: id, p_index: index }));
    },

    async endTurn(id) {
      ok(await db.rpc('codenames_end_turn', { p_id: id }));
    },

    async newRound(id, token, words) {
      ok(await db.rpc('codenames_new_round', { p_id: id, p_token: token, p_words: words }));
    },

    /** Écoute les changements de la partie. onStatus(true/false) indique si le direct fonctionne.
        Renvoie une fonction pour se désabonner. */
    subscribe(id, onChange, onStatus) {
      const channel = db.channel('codenames-' + id)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'codenames_games', filter: 'id=eq.' + id },
          payload => onChange(payload.new))
        .subscribe(status => onStatus(status === 'SUBSCRIBED'));
      return () => db.removeChannel(channel);
    }
  };
})();
