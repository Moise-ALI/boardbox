/* Père Noël secret : interface. La logique (tirage, liens) est dans tirage.js.
   Règle de confidentialité : le résultat du tirage n'est jamais affiché à l'organisateur ni mémorisé.
   Il n'existe qu'en mémoire, le temps de distribuer les liens. */
(() => {
'use strict';

const Tirage = window.PereNoelTirage;
const $ = selector => document.querySelector(selector);
const store = BoardBox.createStore('pere-noel');

const t = BoardBox.i18n({
  fr: {
    title: 'Père Noël secret',
    peopleTitle: 'Participants',
    namePlaceholder: 'Prénom',
    add: 'Ajouter',
    remove: 'Retirer {name}',
    exclusionsTitle: 'Exclusions',
    exclusionsHint: 'Ces deux personnes ne se tireront pas l\'une l\'autre (couple, frères et sœurs…).',
    pairA: 'Première personne',
    pairB: 'Seconde personne',
    addExclusion: '+ Ajouter l\'exclusion',
    removeExclusion: 'Retirer l\'exclusion {a} et {b}',
    extrasTitle: 'Infos pour tous (facultatif)',
    budget: 'Budget',
    budgetPlaceholder: '20 €',
    date: 'Date de l\'échange',
    draw: 'Faire le tirage',
    'error.tooFew': 'Il faut au moins {min} participants.',
    'error.tooMany': '{max} participants au maximum.',
    'error.duplicate': '« {name} » est déjà dans la liste : ajoutez une initiale (ex. {name} B.).',
    'error.samePair': 'Choisissez deux personnes différentes.',
    'error.blocked': 'Impossible de trouver quelqu\'un pour {name} : il y a trop d\'exclusions. Retirez-en une.',
    doneTitle: 'Tirage fait !',
    doneHint: 'Personne, pas même vous, ne voit le résultat ici, et il n\'est pas gardé : ne quittez cette page qu\'une fois que tout le monde a son lien.',
    modeLinks: 'Envoyer les liens',
    modePass: 'Passer le téléphone',
    copy: 'Copier',
    copied: 'Copié ✓',
    share: 'Partager',
    qr: 'QR',
    qrFor: 'QR code du lien de {name}',
    qrLabel: 'QR code du lien',
    qrHint: '{name} scanne ce code avec l\'appareil photo de son téléphone. Personne d\'autre ne doit le scanner.',
    qrDone: 'C\'est scanné',
    takeLink: 'Emporter mon lien (QR code)',
    linkFor: 'Lien de {name}',
    notSent: 'À envoyer',
    sent: 'Envoyé ✓',
    shareText: '🎁 {name}, voici ton tirage du Père Noël secret. Ouvre-le quand personne ne regarde :',
    passHint: 'Chacun touche son prénom, découvre sa personne, puis la cache avant de rendre le téléphone.',
    edit: 'Modifier les participants',
    redraw: 'Refaire le tirage',
    confirmRedraw: 'Refaire le tirage ? Les liens déjà envoyés ne seront plus valables : il faudra renvoyer les nouveaux à tout le monde.',
    confirmEdit: 'Revenir aux participants ? Le tirage actuel sera perdu, et les liens déjà envoyés ne seront plus valables.',
    ready: '{name}, ton tirage est prêt.',
    readyPass: '{name}, ton tirage est prêt. Vérifie que personne ne regarde.',
    discover: 'Découvrir',
    giftTo: '{name}, tu offres un cadeau à :',
    budgetFact: 'Budget : {budget}',
    dateFact: 'Échange : {date}',
    keepSecret: 'Garde le secret ! Ce lien reste valable si tu as besoin de le revoir.',
    hideAndReturn: 'Cacher et rendre le téléphone',
    back: 'Retour',
    invalidLink: 'Ce lien est invalide ou incomplet. Demandez à l\'organisateur de vous le renvoyer.',
    ownDraw: 'Organiser mon propre tirage'
  },
  en: {
    title: 'Secret Santa',
    peopleTitle: 'Participants',
    namePlaceholder: 'First name',
    add: 'Add',
    remove: 'Remove {name}',
    exclusionsTitle: 'Exclusions',
    exclusionsHint: 'These two people won\'t draw each other (couples, siblings…).',
    pairA: 'First person',
    pairB: 'Second person',
    addExclusion: '+ Add exclusion',
    removeExclusion: 'Remove the exclusion between {a} and {b}',
    extrasTitle: 'Info for everyone (optional)',
    budget: 'Budget',
    budgetPlaceholder: '$20',
    date: 'Gift exchange date',
    draw: 'Draw names',
    'error.tooFew': 'You need at least {min} participants.',
    'error.tooMany': '{max} participants at most.',
    'error.duplicate': '"{name}" is already on the list: add an initial (e.g. {name} B.).',
    'error.samePair': 'Pick two different people.',
    'error.blocked': 'No one can be found for {name}: there are too many exclusions. Remove one.',
    doneTitle: 'Names drawn!',
    doneHint: 'Nobody, not even you, can see the result here, and it isn\'t saved: only leave this page once everyone has their link.',
    modeLinks: 'Send the links',
    modePass: 'Pass the phone',
    copy: 'Copy',
    copied: 'Copied ✓',
    share: 'Share',
    qr: 'QR',
    qrFor: 'QR code for {name}\'s link',
    qrLabel: 'QR code of the link',
    qrHint: '{name} scans this code with their phone camera. Nobody else should scan it.',
    qrDone: 'Scanned',
    takeLink: 'Take my link (QR code)',
    linkFor: '{name}\'s link',
    notSent: 'To send',
    sent: 'Sent ✓',
    shareText: '🎁 {name}, here is your Secret Santa draw. Open it when nobody is looking:',
    passHint: 'Each person taps their name, discovers who they got, then hides it before handing the phone back.',
    edit: 'Edit participants',
    redraw: 'Draw again',
    confirmRedraw: 'Draw again? Links already sent will no longer be valid: you\'ll have to send the new ones to everyone.',
    confirmEdit: 'Go back to the participants? The current draw will be lost, and links already sent will no longer be valid.',
    ready: '{name}, your draw is ready.',
    readyPass: '{name}, your draw is ready. Make sure nobody is looking.',
    discover: 'Reveal',
    giftTo: '{name}, you\'re giving a gift to:',
    budgetFact: 'Budget: {budget}',
    dateFact: 'Exchange: {date}',
    keepSecret: 'Keep it secret! This link stays valid if you need to see it again.',
    hideAndReturn: 'Hide and hand the phone back',
    back: 'Back',
    invalidLink: 'This link is invalid or incomplete. Ask the organiser to send it again.',
    ownDraw: 'Organise my own draw'
  }
});

BoardBox.initTopbar();
BoardBox.applyI18n(t);

const COPIED_FEEDBACK_MS = 1500;

/* ---------- Écrans ---------- */
const screens = { setup: $('#setupScreen'), result: $('#resultScreen'), reveal: $('#revealScreen') };
function showScreen(name) {
  for (const [key, element] of Object.entries(screens)) element.hidden = key !== name;
  window.scrollTo(0, 0);
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

/* ---------- Révélation ----------
   Même écran pour le participant qui ouvre son lien et pour le mode « passer le téléphone » :
   le nom n'apparaît qu'après un appui sur « Découvrir ». */
function formatDate(isoDate) {
  const date = new Date(isoDate + 'T12:00:00');
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(BoardBox.lang, { weekday: 'long', day: 'numeric', month: 'long' });
}

function renderFacts(assignment) {
  const facts = $('#revealFacts');
  facts.replaceChildren();
  if (assignment.budget) facts.append(el('li', { text: t('budgetFact', { budget: assignment.budget }) }));
  if (assignment.date) facts.append(el('li', { text: t('dateFact', { date: formatDate(assignment.date) }) }));
  facts.hidden = facts.children.length === 0;
}

// onDone absent : participant (lien). onDone présent : téléphone passé, on revient à la liste ensuite.
function showReveal(assignment, onDone) {
  const intro = $('#revealIntro');
  const name = $('#revealName');
  const button = $('#revealBtn');
  const back = $('#revealBack');
  const passMode = typeof onDone === 'function';

  intro.textContent = t(passMode ? 'readyPass' : 'ready', { name: assignment.from });
  name.hidden = true;
  $('#revealFacts').hidden = true;
  $('#revealNote').textContent = '';
  $('#ownLink').hidden = passMode;
  button.hidden = false;
  button.textContent = t('discover');
  back.hidden = !passMode;
  back.onclick = showResult;   // mauvais prénom touché : rien n'a été vu, on revient sans rien marquer
  const takeLink = $('#revealQr');
  takeLink.hidden = true;
  takeLink.onclick = () => showQr(assignment.from);

  button.onclick = () => {
    intro.textContent = t('giftTo', { name: assignment.from });
    name.textContent = assignment.to;
    name.hidden = false;
    renderFacts(assignment);
    back.hidden = true;
    if (passMode) {
      button.textContent = t('hideAndReturn');
      button.onclick = onDone;
      takeLink.hidden = false;   // pour revoir sa personne plus tard, sur son propre téléphone
    } else {
      button.hidden = true;
      $('#revealNote').textContent = t('keepSecret');
    }
  };
  showScreen('reveal');
}

function showInvalidLink() {
  $('#revealIntro').textContent = t('invalidLink');
  $('#revealName').hidden = true;
  $('#revealFacts').hidden = true;
  $('#revealBtn').hidden = true;
  $('#revealBack').hidden = true;
  $('#revealQr').hidden = true;
  $('#ownLink').hidden = false;
  showScreen('reveal');
}

/* ---------- Organisation (mémorisée, sans jamais le résultat) ---------- */
function loadOrganisation() {
  const saved = store.get('organisation', null);
  const organisation = { names: [], exclusions: [], budget: '', date: '' };
  if (!saved || typeof saved !== 'object') return organisation;
  if (Array.isArray(saved.names)) {
    for (const raw of saved.names) {
      const name = Tirage.cleanName(raw);
      const isNew = !organisation.names.some(other => Tirage.sameName(other, name));
      if (name && isNew && organisation.names.length < Tirage.MAX_PEOPLE) organisation.names.push(name);
    }
  }
  if (Array.isArray(saved.exclusions)) {
    organisation.exclusions = saved.exclusions.filter(pair => Array.isArray(pair) && pair.length === 2
      && pair[0] !== pair[1] && pair.every(name => organisation.names.includes(name)));
  }
  if (typeof saved.budget === 'string') organisation.budget = saved.budget.slice(0, Tirage.BUDGET_MAX_LENGTH);
  if (typeof saved.date === 'string' && Tirage.DATE_FORMAT.test(saved.date)) organisation.date = saved.date;
  return organisation;
}

const organisation = loadOrganisation();
function saveOrganisation() { store.set('organisation', organisation); }

function showError(key, vars) {
  const box = $('#drawError');
  box.textContent = t(key, vars);
  box.hidden = false;
}
function clearError() { $('#drawError').hidden = true; }

function renderNames() {
  $('#nameList').replaceChildren(...organisation.names.map(name => el('li', { class: 'row' }, [
    el('span', { class: 'row-text', text: name }),
    el('button', { type: 'button', 'aria-label': t('remove', { name }), text: '✕', onclick: () => removeName(name) })
  ])));
  renderPairSelects();
}

function renderPairSelects() {
  for (const select of [$('#pairA'), $('#pairB')]) {
    const current = select.value;
    select.replaceChildren(...organisation.names.map(name => el('option', { value: name, text: name })));
    if (organisation.names.includes(current)) select.value = current;
  }
  if ($('#pairA').value === $('#pairB').value && organisation.names.length > 1) $('#pairB').selectedIndex = 1;
  const tooFewForPair = organisation.names.length < 2;
  for (const control of [$('#pairA'), $('#pairB'), $('#pairAdd')]) control.disabled = tooFewForPair;
}

function renderPairs() {
  $('#pairList').replaceChildren(...organisation.exclusions.map(([a, b]) => el('li', { class: 'row' }, [
    el('span', { class: 'row-text', text: a + ' ↔ ' + b }),
    el('button', { type: 'button', 'aria-label': t('removeExclusion', { a, b }), text: '✕', onclick: () => removePair(a, b) })
  ])));
}

function addName(raw) {
  clearError();
  const name = Tirage.cleanName(raw);
  if (!name) return false;
  if (organisation.names.some(other => Tirage.sameName(other, name))) { showError('error.duplicate', { name }); return false; }
  if (organisation.names.length >= Tirage.MAX_PEOPLE) { showError('error.tooMany', { max: Tirage.MAX_PEOPLE }); return false; }
  organisation.names.push(name);
  saveOrganisation();
  renderNames();
  return true;
}

function removeName(name) {
  organisation.names = organisation.names.filter(other => other !== name);
  organisation.exclusions = organisation.exclusions.filter(pair => !pair.includes(name));
  saveOrganisation();
  renderNames();
  renderPairs();
}

function addPair() {
  clearError();
  const a = $('#pairA').value;
  const b = $('#pairB').value;
  if (!a || !b) return;
  if (a === b) { showError('error.samePair'); return; }
  if (Tirage.isExcluded(organisation.exclusions, a, b)) return;
  organisation.exclusions.push([a, b]);
  saveOrganisation();
  renderPairs();
}

function removePair(a, b) {
  organisation.exclusions = organisation.exclusions.filter(pair => !(pair[0] === a && pair[1] === b));
  saveOrganisation();
  renderPairs();
}

/* ---------- Tirage et distribution ---------- */
let result = null;   // { receiverOf, handedOut: Set des prénoms dont le lien est envoyé ou le tirage vu }

function runDraw() {
  clearError();
  const problem = Tirage.checkNames(organisation.names);
  if (problem) {
    showError('error.' + problem.error, { name: problem.name, min: Tirage.MIN_PEOPLE, max: Tirage.MAX_PEOPLE });
    return false;
  }
  const outcome = Tirage.draw(organisation.names, organisation.exclusions);
  if (!outcome.ok) { showError('error.blocked', { name: outcome.blocked }); return false; }
  result = { receiverOf: outcome.receiverOf, handedOut: new Set() };
  return true;
}

function assignmentOf(name) {
  return { from: name, to: result.receiverOf.get(name), budget: organisation.budget, date: organisation.date };
}

function linkOf(name) {
  return location.href.split('#')[0] + '#' + Tirage.encodeAssignment(assignmentOf(name));
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    // Ancien navigateur ou permission refusée : copie par une zone de texte temporaire
    const area = el('textarea', { readonly: '' });
    area.value = text;
    document.body.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
}

function markHandedOut(name) {
  result.handedOut.add(name);
  renderLinks();
  renderPassGrid();
}

function renderLinks() {
  $('#linkList').replaceChildren(...organisation.names.map(name => {
    const sent = result.handedOut.has(name);
    const message = t('shareText', { name }) + '\n' + linkOf(name);
    const copyButton = el('button', { type: 'button', text: t('copy'), onclick: async () => {
      await copyText(message);
      markHandedOut(name);   // redessine la liste : on retrouve le bouton de cette ligne pour l'accusé « Copié »
      const button = $('#linkList').children[organisation.names.indexOf(name)].querySelector('button');
      button.textContent = t('copied');
      setTimeout(() => { button.textContent = t('copy'); }, COPIED_FEEDBACK_MS);
    } });
    const children = [
      el('span', { class: 'link-name', text: t('linkFor', { name }) }, [el('span', { class: 'link-status', text: t(sent ? 'sent' : 'notSent') })]),
      copyButton
    ];
    if (navigator.share) {
      children.push(el('button', { type: 'button', text: t('share'), onclick: () => {
        navigator.share({ title: t('title'), text: t('shareText', { name }), url: linkOf(name) })
          .then(() => markHandedOut(name), () => {});
      } }));
    }
    children.push(el('button', { type: 'button', text: t('qr'), 'aria-label': t('qrFor', { name }), onclick: () => showQr(name) }));
    return el('li', { class: 'link-row' + (sent ? ' sent' : '') }, children);
  }));
}

// Le participant présent scanne son lien sur l'écran de l'organisateur : rien à lui envoyer
const QR_MAX_SIZE = 260;
let qrName = null;
function showQr(name) {
  qrName = name;
  $('#qrTitle').textContent = t('linkFor', { name });
  $('#qrHint').textContent = t('qrHint', { name });
  BoardBox.drawQr($('#qrCanvas'), linkOf(name), Math.min(QR_MAX_SIZE, window.innerWidth - 90));
  $('#qrDlg').showModal();
}

function renderPassGrid() {
  $('#passGrid').replaceChildren(...organisation.names.map(name => el('button', {
    type: 'button',
    class: result.handedOut.has(name) ? 'seen' : '',
    text: result.handedOut.has(name) ? name + ' ✓' : name,
    onclick: () => showReveal(assignmentOf(name), () => { markHandedOut(name); showResult(); })
  })));
}

let distributionMode = 'links';
function setDistributionMode(mode) {
  distributionMode = mode;
  $('#modeLinks').setAttribute('aria-pressed', String(mode === 'links'));
  $('#modePass').setAttribute('aria-pressed', String(mode === 'pass'));
  $('#linkList').hidden = mode !== 'links';
  $('#passPanel').hidden = mode !== 'pass';
}

function showResult() {
  renderLinks();
  renderPassGrid();
  setDistributionMode(distributionMode);
  showScreen('result');
}

function showSetup() {
  $('#budgetInput').value = organisation.budget;
  $('#dateInput').value = organisation.date;
  renderNames();
  renderPairs();
  showScreen('setup');
}

/* ---------- Événements ---------- */
$('#nameForm').addEventListener('submit', event => {
  event.preventDefault();
  if (addName($('#nameInput').value)) $('#nameInput').value = '';
  $('#nameInput').focus();
});
$('#pairAdd').addEventListener('click', addPair);
$('#budgetInput').addEventListener('input', () => {
  organisation.budget = $('#budgetInput').value.trim().slice(0, Tirage.BUDGET_MAX_LENGTH);
  saveOrganisation();
});
$('#dateInput').addEventListener('change', () => {
  const value = $('#dateInput').value;
  organisation.date = Tirage.DATE_FORMAT.test(value) ? value : '';
  saveOrganisation();
});
$('#drawBtn').addEventListener('click', () => { if (runDraw()) showResult(); });
$('#qrClose').addEventListener('click', () => {
  $('#qrDlg').close();
  if (qrName) markHandedOut(qrName);
  qrName = null;
});
$('#modeLinks').addEventListener('click', () => setDistributionMode('links'));
$('#modePass').addEventListener('click', () => setDistributionMode('pass'));
$('#redrawBtn').addEventListener('click', () => {
  if (confirm(t('confirmRedraw')) && runDraw()) showResult();
});
$('#editBtn').addEventListener('click', () => {
  if (!confirm(t('confirmEdit'))) return;
  result = null;
  showSetup();
});

// Le résultat n'est gardé nulle part : prévenir avant de quitter si des liens n'ont pas été distribués
addEventListener('beforeunload', event => {
  if (result && result.handedOut.size < organisation.names.length) event.preventDefault();
});

// Un autre lien collé dans la même page : on repart de zéro
addEventListener('hashchange', () => location.reload());

/* ---------- Démarrage ---------- */
const encoded = location.hash.slice(1);
if (encoded) {
  const assignment = Tirage.decodeAssignment(encoded);
  if (assignment) showReveal(assignment);
  else showInvalidLink();
} else {
  showSetup();
}
})();
