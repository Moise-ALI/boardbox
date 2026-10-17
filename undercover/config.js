/* Connexion à Supabase pour les associations de la communauté.
   Ces deux valeurs sont PUBLIQUES par conception : la sécurité repose sur les règles
   Row Level Security de supabase/undercover.sql (lecture des paires validées et
   propositions en attente pour tous, validation réservée aux admins).
   Ne JAMAIS mettre ici la clé "secret" ou "service_role".
   Laisser vide = le jeu fonctionne avec les paires intégrées uniquement. */
window.UNDERCOVER_CONFIG = {
  supabaseUrl: '',
  supabaseKey: ''
};
