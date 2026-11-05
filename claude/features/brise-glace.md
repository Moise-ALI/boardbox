# Fonctionnalité : Brise-glace (cartes de questions)

**Statut** : ✅ Terminé le 2026-11-06
**Priorité** : normale (n° 1 du top 5 de Moïse)
**Dépend de** : aucune

## Description

Des paquets de cartes de questions pour lancer la conversation aux repas et aux soirées (« Quel est le meilleur conseil qu'on t'ait donné ? »). On choisit un ou plusieurs paquets, on tire une carte, on passe le téléphone. Hors connexion, en français et en anglais.

## Objectif

Animer un repas ou une soirée sans préparation, et permettre à Moïse d'enrichir les paquets lui-même, facilement, sans base de données.

## Fichiers impactés

- `brise-glace/index.html`, `brise-glace/app.js` (nouveaux)
- `brise-glace/cartes/fr/<paquet>.txt`, `brise-glace/cartes/en/<paquet>.txt` (nouveaux) : **une question par ligne**
- `sw.js` : fichiers des cartes en « réseau d'abord » (voir plus bas) + PRECACHE
- Intégration : `accueil.js` (💬, textes et mots-clés), `index.html` (`?v`), `manifest.webmanifest`, `README.md`

Aucune logique existante ne fait ce travail. Le tirage sans répétition reprend le principe de `crypto.getRandomValues` des autres outils.

## Comportement attendu

### Ajouter des cartes (Moïse)
- Chaque paquet est un simple fichier texte, une question par ligne, modifiable **directement sur GitHub** (bouton crayon, même depuis le téléphone) : on ajoute une ligne, on enregistre, c'est en ligne en une minute.
- Pas de `?v=N` à changer : le service worker lit ces fichiers « réseau d'abord » (copie en mémoire seulement pour le hors connexion), comme les pages.
- Lignes vides et lignes commençant par `#` ignorées (commentaires, titres de section).
- Ajouter un **paquet** = un nouveau fichier + une ligne dans la liste des paquets de `app.js` (nom, emoji, FR/EN).

### Jouer
- Choix des paquets (plusieurs à la fois possible), mémorisé.
- Une carte en grand, bouton « Carte suivante » ou toucher la carte ; balayer vers la gauche = suivante, vers la droite = précédente (`touch-action: pan-y` sur la carte).
- **Pas de répétition** tant que les paquets choisis ne sont pas épuisés, même après rechargement (cartes déjà vues mémorisées par paquet) ; « Remettre les cartes » pour recommencer.
- Retour à la carte précédente.
- Langue des cartes = langue de l'interface ; paquet absent dans une langue → non proposé.

### Sécurité
- Le texte des cartes est affiché par `textContent` (jamais `innerHTML`), longueur bornée (300 caractères par carte), nombre de cartes borné par fichier.
- Aucune requête hors du site, CSP habituelle.

### Cas limites
- Hors connexion et jamais ouvert : paquets présents grâce au PRECACHE.
- Fichier de paquet introuvable ou vide : paquet ignoré, les autres fonctionnent.
- Tous les paquets décochés : message « Choisissez au moins un paquet » au toucher de « Tirer » (le bouton reste actif pour que le message explique quoi faire).

## Questions ouvertes

Réponses de Moïse le 2026-11-05 (toutes les recommandations retenues) :
- [x] Q1 — Paquets : Légères, Souvenirs, Profondes, Famille (adaptée aux enfants), Couple, Entre amis ; ~40 cartes chacun, rédigées par Claude, relues par Moïse.
- [x] Q2 — Fichiers texte dans le dépôt **et** « Mes cartes » dans l'appli (gardées sur le téléphone).
- [x] Q3 — Anglais écrit directement en anglais, paquets éventuellement moins fournis.
- [x] Q4 — Couple : complice et tendre, sans contenu osé.
- [x] Q5 — Nom : « Brise-glace » (EN : « Icebreakers »).

## Tests

Recette automatisée (iframe + Edge sans fenêtre) :
- chargement des paquets FR et EN ; lignes vides et `#` ignorées ; carte de 1 000 caractères tronquée ;
- 200 tirages : aucune répétition avant épuisement, puis message « paquet épuisé » et remise à zéro ;
- rechargement : paquets choisis et cartes vues conservés ;
- fichier modifié sur le serveur → nouvelle carte visible au rechargement **sans** changer de `?v` ;
- hors connexion (service worker) : les cartes s'affichent ;
- carte contenant `<img src=x onerror=alert(1)>` → texte affiché tel quel ;
- 360 px, clair/sombre, FR/EN, console sans erreur ni blocage CSP, téléphone lent.

## Plan d'implémentation

Validé par Moïse le 2026-11-05.

Choix techniques :
- Paquets déclarés dans `PACKS` de `app.js` (id, emoji, noms FR/EN) ; cartes dans `cartes/<langue>/<id>.txt`.
- « Mes cartes » : paquet spécial `perso`, stocké dans `brise-glace.mesCartes` (200 cartes max), affiché quelle que soit la langue.
- Cartes vues mémorisées **par texte** (`brise-glace.vues`) : ajouter une ligne dans un fichier ne remet pas tout le paquet à zéro.
- `sw.js` : les `.txt` de `brise-glace/cartes/` passent par `networkFirst` (comme les pages) ; ils sont aussi dans PRECACHE.

- [x] 1. Rédiger les paquets FR (6 × ~40) et EN (6 × ~30).
- [x] 2. `brise-glace/index.html` + `app.js` : chargement et lecture des fichiers, choix des paquets, Mes cartes.
- [x] 3. Écran de jeu : carte en grand, suivante (bouton ou toucher), précédente, cartes restantes, paquet épuisé / remise à zéro.
- [x] 4. `sw.js` (réseau d'abord pour les cartes, PRECACHE) + intégration : `accueil.js` (💬, mots-clés), `index.html` (`?v`), `manifest.webmanifest`, `README.md`.
- [x] 5. Recette (section Tests).
- [x] 6. Documentation : `context.md` (préfixe `brise-glace.`), `architecture.md` (procédure « Ajouter des cartes »), `history.md`.

## Notes / Décisions

- Choisie le 2026-11-05 (n° 1 du top 5) ; demande de Moïse : pouvoir ajouter des cartes facilement, sans Supabase.
- Recette du 2026-11-06 : 242 tirages sans doublon, mémorisation, saisie piégée neutralisée, FR/EN, 320 à 760 px sans débordement (correctif : colonne de `.screen` bornée par `minmax(0, 1fr)`). Le passage par le service worker n'a pas pu être testé automatiquement (Edge sans fenêtre n'active pas les service workers) : vérifié sur le code (`isEditableContent`), à confirmer par Moïse après mise en ligne en ajoutant une ligne sur GitHub.
- Demandes de Moïse du 2026-11-06 : carte en **verre dépoli** (halos flous à la couleur du paquet derrière la carte ; une seule carte à l'écran, donc pas d'enjeu de fluidité) ; **import** des cartes personnelles par liste collée (Notes, message) ou fichier `.txt` (500 Ko max, UTF-8 vérifié), **export** `.txt` réimportable, **Tout effacer**, bouton **Jouer avec mes cartes seulement** ; plafond porté à 500 cartes personnelles.
- Icônes des paquets changées à la demande de Moïse (2026-11-06) : Légères 🪶, Profondes 💭, Entre amis 🤝 (pas d'alcool) ; plus d'icône sur la carte tirée, pour un rendu plus sobre (l'étiquette du paquet reste).
- Relecture du 2026-11-06 : balayage ajouté (prévu par la fiche, oublié), `fetch` des cartes en `no-cache` (sans service worker, une carte ajoutée apparaît sans attendre les 10 min du cache HTTP), en-tête de `sw.js` mis à jour. Choix conservé : « Précédente » parcourt toutes les cartes tirées pendant la visite, même d'un paquet décoché depuis.
