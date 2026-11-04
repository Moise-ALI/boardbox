/* Minuteur de tours : sablier (durée fixe par tour) ou pendule (réserve de temps par joueur).
   Le temps est toujours calculé à partir de l'heure réelle (Date.now), jamais en comptant des « tics » :
   il reste exact si le téléphone ralentit, passe en arrière-plan ou si la page est rechargée. */
(() => {
'use strict';

const $ = s => document.querySelector(s);
const store = BoardBox.createStore('minuteur');

const t = BoardBox.i18n({
  fr: {
    title: 'Minuteur de tours',
    modeTitle: 'Mode',
    modeHourglass: 'Sablier',
    modeClock: 'Pendule',
    descHourglass: 'Chaque tour dure le même temps. Une fois écoulé, le temps continue en négatif.',
    descClock: 'Chaque joueur a une réserve pour toute la partie, qui ne s\'écoule que pendant son tour.',
    durationHourglass: 'Durée d\'un tour',
    durationClock: 'Réserve par joueur',
    playersTitle: 'Joueurs, dans l\'ordre du jeu',
    playerName: 'Nom du joueur',
    playerN: 'Joueur {n}',
    remove: 'Retirer {name}',
    addPlayer: '+ Ajouter un joueur',
    importPlayers: 'Reprendre les joueurs du compteur',
    start: 'Lancer la partie',
    resume: 'Reprendre la partie en cours',
    round: 'Tour {n}',
    infoHourglass: 'Sablier · {time} par tour',
    infoClock: 'Pendule · {time} chacun',
    tapHint: 'Touchez pour passer au suivant',
    pausedHint: 'En pause · touchez pour reprendre',
    overHint: 'Temps écoulé !',
    previous: '← Précédent',
    pause: '⏸ Pause',
    play: '▶ Reprendre',
    settings: 'Réglages',
    queueLabel: 'Joueurs suivants'
  },
  en: {
    title: 'Turn timer',
    modeTitle: 'Mode',
    modeHourglass: 'Hourglass',
    modeClock: 'Chess clock',
    descHourglass: 'Every turn lasts the same time. Once it runs out, the timer keeps counting below zero.',
    descClock: 'Each player has a time bank for the whole game, which only runs during their turn.',
    durationHourglass: 'Turn length',
    durationClock: 'Time bank per player',
    playersTitle: 'Players, in turn order',
    playerName: 'Player name',
    playerN: 'Player {n}',
    remove: 'Remove {name}',
    addPlayer: '+ Add a player',
    importPlayers: 'Use the score counter players',
    start: 'Start the game',
    resume: 'Resume current game',
    round: 'Round {n}',
    infoHourglass: 'Hourglass · {time} per turn',
    infoClock: 'Chess clock · {time} each',
    tapHint: 'Tap to pass to the next player',
    pausedHint: 'Paused · tap to resume',
    overHint: 'Time\'s up!',
    previous: '← Previous',
    pause: '⏸ Pause',
    play: '▶ Resume',
    settings: 'Settings',
    queueLabel: 'Next players'
  }
});
BoardBox.initTopbar();
BoardBox.applyI18n(t);

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const NAME_MAX = 18;
const PLAYER_COLORS = 12;                      // --player-1 … --player-12 dans commun/base.css
const HOURGLASS_SECONDS = [15, 30, 45, 60, 90, 120, 180];
const CLOCK_MINUTES = [1, 3, 5, 10, 15, 20, 30];
const DOUBLE_TAP_GUARD_MS = 600;               // un 2e appui aussi rapproché est involontaire : il sauterait un joueur
const LOW_TIME_MS = 10000;                     // dernières secondes : le temps clignote
const HISTORY_MAX = 50;

/* ---------- Petits utilitaires ---------- */
const colorVar = c => `var(--player-${(c % PLAYER_COLORS) + 1})`;
const isNumber = v => typeof v === 'number' && Number.isFinite(v);
const cleanName = v => (typeof v === 'string' ? v.trim().slice(0, NAME_MAX) : '');

// « 1:05 », « 0:00 », « −0:12 » : arrondi au-dessus tant qu'il reste du temps (on voit 1:00 au départ, 0:00 seulement à la fin)
function formatMs(ms) {
  const seconds = ms > 0 ? Math.ceil(ms / 1000) : Math.floor(-ms / 1000);
  const text = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  return ms <= 0 && seconds > 0 ? '−' + text : text;
}
function formatSetting(mode, value) {
  if (mode === 'clock') return value + ' min';
  return value < 60 ? value + ' s' : formatMs(value * 1000);
}

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

/* ---------- Joueurs du compteur (lecture seule) ---------- */
function compteurPlayers() {
  const partie = BoardBox.createStore('compteur').get('partie', null);
  if (!partie || !Array.isArray(partie.players)) return [];
  return partie.players
    .filter(p => p && cleanName(p.name))
    .slice(0, MAX_PLAYERS)
    .map(p => ({ name: cleanName(p.name), c: isNumber(p.c) ? Math.abs(Math.round(p.c)) % PLAYER_COLORS : 0 }));
}

/* ---------- Réglages ---------- */
function defaultPlayers() {
  const fromCounter = compteurPlayers();
  if (fromCounter.length >= MIN_PLAYERS) return fromCounter;
  return [{ name: t('playerN', { n: 1 }), c: 0 }, { name: t('playerN', { n: 2 }), c: 1 }];
}

function loadSettings() {
  const saved = store.get('reglages', null) || {};
  const players = Array.isArray(saved.players)
    ? saved.players.filter(p => p && typeof p.name === 'string').slice(0, MAX_PLAYERS)
        .map(p => ({ name: cleanName(p.name), c: isNumber(p.c) ? Math.abs(Math.round(p.c)) % PLAYER_COLORS : 0 }))
    : [];
  return {
    mode: saved.mode === 'clock' ? 'clock' : 'hourglass',
    turnSeconds: HOURGLASS_SECONDS.includes(saved.turnSeconds) ? saved.turnSeconds : 60,
    clockMinutes: CLOCK_MINUTES.includes(saved.clockMinutes) ? saved.clockMinutes : 10,
    players: players.length >= MIN_PLAYERS ? players : defaultPlayers()
  };
}

let settings = loadSettings();
const saveSettings = () => store.set('reglages', settings);

function firstFreeColor() {
  const used = new Set(settings.players.map(p => p.c));
  for (let c = 0; c < PLAYER_COLORS; c++) if (!used.has(c)) return c;
  return 0;
}

function renderSetup() {
  const isClock = settings.mode === 'clock';
  $('#modeHourglass').setAttribute('aria-pressed', String(!isClock));
  $('#modeClock').setAttribute('aria-pressed', String(isClock));
  $('#modeDesc').textContent = t(isClock ? 'descClock' : 'descHourglass');
  $('#durationTitle').textContent = t(isClock ? 'durationClock' : 'durationHourglass');

  const chips = $('#durations');
  chips.replaceChildren();
  const values = isClock ? CLOCK_MINUTES : HOURGLASS_SECONDS;
  const current = isClock ? settings.clockMinutes : settings.turnSeconds;
  values.forEach(value => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.textContent = formatSetting(settings.mode, value);
    chip.setAttribute('aria-pressed', String(value === current));
    chip.addEventListener('click', () => {
      if (isClock) settings.clockMinutes = value; else settings.turnSeconds = value;
      saveSettings(); renderSetup();
    });
    chips.append(chip);
  });

  renderPlayerRows();
  $('#addBtn').disabled = settings.players.length >= MAX_PLAYERS;
  $('#importBtn').hidden = compteurPlayers().length < MIN_PLAYERS;
  $('#resumeBtn').hidden = !game;
}

function renderPlayerRows() {
  const list = $('#plList');
  list.replaceChildren();
  settings.players.forEach((player, index) => {
    const row = document.createElement('li');
    row.className = 'pl-row';
    const dot = document.createElement('span');
    dot.className = 'pl-dot';
    dot.style.setProperty('--c', colorVar(player.c));
    const input = document.createElement('input');
    input.maxLength = NAME_MAX;
    input.value = player.name;
    input.placeholder = t('playerN', { n: index + 1 });
    input.setAttribute('aria-label', t('playerName'));
    input.addEventListener('input', () => { player.name = cleanName(input.value); saveSettings(); });
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '✕';
    remove.disabled = settings.players.length <= MIN_PLAYERS;
    remove.setAttribute('aria-label', t('remove', { name: player.name || input.placeholder }));
    remove.addEventListener('click', () => { settings.players.splice(index, 1); saveSettings(); renderSetup(); });
    row.append(dot, input, remove);
    list.append(row);
  });
}

function setMode(mode) {
  settings.mode = mode;
  saveSettings(); renderSetup();
}
$('#modeHourglass').addEventListener('click', () => setMode('hourglass'));
$('#modeClock').addEventListener('click', () => setMode('clock'));
$('#addBtn').addEventListener('click', () => {
  if (settings.players.length >= MAX_PLAYERS) return;
  settings.players.push({ name: t('playerN', { n: settings.players.length + 1 }), c: firstFreeColor() });
  saveSettings(); renderSetup();
  const inputs = document.querySelectorAll('#plList input');
  inputs[inputs.length - 1].select();
});
$('#importBtn').addEventListener('click', () => {
  settings.players = compteurPlayers();
  saveSettings(); renderSetup();
});

/* ---------- Partie ----------
   game = { mode, turnMs, startBankMs, players: [{ name, c, bankMs }], active, round,
            running, segmentStart (heure de reprise du tour en cours), elapsedBefore (temps du tour avant la dernière pause),
            alerted (alarme déjà donnée pour ce tour), history (pour « Précédent ») } */
function loadGame() {
  const saved = store.get('partie', null);
  const valid = saved && Array.isArray(saved.players) && saved.players.length >= MIN_PLAYERS
    && saved.players.every(p => p && typeof p.name === 'string' && isNumber(p.c) && isNumber(p.bankMs))
    && isNumber(saved.active) && saved.active >= 0 && saved.active < saved.players.length
    && isNumber(saved.turnMs) && isNumber(saved.startBankMs) && isNumber(saved.round)
    && isNumber(saved.elapsedBefore) && (!saved.running || isNumber(saved.segmentStart));
  if (!valid) return null;
  if (!Array.isArray(saved.history)) saved.history = [];
  return saved;
}

let game = loadGame();
const saveGame = () => store.set('partie', game);

const activePlayer = () => game.players[game.active];
const elapsedMs = () => game.elapsedBefore + (game.running ? Date.now() - game.segmentStart : 0);
const turnBudgetMs = () => (game.mode === 'clock' ? activePlayer().bankMs : game.turnMs);
const remainingMs = () => turnBudgetMs() - elapsedMs();

function startGame() {
  const startBankMs = settings.clockMinutes * 60000;
  game = {
    mode: settings.mode,
    turnMs: settings.turnSeconds * 1000,
    startBankMs,
    players: settings.players.map((p, i) => ({ name: p.name || t('playerN', { n: i + 1 }), c: p.c, bankMs: startBankMs })),
    active: 0, round: 1,
    running: true, segmentStart: Date.now(), elapsedBefore: 0,
    alerted: false, history: []
  };
  saveGame();
  showGame();
}

function nextTurn() {
  const elapsed = elapsedMs();
  game.history.push({ active: game.active, round: game.round, elapsed, bankMs: activePlayer().bankMs });
  if (game.history.length > HISTORY_MAX) game.history.shift();
  if (game.mode === 'clock') activePlayer().bankMs -= elapsed;
  game.active = (game.active + 1) % game.players.length;
  if (game.active === 0) game.round++;
  beginTurn(0);
  vibrate(30);
}

// Rend la main au joueur précédent, avec le temps qu'il avait au moment où il l'a passée
function previousTurn() {
  const last = game.history.pop();
  if (!last) return;
  game.active = last.active;
  game.round = last.round;
  activePlayer().bankMs = last.bankMs;
  beginTurn(last.elapsed);
}

function beginTurn(elapsedBefore) {
  game.elapsedBefore = elapsedBefore;
  game.segmentStart = Date.now();
  game.alerted = remainingMs() <= 0;   // pas de nouvelle alarme pour un joueur déjà à court de temps
  saveGame();
  renderGame();
}

function pauseGame() {
  if (!game.running) return;
  game.elapsedBefore = elapsedMs();
  game.running = false;
  saveGame();
  releaseScreen();
  renderGame();
}

function resumeGame() {
  if (game.running) return;
  game.running = true;
  game.segmentStart = Date.now();
  saveGame();
  keepScreenOn();
  renderGame();
}

let lastTurnTapAt = 0;
$('#turnBtn').addEventListener('click', () => {
  unlockAudio();
  if (!game.running) { resumeGame(); return; }
  const now = Date.now();
  if (now - lastTurnTapAt < DOUBLE_TAP_GUARD_MS) return;
  lastTurnTapAt = now;
  nextTurn();
});
$('#prevBtn').addEventListener('click', previousTurn);
$('#pauseBtn').addEventListener('click', () => {
  unlockAudio();
  if (game.running) pauseGame(); else resumeGame();
});
$('#settingsBtn').addEventListener('click', () => { pauseGame(); showSetup(); });
$('#startBtn').addEventListener('click', () => { unlockAudio(); startGame(); });
$('#resumeBtn').addEventListener('click', () => { unlockAudio(); showGame(); resumeGame(); });

/* ---------- Affichage de la partie ---------- */
function renderGame() {
  if (!game || $('#game').hidden) return;
  const remaining = remainingMs();
  const player = activePlayer();
  const turn = $('#turnBtn');
  turn.style.setProperty('--c', colorVar(player.c));
  turn.classList.toggle('paused', !game.running);
  turn.classList.toggle('over', remaining <= 0);
  $('#turnName').textContent = player.name;
  $('#turnHint').textContent = t(!game.running ? 'pausedHint' : remaining <= 0 ? 'overHint' : 'tapHint');
  renderTime(remaining);

  $('#roundInfo').textContent = t('round', { n: game.round });
  $('#modeInfo').textContent = game.mode === 'clock'
    ? t('infoClock', { time: formatSetting('clock', game.startBankMs / 60000) })
    : t('infoHourglass', { time: formatSetting('hourglass', game.turnMs / 1000) });
  $('#pauseBtn').textContent = t(game.running ? 'pause' : 'play');
  $('#prevBtn').disabled = game.history.length === 0;
  renderQueue();
}

// Les joueurs suivants, dans l'ordre où ils vont jouer (réserve restante en mode pendule)
function renderQueue() {
  const queue = $('#queue');
  queue.replaceChildren();
  for (let step = 1; step < game.players.length; step++) {
    const player = game.players[(game.active + step) % game.players.length];
    const item = document.createElement('li');
    const dot = document.createElement('span');
    dot.className = 'q-dot';
    dot.style.setProperty('--c', colorVar(player.c));
    const name = document.createElement('span');
    name.className = 'q-name';
    name.textContent = player.name;
    item.append(dot, name);
    if (game.mode === 'clock') {
      const time = document.createElement('span');
      time.className = 'q-time' + (player.bankMs <= 0 ? ' neg' : '');
      time.textContent = formatMs(player.bankMs);
      item.append(time);
    }
    queue.append(item);
  }
}

// Temps du joueur actif, barre de progression (scaleX : animée par la carte graphique) et clignotement des dernières secondes
function renderTime(remaining) {
  const full = game.mode === 'clock' ? game.startBankMs : game.turnMs;
  $('#turnTime').textContent = formatMs(remaining);
  $('#turnBar i').style.transform = `scaleX(${Math.max(0, Math.min(1, remaining / full))})`;
  $('#turnBtn').classList.toggle('low', game.running && remaining > 0 && remaining <= LOW_TIME_MS);
}

// Seul le temps du joueur actif change d'une seconde à l'autre : on ne met à jour que lui
function tick() {
  if (!game || $('#game').hidden || !game.running) return;
  const remaining = remainingMs();
  renderTime(remaining);
  if (remaining <= 0 && !game.alerted) {
    game.alerted = true;
    saveGame();
    renderGame();
    alarm();
  }
}
setInterval(tick, 250);

/* ---------- Alarme : bip (Web Audio) + vibration ---------- */
let audio = null;
// Les navigateurs n'autorisent le son qu'après un geste de l'utilisateur : on prépare l'audio à chaque appui
function unlockAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!audio) audio = new AudioContextClass();
  if (audio.state === 'suspended') audio.resume();
}
function beep(startAt, frequency) {
  const osc = audio.createOscillator(), gain = audio.createGain();
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.4, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.25);
  osc.connect(gain).connect(audio.destination);
  osc.start(startAt);
  osc.stop(startAt + 0.3);
}
function alarm() {
  vibrate([200, 100, 200]);
  if (!audio || audio.state !== 'running') return;
  const now = audio.currentTime;
  beep(now, 880); beep(now + 0.3, 880); beep(now + 0.6, 1320);
}

/* ---------- Écran allumé pendant la partie (si le navigateur le permet) ---------- */
let wakeLock = null;
async function keepScreenOn() {
  if (!('wakeLock' in navigator) || wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
  } catch (e) { /* refusé (batterie faible, onglet caché…) : le minuteur marche quand même */ }
}
function releaseScreen() {
  if (wakeLock) wakeLock.release();
  wakeLock = null;
}
// Le verrou est perdu quand on quitte l'onglet : on le reprend au retour
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !game || $('#game').hidden) return;
  if (game.running) keepScreenOn();
  renderGame();
});

/* ---------- Écrans ---------- */
function showGame() {
  store.set('ecran', 'partie');
  $('#setup').hidden = true;
  $('#game').hidden = false;
  document.body.classList.add('playing');
  if (game.running) keepScreenOn();
  renderGame();
}
function showSetup() {
  store.set('ecran', 'reglages');
  $('#game').hidden = true;
  $('#setup').hidden = false;
  document.body.classList.remove('playing');
  releaseScreen();
  renderSetup();
}

if (game && store.get('ecran', '') === 'partie') showGame();
else showSetup();
})();
