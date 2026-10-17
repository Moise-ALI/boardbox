/* Thèmes des associations, partagés par le jeu et la page de modération.
   L'id est stocké en base (colonne theme) : ne jamais renommer un id existant.
   Pour ajouter un thème : une ligne ici + des paires dans mots.js (aucune migration SQL nécessaire). */
window.UNDERCOVER_THEMES = [
  { id: 'animaux',     icon: '🐾', label: { fr: 'Animaux', en: 'Animals' } },
  { id: 'nourriture',  icon: '🍕', label: { fr: 'Nourriture & boissons', en: 'Food & drinks' } },
  { id: 'maison',      icon: '🏠', label: { fr: 'Maison & objets', en: 'Home & objects' } },
  { id: 'mode',        icon: '👕', label: { fr: 'Vêtements & mode', en: 'Clothes & fashion' } },
  { id: 'lieux',       icon: '🗺️', label: { fr: 'Lieux & voyages', en: 'Places & travel' } },
  { id: 'transports',  icon: '🚲', label: { fr: 'Transports', en: 'Transport' } },
  { id: 'metiers',     icon: '🧑‍🔧', label: { fr: 'Métiers', en: 'Jobs' } },
  { id: 'sport',       icon: '⚽', label: { fr: 'Sports & loisirs', en: 'Sports & hobbies' } },
  { id: 'nature',      icon: '🌦️', label: { fr: 'Nature & météo', en: 'Nature & weather' } },
  { id: 'fetes',       icon: '🎉', label: { fr: 'Fêtes & moments', en: 'Celebrations & moments' } },
  { id: 'tech',        icon: '📱', label: { fr: 'Tech & internet', en: 'Tech & internet' } },
  { id: 'culture',     icon: '🎬', label: { fr: 'Films, séries & musique', en: 'Movies, TV & music' } },
  { id: 'fantastique', icon: '🐉', label: { fr: 'Fantastique & légendes', en: 'Fantasy & legends' } },
  { id: 'jeux-video',  icon: '🎮', label: { fr: 'Jeux vidéo', en: 'Video games' } },
  { id: 'anime',       icon: '🍥', label: { fr: 'Anime & manga', en: 'Anime & manga' } }
];
window.UNDERCOVER_DEFAULT_THEME = 'animaux';
