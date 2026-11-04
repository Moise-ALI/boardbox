/* Qui commence ? : chacun pose un doigt sur l'écran, l'appli désigne qui commence (ou numérote l'ordre de jeu).
   Au doigt : un cercle suit chaque doigt posé, disparaît quand il est levé.
   À la souris (PC) : un clic pose un cercle fixe, un clic sur un cercle l'enlève. */
(() => {
'use strict';

const $ = s => document.querySelector(s);
const store = BoardBox.createStore('qui-commence');

const t = BoardBox.i18n({
  fr: {
    title: 'Qui commence ?',
    modeLabel: 'Mode',
    modeOne: 'Un gagnant',
    modeOrder: 'Ordre',
    reset: 'Recommencer',
    hintEmpty: 'Posez chacun un doigt sur l\'écran',
    hintOne: 'Au moins 2 doigts',
    hintWait: 'Ne bougez plus…',
    hintWinner: 'À toi de commencer !',
    hintOrder: 'Jouez dans l\'ordre des numéros'
  },
  en: {
    title: 'Who goes first?',
    modeLabel: 'Mode',
    modeOne: 'One winner',
    modeOrder: 'Order',
    reset: 'Start over',
    hintEmpty: 'Everyone, put a finger on the screen',
    hintOne: 'At least 2 fingers',
    hintWait: 'Hold still…',
    hintWinner: 'You go first!',
    hintOrder: 'Play in number order'
  }
});
BoardBox.initTopbar();
BoardBox.applyI18n(t);

const MAX_FINGERS = 10;
const WAIT_MS = 2000;          // durée sans changement avant le tirage (égale à l'animation .arming du CSS)
const PLAYER_COLORS = 12;      // --player-1 … --player-12 dans commun/base.css

const zone = $('#zone'), hint = $('#hint'), resetBtn = $('#resetBtn');

// Cercles affichés : clé (« t » + pointerId au doigt, « m » + numéro à la souris) → { el, color, fixed }
const markers = new Map();
// Doigts encore posés (pendant le résultat, les cercles restent figés même si on lève les doigts)
const pressed = new Set();
let phase = 'waiting';         // 'waiting' : on attend les doigts ; 'result' : le tirage est affiché
let waitTimer = 0;
let mouseCount = 0;
let mode = store.get('mode', 'one') === 'order' ? 'order' : 'one';

/* ---------- Hasard équitable ---------- */
function randomIndex(n) {
  // crypto plutôt que Math.random : personne ne peut contester le tirage. Biais du modulo négligeable pour n ≤ 10.
  return crypto.getRandomValues(new Uint32Array(1))[0] % n;
}
function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Les navigateurs n'autorisent la vibration qu'après un vrai « tap » sur la page (poser un doigt ne suffit pas,
// le lever oui) : au tout premier tour, le téléphone peut donc rester muet.
function vibrate(ms) {
  const activated = !navigator.userActivation || navigator.userActivation.hasBeenActive;
  if (navigator.vibrate && activated) navigator.vibrate(ms);
}

/* ---------- Cercles ---------- */
function firstFreeColor() {
  const used = new Set([...markers.values()].map(m => m.color));
  for (let c = 1; c <= PLAYER_COLORS; c++) if (!used.has(c)) return c;
  return 1;
}

// Coin intérieur de la zone (bordure comprise), d'où partent les cercles.
// Relu à chaque nouveau contact plutôt qu'à chaque mouvement : le relire forcerait un calcul de mise en page.
let zoneOrigin = { x: 0, y: 0 };
function measureZone() {
  const box = zone.getBoundingClientRect();
  zoneOrigin = { x: box.left + zone.clientLeft, y: box.top + zone.clientTop };
}

// Déplacement par la propriété translate (et non left/top) : géré par la carte graphique, fluide même à 10 doigts.
// Elle se combine avec les transform: scale() des états .chosen / .out.
function placeMarker(el, event) {
  el.style.translate = `${event.clientX - zoneOrigin.x}px ${event.clientY - zoneOrigin.y}px`;
}

function addMarker(key, event, fixed) {
  if (markers.size >= MAX_FINGERS) return;
  const color = firstFreeColor();
  const el = document.createElement('div');
  el.className = 'marker';
  el.style.setProperty('--c', `var(--player-${color})`);
  placeMarker(el, event);
  zone.append(el);
  markers.set(key, { el, color, fixed });
  vibrate(15);
  restartWait();
}

function removeMarker(key) {
  const marker = markers.get(key);
  if (!marker) return;
  marker.el.remove();
  markers.delete(key);
  restartWait();
}

function clearAll() {
  clearTimeout(waitTimer);
  markers.forEach(m => m.el.remove());
  markers.clear();
  phase = 'waiting';
  updateHint();
}

/* ---------- Attente puis tirage ---------- */
// Tout ajout ou retrait de doigt relance l'attente (et l'anneau) depuis le début
function restartWait() {
  clearTimeout(waitTimer);
  markers.forEach(m => m.el.classList.remove('arming'));
  if (markers.size >= 2) {
    void zone.offsetWidth; // force le navigateur à repartir de zéro pour l'animation de l'anneau
    markers.forEach(m => m.el.classList.add('arming'));
    waitTimer = setTimeout(showResult, WAIT_MS);
  }
  updateHint();
}

function showResult() {
  phase = 'result';
  const order = shuffled([...markers.values()]);
  order.forEach((marker, index) => {
    marker.el.classList.remove('arming');
    if (mode === 'order') marker.el.textContent = index + 1;
    else marker.el.classList.add(index === 0 ? 'chosen' : 'out');
  });
  vibrate(200);
  updateHint();
}

function updateHint() {
  const count = markers.size;
  let key;
  if (phase === 'result') key = mode === 'order' ? 'hintOrder' : 'hintWinner';
  else if (count === 0) key = 'hintEmpty';
  else if (count === 1) key = 'hintOne';
  else key = 'hintWait';
  hint.textContent = t(key);
  zone.classList.toggle('active', count > 0);
  // « Recommencer » : utile pour effacer les cercles posés à la souris, ou un résultat une fois les doigts levés
  const hasMouseMarkers = [...markers.values()].some(m => m.fixed);
  const resultReleased = phase === 'result' && pressed.size === 0;
  resetBtn.hidden = !(hasMouseMarkers || resultReleased);
}

/* ---------- Événements pointer (doigts et souris) ---------- */
zone.addEventListener('pointerdown', event => {
  if (event.target.closest('.reset')) return;
  event.preventDefault();
  measureZone();
  const isMouse = event.pointerType === 'mouse';

  if (phase === 'result') {
    // Un nouveau tour commence au premier contact une fois tous les doigts levés
    if (pressed.size) return;
    clearAll();
  }

  if (isMouse) {
    const hitKey = [...markers.keys()].find(key => {
      const box = markers.get(key).el.getBoundingClientRect();
      return Math.hypot(event.clientX - (box.left + box.width / 2), event.clientY - (box.top + box.height / 2)) <= box.width / 2;
    });
    if (hitKey) removeMarker(hitKey);
    else addMarker('m' + (++mouseCount), event, true);
    return;
  }

  // Capture : les mouvements restent suivis même si le doigt glisse hors de la zone
  try { zone.setPointerCapture(event.pointerId); } catch (e) { /* pointeur déjà relâché : rien à suivre */ }
  pressed.add(event.pointerId);
  addMarker('t' + event.pointerId, event, false);
});

zone.addEventListener('pointermove', event => {
  if (phase !== 'waiting') return;
  const marker = markers.get('t' + event.pointerId);
  if (marker) placeMarker(marker.el, event);
});

function onFingerLifted(event) {
  if (!pressed.delete(event.pointerId)) return;
  if (phase === 'result') updateHint(); // les cercles restent figés pour lire le résultat
  else removeMarker('t' + event.pointerId);
}
zone.addEventListener('pointerup', onFingerLifted);
zone.addEventListener('pointercancel', onFingerLifted);
zone.addEventListener('contextmenu', event => event.preventDefault());

resetBtn.addEventListener('click', clearAll);

/* ---------- Mode ---------- */
function applyMode() {
  $('#modeOne').setAttribute('aria-pressed', String(mode === 'one'));
  $('#modeOrder').setAttribute('aria-pressed', String(mode === 'order'));
}
function setMode(next) {
  mode = next;
  store.set('mode', mode);
  applyMode();
  if (phase === 'result') clearAll();
}
$('#modeOne').addEventListener('click', () => setMode('one'));
$('#modeOrder').addEventListener('click', () => setMode('order'));

applyMode();
updateHint();
})();
