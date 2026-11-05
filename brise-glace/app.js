/* Brise-glace : cartes de questions pour lancer la conversation.
   Les cartes de chaque paquet sont dans cartes/<langue>/<paquet>.txt, une question par ligne :
   on ajoute une carte en ajoutant une ligne (le service worker relit ces fichiers sur le réseau).
   « Mes cartes » sont celles de l'utilisateur, gardées sur son téléphone. */
(() => {
'use strict';

const $ = selector => document.querySelector(selector);
const store = BoardBox.createStore('brise-glace');

/* Paquets publiés : pour en ajouter un, créer cartes/fr/<id>.txt (et cartes/en/<id>.txt),
   puis ajouter une ligne ici et son nom FR/EN dans le dictionnaire ('pack.<id>'). */
const PACKS = [
  { id: 'legeres', icon: '🪶' },
  { id: 'souvenirs', icon: '📸' },
  { id: 'profondes', icon: '💭' },
  { id: 'famille', icon: '🧸' },
  { id: 'couple', icon: '💞' },
  { id: 'amis', icon: '🤝' }
];
const PERSONAL_PACK = { id: 'perso', icon: '✍️' };

const CARD_MAX_LENGTH = 300;        // une carte trop longue est tronquée
const CARDS_PER_FILE_MAX = 500;     // protège la page d'un fichier anormalement gros
const PERSONAL_CARDS_MAX = 500;
const IMPORT_FILE_MAX_BYTES = 500 * 1024;
const DEFAULT_PACKS = ['legeres'];

const t = BoardBox.i18n({
  fr: {
    title: 'Brise-glace',
    packsTitle: 'Paquets',
    packsHint: 'Choisissez un ou plusieurs paquets : leurs cartes sont mélangées.',
    cardCount: '{n} cartes',
    cardCountOne: '1 carte',
    'pack.legeres': 'Légères',
    'pack.souvenirs': 'Souvenirs',
    'pack.profondes': 'Profondes',
    'pack.famille': 'Famille',
    'pack.couple': 'Couple',
    'pack.amis': 'Entre amis',
    'pack.perso': 'Mes cartes',
    mineTitle: 'Mes cartes',
    mineEmpty: 'Vos propres questions, gardées sur ce téléphone. Importez une liste ou ajoutez-les une par une.',
    mineSummary: '{n} cartes, gardées sur ce téléphone.',
    mineSummaryOne: '1 carte, gardée sur ce téléphone.',
    playMine: 'Jouer avec mes cartes seulement',
    importTitle: 'Importer une liste',
    importHint: 'Collez vos questions (depuis Notes, un message…), une par ligne, ou choisissez un fichier texte.',
    importPlaceholder: 'Une question par ligne',
    importAdd: 'Ajouter ces cartes',
    importFile: 'Depuis un fichier .txt',
    importDone: '{added} cartes ajoutées.',
    importDoneOne: '1 carte ajoutée.',
    importNone: 'Aucune nouvelle carte.',
    importDuplicates: '{n} déjà présentes, ignorées.',
    importDuplicatesOne: '1 déjà présente, ignorée.',
    importOverflow: '{n} non ajoutées : {max} cartes au maximum.',
    importTooBig: 'Fichier trop gros (500 Ko au maximum).',
    importUnreadable: 'Ce fichier ne peut pas être lu : choisissez un fichier texte (.txt).',
    mineList: 'Voir mes cartes ({n})',
    export: 'Exporter (.txt)',
    clearAll: 'Tout effacer',
    confirmClear: 'Effacer vos {n} cartes de ce téléphone ? Pensez à les exporter avant si vous voulez les garder.',
    minePlaceholder: 'Ajouter une question…',
    add: 'Ajouter',
    remove: 'Retirer cette carte',
    mineFull: '{max} cartes au maximum.',
    noPack: 'Choisissez au moins un paquet.',
    start: 'Tirer une carte',
    tapHint: 'Touchez la carte ou balayez-la pour passer à la suivante',
    previous: '← Précédente',
    next: 'Carte suivante →',
    changePacks: 'Paquets',
    reset: 'Remettre les cartes',
    remaining: '{n} cartes restantes',
    remainingOne: 'Dernière carte',
    position: 'Carte {n}',
    exhausted: 'Toutes les cartes ont été tirées !',
    exhaustedHint: 'Touchez « Remettre les cartes » pour recommencer.'
  },
  en: {
    title: 'Icebreakers',
    packsTitle: 'Packs',
    packsHint: 'Pick one or more packs: their cards are shuffled together.',
    cardCount: '{n} cards',
    cardCountOne: '1 card',
    'pack.legeres': 'Light',
    'pack.souvenirs': 'Memories',
    'pack.profondes': 'Deep',
    'pack.famille': 'Family',
    'pack.couple': 'Couple',
    'pack.amis': 'Friends',
    'pack.perso': 'My cards',
    mineTitle: 'My cards',
    mineEmpty: 'Your own questions, kept on this phone. Import a list or add them one by one.',
    mineSummary: '{n} cards, kept on this phone.',
    mineSummaryOne: '1 card, kept on this phone.',
    playMine: 'Play with my cards only',
    importTitle: 'Import a list',
    importHint: 'Paste your questions (from Notes, a message…), one per line, or pick a text file.',
    importPlaceholder: 'One question per line',
    importAdd: 'Add these cards',
    importFile: 'From a .txt file',
    importDone: '{added} cards added.',
    importDoneOne: '1 card added.',
    importNone: 'No new cards.',
    importDuplicates: '{n} already there, skipped.',
    importDuplicatesOne: '1 already there, skipped.',
    importOverflow: '{n} not added: {max} cards at most.',
    importTooBig: 'File too large (500 KB at most).',
    importUnreadable: 'This file can\'t be read: pick a text file (.txt).',
    mineList: 'See my cards ({n})',
    export: 'Export (.txt)',
    clearAll: 'Delete all',
    confirmClear: 'Delete your {n} cards from this phone? Export them first if you want to keep them.',
    minePlaceholder: 'Add a question…',
    add: 'Add',
    remove: 'Remove this card',
    mineFull: '{max} cards at most.',
    noPack: 'Pick at least one pack.',
    start: 'Draw a card',
    tapHint: 'Tap or swipe the card to go to the next one',
    previous: '← Previous',
    next: 'Next card →',
    changePacks: 'Packs',
    reset: 'Reshuffle the cards',
    remaining: '{n} cards left',
    remainingOne: 'Last card',
    position: 'Card {n}',
    exhausted: 'All the cards have been drawn!',
    exhaustedHint: 'Tap "Reshuffle the cards" to start again.'
  }
});

BoardBox.initTopbar();
BoardBox.applyI18n(t);

/* ---------- Outils ---------- */
function randomIndex(n) {
  return crypto.getRandomValues(new Uint32Array(1))[0] % n;
}

function el(tag, props = {}, children = []) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'text') element.textContent = value;
    else if (key === 'class') element.className = value;
    else if (key.startsWith('on')) element.addEventListener(key.slice(2), value);
    else element.setAttribute(key, value);
  }
  element.append(...children);
  return element;
}

// Une carte : espaces superflus retirés, longueur bornée (le texte vient d'un fichier ou d'une saisie)
function cleanCard(text) {
  const card = String(text).replace(/\s+/g, ' ').trim();
  return Array.from(card).slice(0, CARD_MAX_LENGTH).join('');
}

/* ---------- Cartes ---------- */
// Une question par ligne ; lignes vides et commentaires (#) ignorés ; doublons retirés
function parseCards(fileText) {
  const cards = fileText.split(/\r?\n/)
    .map(cleanCard)
    .filter(line => line && !line.startsWith('#'));
  return [...new Set(cards)].slice(0, CARDS_PER_FILE_MAX);
}

async function fetchPack(id) {
  try {
    // no-cache : même sans service worker, une carte ajoutée apparaît sans attendre l'expiration du cache HTTP
    const response = await fetch('cartes/' + BoardBox.lang + '/' + id + '.txt', { cache: 'no-cache' });
    if (!response.ok) return [];
    return parseCards(await response.text());
  } catch (e) {
    return [];   // hors connexion sans copie : le paquet est simplement absent
  }
}

function readStringList(key, max) {
  const saved = store.get(key, []);
  if (!Array.isArray(saved)) return [];
  return saved.filter(item => typeof item === 'string').map(cleanCard).filter(Boolean).slice(0, max);
}

let personalCards = readStringList('mesCartes', PERSONAL_CARDS_MAX);
const cardsByPack = new Map();   // id → liste des cartes (paquets publiés chargés au démarrage)

function cardsOf(id) {
  return id === PERSONAL_PACK.id ? personalCards : (cardsByPack.get(id) || []);
}

function packInfo(id) {
  return id === PERSONAL_PACK.id ? PERSONAL_PACK : PACKS.find(pack => pack.id === id);
}

// Couleur d'un paquet : celles des joueurs du design system, dans l'ordre des paquets
function packColor(id) {
  const index = id === PERSONAL_PACK.id ? PACKS.length : PACKS.findIndex(pack => pack.id === id);
  return 'var(--player-' + (index + 1) + ')';
}

/* ---------- Paquets choisis et cartes déjà vues (mémorisés) ---------- */
function availablePackIds() {
  const ids = PACKS.map(pack => pack.id).filter(id => cardsOf(id).length > 0);
  if (personalCards.length > 0) ids.push(PERSONAL_PACK.id);
  return ids;
}

let selectedPacks = (() => {
  const saved = store.get('paquets', DEFAULT_PACKS);
  return Array.isArray(saved) ? saved.filter(id => typeof id === 'string' && packInfo(id)) : DEFAULT_PACKS;
})();
function saveSelectedPacks() { store.set('paquets', selectedPacks); }

// Cartes vues, par paquet et par texte : ajouter une ligne dans un fichier ne remet pas le paquet à zéro
const seenByPack = (() => {
  const saved = store.get('vues', {});
  const seen = {};
  if (saved && typeof saved === 'object') {
    for (const id of [...PACKS.map(pack => pack.id), PERSONAL_PACK.id]) {
      if (Array.isArray(saved[id])) seen[id] = new Set(saved[id].filter(card => typeof card === 'string'));
    }
  }
  return seen;
})();
function saveSeen() {
  const plain = {};
  for (const [id, cards] of Object.entries(seenByPack)) plain[id] = [...cards].slice(-CARDS_PER_FILE_MAX);
  store.set('vues', plain);
}
function isSeen(id, card) { return Boolean(seenByPack[id] && seenByPack[id].has(card)); }
function markSeen(id, card) {
  if (!seenByPack[id]) seenByPack[id] = new Set();
  seenByPack[id].add(card);
  saveSeen();
}

function activePackIds() {
  const available = availablePackIds();
  return selectedPacks.filter(id => available.includes(id));
}

function remainingCards() {
  return activePackIds().flatMap(id => cardsOf(id).filter(card => !isSeen(id, card)).map(card => ({ pack: id, card })));
}

/* ---------- Écran de choix ---------- */
function showError(key, vars) {
  $('#setupError').textContent = t(key, vars);
  $('#setupError').hidden = false;
}
function clearError() { $('#setupError').hidden = true; }

function renderPacks() {
  $('#packList').replaceChildren(...availablePackIds().map(id => {
    const pack = packInfo(id);
    const selected = selectedPacks.includes(id);
    const button = el('button', { type: 'button', class: 'pack', 'aria-pressed': String(selected), onclick: () => togglePack(id) }, [
      el('span', { class: 'pack-icon', 'aria-hidden': 'true', text: pack.icon }),
      el('span', { class: 'pack-name', text: t('pack.' + id) }),
      el('span', { class: 'pack-count', text: cardsOf(id).length === 1 ? t('cardCountOne') : t('cardCount', { n: cardsOf(id).length }) })
    ]);
    button.style.setProperty('--c', packColor(id));
    return button;
  }));
}

function togglePack(id) {
  clearError();
  selectedPacks = selectedPacks.includes(id) ? selectedPacks.filter(other => other !== id) : [...selectedPacks, id];
  saveSelectedPacks();
  renderPacks();
}

/* ---------- Mes cartes ---------- */
function renderPersonalCards() {
  const count = personalCards.length;
  $('#mineSummary').textContent = count === 0 ? t('mineEmpty') : count === 1 ? t('mineSummaryOne') : t('mineSummary', { n: count });
  $('#playMineBtn').hidden = count === 0;
  $('#mineDetails').hidden = count === 0;
  $('#mineListTitle').textContent = t('mineList', { n: count });
  $('#mineList').replaceChildren(...personalCards.map(card => el('li', { class: 'row' }, [
    el('span', { class: 'row-text', text: card }),
    el('button', { type: 'button', 'aria-label': t('remove'), text: '✕', onclick: () => removePersonalCard(card) })
  ])));
}

function savePersonalCards() {
  store.set('mesCartes', personalCards);
  renderPersonalCards();
  renderPacks();
}

// Ajoute des cartes (une ou une liste importée) ; renvoie ce qui a été ajouté, ignoré, refusé
function addPersonalCards(cards) {
  const result = { added: 0, duplicates: 0, overflow: 0 };
  const wasEmpty = personalCards.length === 0;
  const updated = [...personalCards];
  for (const card of cards) {
    if (updated.includes(card)) result.duplicates++;
    else if (updated.length >= PERSONAL_CARDS_MAX) result.overflow++;
    else { updated.push(card); result.added++; }
  }
  if (result.added === 0) return result;
  personalCards = updated;
  // Premières cartes personnelles : on coche le paquet, c'est ce qu'on attend en les ajoutant
  if (wasEmpty && !selectedPacks.includes(PERSONAL_PACK.id)) {
    selectedPacks = [...selectedPacks, PERSONAL_PACK.id];
    saveSelectedPacks();
  }
  savePersonalCards();
  return result;
}

function addPersonalCard(text) {
  clearError();
  const card = cleanCard(text);
  if (!card) return true;
  const result = addPersonalCards([card]);
  if (result.overflow > 0) { showError('mineFull', { max: PERSONAL_CARDS_MAX }); return false; }
  return true;
}

function removePersonalCard(card) {
  personalCards = personalCards.filter(other => other !== card);
  savePersonalCards();
}

function showImportResult(message) {
  $('#importResult').textContent = message;
  $('#importResult').hidden = false;
}

function describeImport(result) {
  const parts = [result.added === 0 ? t('importNone') : result.added === 1 ? t('importDoneOne') : t('importDone', { added: result.added })];
  if (result.duplicates === 1) parts.push(t('importDuplicatesOne'));
  else if (result.duplicates > 1) parts.push(t('importDuplicates', { n: result.duplicates }));
  if (result.overflow > 0) parts.push(t('importOverflow', { n: result.overflow, max: PERSONAL_CARDS_MAX }));
  return parts.join(' ');
}

// Liste collée ou fichier texte : même lecture que les paquets (une question par ligne, # ignoré)
function importText(text) {
  const result = addPersonalCards(parseCards(text));
  showImportResult(describeImport(result));
  return result;
}

async function importFile(file) {
  if (!file) return;
  if (file.size > IMPORT_FILE_MAX_BYTES) { showImportResult(t('importTooBig')); return; }
  try {
    const bytes = await file.arrayBuffer();
    importText(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch (e) {
    showImportResult(t('importUnreadable'));   // fichier binaire ou mal encodé
  }
}

// Sauvegarde ou partage : un fichier texte, une carte par ligne, réimportable tel quel
function exportPersonalCards() {
  const blob = new Blob([personalCards.join('\n') + '\n'], { type: 'text/plain;charset=utf-8' });
  const link = el('a', { href: URL.createObjectURL(blob), download: 'mes-cartes.txt' });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function clearPersonalCards() {
  if (!confirm(t('confirmClear', { n: personalCards.length }))) return;
  personalCards = [];
  delete seenByPack[PERSONAL_PACK.id];
  saveSeen();
  savePersonalCards();
}

function playPersonalCardsOnly() {
  selectedPacks = [PERSONAL_PACK.id];
  saveSelectedPacks();
  renderPacks();
  startPlaying();
}

/* ---------- Jeu ---------- */
// Cartes tirées pendant cette visite, pour revenir en arrière ; position = carte affichée
const drawn = [];
let position = -1;

function showScreen(name) {
  $('#setupScreen').hidden = name !== 'setup';
  $('#playScreen').hidden = name !== 'play';
  window.scrollTo(0, 0);
}

function renderCard() {
  const cardButton = $('#questionCard');
  const current = drawn[position];
  const remaining = remainingCards().length;

  cardButton.classList.remove('appear');
  void cardButton.offsetWidth;   // relance l'animation d'apparition à chaque carte
  cardButton.classList.add('appear');

  const stage = $('#questionStage');
  stage.classList.toggle('empty', !current);
  cardButton.classList.toggle('empty', !current);
  if (current) {
    stage.style.setProperty('--c', packColor(current.pack));
    $('#questionText').textContent = current.card;
    $('#questionPack').textContent = t('pack.' + current.pack);
  } else {
    $('#questionText').textContent = t('exhausted');
    $('#questionPack').textContent = t('exhaustedHint');
  }
  $('#remainingInfo').textContent = remaining === 1 ? t('remainingOne') : t('remaining', { n: remaining });
  $('#positionInfo').textContent = current ? t('position', { n: position + 1 }) : '';
  $('#prevBtn').disabled = position <= 0;
  $('#nextBtn').disabled = !current && remaining === 0;
}

function drawNextCard() {
  // Après « Précédente », on avance d'abord dans les cartes déjà tirées
  if (position < drawn.length - 1) {
    position++;
    renderCard();
    return;
  }
  const remaining = remainingCards();
  if (remaining.length === 0) {
    position = drawn.length;   // au-delà de la dernière : écran « toutes tirées »
    renderCard();
    return;
  }
  const picked = remaining[randomIndex(remaining.length)];
  markSeen(picked.pack, picked.card);
  drawn.push(picked);
  position = drawn.length - 1;
  renderCard();
}

function previousCard() {
  if (position <= 0) return;
  position = Math.min(position, drawn.length) - 1;
  renderCard();
}

function resetSelectedPacks() {
  for (const id of activePackIds()) delete seenByPack[id];
  saveSeen();
  drawn.length = 0;
  position = -1;
  drawNextCard();
}

function startPlaying() {
  if (activePackIds().length === 0) { showError('noPack'); return; }
  clearError();
  showScreen('play');
  position = drawn.length - 1;   // nouvelle série après un changement de paquets : on tire une carte neuve
  drawNextCard();
}

/* ---------- Événements ---------- */
$('#mineForm').addEventListener('submit', event => {
  event.preventDefault();
  if (addPersonalCard($('#mineInput').value)) $('#mineInput').value = '';
  $('#mineInput').focus();
});
$('#importBtn').addEventListener('click', () => {
  const result = importText($('#importText').value);
  if (result.added > 0) $('#importText').value = '';
});
$('#importFileBtn').addEventListener('click', () => $('#importFile').click());
$('#importFile').addEventListener('change', async () => {
  await importFile($('#importFile').files[0]);
  $('#importFile').value = '';   // permet de réimporter le même fichier
});
$('#exportBtn').addEventListener('click', exportPersonalCards);
$('#clearBtn').addEventListener('click', clearPersonalCards);
$('#playMineBtn').addEventListener('click', playPersonalCardsOnly);
$('#startBtn').addEventListener('click', startPlaying);
/* Carte : toucher = suivante ; balayer vers la gauche = suivante, vers la droite = précédente.
   Selon le navigateur, un balayage peut être suivi d'un « click » : on ignore celui qui arrive juste après. */
const SWIPE_MIN_PX = 50;
const CLICK_AFTER_SWIPE_MS = 400;
let swipeStart = null;
let lastSwipeAt = 0;
$('#questionCard').addEventListener('pointerdown', event => { swipeStart = { x: event.clientX, y: event.clientY }; });
$('#questionCard').addEventListener('pointerup', event => {
  if (!swipeStart) return;
  const dx = event.clientX - swipeStart.x;
  const dy = event.clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy)) return;   // simple toucher ou défilement vertical
  lastSwipeAt = performance.now();
  if (dx < 0) drawNextCard();
  else previousCard();
});
$('#questionCard').addEventListener('pointercancel', () => { swipeStart = null; });
$('#questionCard').addEventListener('click', () => {
  if (performance.now() - lastSwipeAt < CLICK_AFTER_SWIPE_MS) return;
  drawNextCard();
});
$('#nextBtn').addEventListener('click', drawNextCard);
$('#prevBtn').addEventListener('click', previousCard);
$('#resetBtn').addEventListener('click', resetSelectedPacks);
$('#packsBtn').addEventListener('click', () => {
  renderPacks();
  showScreen('setup');
});

/* ---------- Démarrage ---------- */
(async () => {
  $('#startBtn').disabled = true;   // pas de tirage avant d'avoir les cartes
  renderPersonalCards();
  const loaded = await Promise.all(PACKS.map(pack => fetchPack(pack.id)));
  PACKS.forEach((pack, index) => cardsByPack.set(pack.id, loaded[index]));
  renderPacks();
  $('#startBtn').disabled = false;
})();
})();
