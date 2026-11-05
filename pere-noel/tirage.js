/* Père Noël secret : logique sans interface (règles des participants, tirage, contenu des liens).
   Séparée de app.js pour pouvoir être testée seule. */
window.PereNoelTirage = (() => {
'use strict';

const NAME_MAX_LENGTH = 30;
const BUDGET_MAX_LENGTH = 20;
const MIN_PEOPLE = 3;    // à deux, chacun devinerait l'autre
const MAX_PEOPLE = 30;
const LINK_MAX_LENGTH = 600;
const LINK_VERSION = 1;
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const BASE64URL_FORMAT = /^[A-Za-z0-9_-]+$/;

/* ---------- Hasard ---------- */
function randomIndex(n) {
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

/* ---------- Participants ---------- */
// Caractères de contrôle et espaces superflus retirés, longueur bornée : un prénom vient aussi d'un
// lien, donc d'un inconnu. Découpe par caractère (Array.from) pour ne pas couper un emoji en deux.
function cleanName(name) {
  const text = String(name ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')   // contrôles, sauf tabulation et retours à la ligne
    .replace(/\s+/g, ' ').trim();
  return Array.from(text).slice(0, NAME_MAX_LENGTH).join('');
}

function sameName(a, b) {
  return a.toLocaleLowerCase() === b.toLocaleLowerCase();
}

// Renvoie null si la liste est utilisable, sinon { error, name? } (clé de traduction côté interface)
function checkNames(names) {
  if (names.length < MIN_PEOPLE) return { error: 'tooFew' };
  if (names.length > MAX_PEOPLE) return { error: 'tooMany' };
  for (let i = 0; i < names.length; i++) {
    if (names.slice(0, i).some(other => sameName(other, names[i]))) return { error: 'duplicate', name: names[i] };
  }
  return null;
}

// Une exclusion est une paire [a, b] valable dans les deux sens (a ne tire pas b, b ne tire pas a)
function isExcluded(exclusions, giver, receiver) {
  return exclusions.some(([a, b]) => (a === giver && b === receiver) || (a === receiver && b === giver));
}

/* ---------- Tirage ----------
   Chaque personne doit recevoir quelqu'un d'autre qu'elle-même et hors de ses exclusions, et chacun
   doit être gâté une seule fois : c'est un appariement dans un graphe biparti. L'algorithme de Kuhn
   (chemins augmentants) trouve toujours une solution s'il en existe une, sans boucle infinie ;
   les ordres de parcours sont mélangés pour que le résultat change à chaque tirage.
   Renvoie { ok: true, receiverOf: Map(donneur → receveur) } ou { ok: false, blocked: prénom }. */
function draw(names, exclusions) {
  const canGive = (giver, receiver) => giver !== receiver && !isExcluded(exclusions, giver, receiver);
  const receiverOf = new Map();
  const giverOf = new Map();

  // Donne un receveur à `giver`, quitte à réattribuer celui d'un autre donneur s'il peut en prendre un autre
  function assign(giver, visited) {
    for (const receiver of shuffled(names)) {
      if (visited.has(receiver) || !canGive(giver, receiver)) continue;
      visited.add(receiver);
      const previousGiver = giverOf.get(receiver);
      if (previousGiver === undefined || assign(previousGiver, visited)) {
        receiverOf.set(giver, receiver);
        giverOf.set(receiver, giver);
        return true;
      }
    }
    return false;
  }

  for (const giver of shuffled(names)) {
    if (!assign(giver, new Set())) return { ok: false, blocked: giver };
  }
  return { ok: true, receiverOf };
}

/* ---------- Liens ----------
   Tout le tirage d'une personne tient après le # du lien : jamais envoyé au serveur ni lu par les
   aperçus des messageries. Encodé en base64url pour ne pas être lisible d'un coup d'œil, pas chiffré :
   le lien lui-même est le secret. */
function toBase64Url(text) {
  let binary = '';
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded) {
  const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
}

function encodeAssignment({ from, to, budget, date }) {
  const data = { v: LINK_VERSION, from, to };
  if (budget) data.budget = budget;
  if (date) data.date = date;
  return toBase64Url(JSON.stringify(data));
}

// Lien ouvert par un participant : tout est vérifié, un lien abîmé ou trafiqué renvoie null
function decodeAssignment(encoded) {
  if (typeof encoded !== 'string' || encoded.length > LINK_MAX_LENGTH || !BASE64URL_FORMAT.test(encoded)) return null;
  let data;
  try { data = JSON.parse(fromBase64Url(encoded)); } catch (e) { return null; }
  if (!data || typeof data !== 'object' || data.v !== LINK_VERSION) return null;

  const from = typeof data.from === 'string' ? cleanName(data.from) : '';
  const to = typeof data.to === 'string' ? cleanName(data.to) : '';
  if (!from || !to || from !== data.from || to !== data.to) return null;

  const assignment = { from, to, budget: '', date: '' };
  if (typeof data.budget === 'string') assignment.budget = data.budget.trim().slice(0, BUDGET_MAX_LENGTH);
  if (typeof data.date === 'string' && DATE_FORMAT.test(data.date)) assignment.date = data.date;
  return assignment;
}

return {
  NAME_MAX_LENGTH, BUDGET_MAX_LENGTH, MIN_PEOPLE, MAX_PEOPLE, DATE_FORMAT,
  cleanName, sameName, checkNames, isExcluded, draw, encodeAssignment, decodeAssignment
};
})();
