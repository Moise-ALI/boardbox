/* Page d'accueil : registre des outils + traductions. */
(() => {
'use strict';

/* Registre des outils : pour en ajouter un, créez son dossier, ajoutez une ligne ici
   et ses textes (name/desc/keywords) dans les deux langues. Les mots-clés servent
   seulement à la recherche : des mots qu'on taperait sans connaître le nom de l'outil. */
const TOOLS = [
  { path: 'tirage/', icon: '🎲', name: 'tirage.name', desc: 'tirage.desc', keywords: 'tirage.keywords' },
  { path: 'qui-commence/', icon: '👆', name: 'quiCommence.name', desc: 'quiCommence.desc', keywords: 'quiCommence.keywords' },
  { path: 'compteur/', icon: '🧮', name: 'compteur.name', desc: 'compteur.desc', keywords: 'compteur.keywords' },
  { path: 'minuteur/', icon: '⏳', name: 'minuteur.name', desc: 'minuteur.desc', keywords: 'minuteur.keywords' },
  { path: 'brise-glace/', icon: '💬', name: 'briseGlace.name', desc: 'briseGlace.desc', keywords: 'briseGlace.keywords' },
  { path: 'pere-noel/', icon: '🎅', name: 'pereNoel.name', desc: 'pereNoel.desc', keywords: 'pereNoel.keywords' },
  { path: 'undercover/', icon: '🎭', name: 'undercover.name', desc: 'undercover.desc', keywords: 'undercover.keywords' },
  { path: 'codenames/', icon: '🕵️', name: 'codenames.name', desc: 'codenames.desc', keywords: 'codenames.keywords' }
];

const SEARCH_MAX_LENGTH = 40;   // aussi en maxlength dans index.html

const t = BoardBox.i18n({
  fr: {
    title: 'BoardBox',
    lead: 'Mes petites applis du quotidien, utilisables depuis n\'importe quel appareil. Les données restent dans votre navigateur.',
    count: '{n} outils',
    'install.title': 'Installer l\'appli',
    'install.android': 'Une icône sur l\'écran d\'accueil, en plein écran, et ça marche même hors connexion.',
    'install.ios': 'Sur iPhone : touchez Partager (carré avec une flèche), puis « Sur l\'écran d\'accueil ».',
    'install.button': 'Installer',
    'install.dismiss': 'Masquer',
    'search.label': 'Rechercher un outil',
    'search.placeholder': 'Rechercher un outil…',
    'search.count': '{n} / {total} outils',
    'search.empty': 'Aucun outil ne correspond.',
    'tirage.name': 'Tirage & Équipes',
    'tirage.desc': 'Tirez au sort dans une liste ou répartissez-la en équipes équilibrées.',
    'tirage.keywords': 'hasard aléatoire random dé roue choisir décider groupes',
    'quiCommence.name': 'Qui commence ?',
    'quiCommence.desc': 'Chacun pose un doigt sur l\'écran : l\'appli désigne qui commence, ou tout l\'ordre de jeu.',
    'quiCommence.keywords': 'premier joueur doigts hasard tirage ordre',
    'compteur.name': 'Compteur de points',
    'compteur.desc': 'Comptez les scores des soirées jeux : une tuile colorée par joueur, objectif et manches.',
    'compteur.keywords': 'score marque points joueurs classement',
    'minuteur.name': 'Minuteur de tours',
    'minuteur.desc': 'Un sablier par tour ou une pendule par joueur : on touche l\'écran pour passer la main.',
    'minuteur.keywords': 'chrono chronomètre temps timer horloge pendule échecs',
    'briseGlace.name': 'Brise-glace',
    'briseGlace.desc': 'Des cartes de questions pour lancer la conversation aux repas et aux soirées.',
    'briseGlace.keywords': 'questions conversation discussion repas dîner apéro famille couple amis cartes',
    'pereNoel.name': 'Père Noël secret',
    'pereNoel.desc': 'Tirage des cadeaux sans inscription : chacun reçoit un lien qui ne révèle que sa propre personne à gâter.',
    'pereNoel.keywords': 'secret santa noël cadeaux échange famille amis tirage',
    'undercover.name': 'Undercover',
    'undercover.desc': 'Le jeu d\'ambiance sur un seul téléphone : civils, undercovers et Mister White.',
    'undercover.keywords': 'jeu mots imposteur ambiance soirée',
    'codenames.name': 'CodeName',
    'codenames.desc': 'Jeu d\'espions en équipes : vue espion et vue joueur synchronisées en direct sur vos téléphones.',
    'codenames.keywords': 'jeu mots espions grille indices'
  },
  en: {
    title: 'BoardBox',
    lead: 'My everyday little apps, available from any device. Your data stays in your browser.',
    count: '{n} tools',
    'install.title': 'Install the app',
    'install.android': 'An icon on your home screen, full screen, and it even works offline.',
    'install.ios': 'On iPhone: tap Share (square with an arrow), then "Add to Home Screen".',
    'install.button': 'Install',
    'install.dismiss': 'Hide',
    'search.label': 'Search for a tool',
    'search.placeholder': 'Search for a tool…',
    'search.count': '{n} / {total} tools',
    'search.empty': 'No tool matches.',
    'tirage.name': 'Draw & Teams',
    'tirage.desc': 'Draw random picks from a list or split it into balanced teams.',
    'tirage.keywords': 'random dice wheel pick choose decide groups raffle',
    'quiCommence.name': 'Who goes first?',
    'quiCommence.desc': 'Everyone puts a finger on the screen: the app picks who starts, or the whole turn order.',
    'quiCommence.keywords': 'first player fingers random pick order',
    'compteur.name': 'Score counter',
    'compteur.desc': 'Keep score on game nights: one colour tile per player, target score and rounds.',
    'compteur.keywords': 'points tally scoreboard players ranking',
    'minuteur.name': 'Turn timer',
    'minuteur.desc': 'An hourglass per turn or a chess clock per player: tap the screen to pass the turn.',
    'minuteur.keywords': 'stopwatch time clock countdown chess sand',
    'briseGlace.name': 'Icebreakers',
    'briseGlace.desc': 'Question cards to get the conversation going at dinners and parties.',
    'briseGlace.keywords': 'questions conversation talk dinner party family couple friends cards',
    'pereNoel.name': 'Secret Santa',
    'pereNoel.desc': 'Gift draw with no sign-up: everyone gets a link that only reveals who they are buying for.',
    'pereNoel.keywords': 'christmas gifts presents exchange family friends draw',
    'undercover.name': 'Undercover',
    'undercover.desc': 'The party game on a single phone: civilians, undercovers and Mr. White.',
    'undercover.keywords': 'game words impostor party',
    'codenames.name': 'CodeName',
    'codenames.desc': 'Team spy game: spymaster and player views synced live across your phones.',
    'codenames.keywords': 'game words spies grid clues'
  }
});

BoardBox.initTopbar();
BoardBox.applyI18n(t);

/* ---------- Encart « Installer l'appli » ---------- */
(function installPrompt() {
  const prefs = BoardBox.createStore('boardbox');
  const box = document.getElementById('install');
  const btn = document.getElementById('installBtn');
  const text = document.getElementById('installText');
  if (BoardBox.isInstalled() || prefs.get('installDismissed', false)) return;
  const hide = () => { box.hidden = true; };
  document.getElementById('installClose').onclick = () => { prefs.set('installDismissed', true); hide(); };
  addEventListener('appinstalled', hide);

  // iPhone/iPad : Safari n'a pas de bouton d'installation, on explique le geste
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) { text.textContent = t('install.ios'); box.hidden = false; return; }

  // Android / ordinateur : le navigateur propose l'installation quand l'appli est éligible
  let deferred = null;
  addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e;
    text.textContent = t('install.android');
    btn.hidden = false;
    box.hidden = false;
  });
  btn.onclick = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    hide();
  };
})();

/* ---------- Recherche : préparation ---------- */
// Petits mots de liaison ignorés dans les textes des outils : sinon « dé » (devenu « de »)
// trouverait « Compteur de points », « Minuteur de tours »…
const IGNORED_WORDS = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'un', 'une', 'et', 'ou', 'en', 'a', 'à', 'au', 'aux',
  'sur', 'par', 'pour', 'the', 'of', 'an', 'and', 'or', 'per', 'to', 'on', 'in', 'your'
]);

// Minuscules et sans accents : « equipe » doit trouver « Équipes ».
function normalize(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function splitWords(text) {
  return text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

// Mots indexés d'un outil : nom, description et mots-clés, sans les mots de liaison
function searchWordsOf(tool) {
  const text = [t(tool.name), t(tool.desc), t(tool.keywords)].join(' ');
  return splitWords(text).filter(word => !IGNORED_WORDS.has(word)).map(normalize);
}

/* ---------- Liste des outils ---------- */
const list = document.getElementById('tools');
const cards = [];   // { tool, item, searchWords } : une entrée par outil affiché
for (const tool of TOOLS) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.className = 'tool glass';
  a.href = tool.path;
  const icon = document.createElement('span'); icon.className = 'tool-icon'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = tool.icon;
  const h = document.createElement('h2'); h.textContent = t(tool.name);
  const p = document.createElement('p'); p.textContent = t(tool.desc);
  a.append(icon, h, p);
  li.append(a);
  list.append(li);
  cards.push({ tool, item: li, searchWords: searchWordsOf(tool) });
}

/* ---------- Recherche ---------- */
// Comparaison de chaînes uniquement (pas d'expression régulière construite depuis la saisie).
// Un mot tapé de 3 lettres ou plus doit commencer un mot de l'outil (« chrono » → « chronomètre ») ;
// un mot de 1 ou 2 lettres doit être un mot entier (« dé » ne doit pas trouver « décider »).
function wordMatches(card, typedWord) {
  if (typedWord.length <= 2) return card.searchWords.includes(typedWord);
  return card.searchWords.some(word => word.startsWith(typedWord));
}

// Tous les mots tapés doivent correspondre
function matches(card, typedWords) {
  return typedWords.every(typedWord => wordMatches(card, typedWord));
}

const searchInput = document.getElementById('search');
const emptyMessage = document.getElementById('searchEmpty');
const countLabel = document.getElementById('count');

function applySearch() {
  const typedWords = splitWords(searchInput.value.slice(0, SEARCH_MAX_LENGTH))
    .filter(word => !IGNORED_WORDS.has(word)).map(normalize);
  let visibleCount = 0;
  for (const card of cards) {
    const visible = matches(card, typedWords);
    card.item.hidden = !visible;
    if (visible) visibleCount++;
  }
  emptyMessage.hidden = visibleCount > 0;
  countLabel.textContent = typedWords.length === 0
    ? t('count', { n: TOOLS.length })
    : t('search.count', { n: visibleCount, total: TOOLS.length });
}

searchInput.addEventListener('input', applySearch);
searchInput.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    searchInput.value = '';
    applySearch();
  } else if (event.key === 'Enter') {
    const visibleCards = cards.filter(card => !card.item.hidden);
    if (visibleCards.length === 1) location.href = visibleCards[0].tool.path;
  }
});
// Retour arrière du navigateur : le champ peut être pré-rempli par le navigateur
applySearch();
})();
