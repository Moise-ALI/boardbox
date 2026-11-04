# Fonctionnalité : Qui commence ?

**Statut** : 🟡 En cours
**Priorité** : normale
**Dépend de** : socle-commun

## Description

Chacun pose un doigt sur l'écran ; un cercle coloré suit chaque doigt. Quand plus personne ne bouge le nombre de doigts pendant 2 secondes, l'appli désigne un doigt (ou numérote tous les doigts en mode « Ordre »).

## Objectif

Décider qui commence en une seconde, sans discussion, le téléphone posé au milieu de la table.

## Fichiers impactés

- `qui-commence/index.html`, `qui-commence/app.js` (nouveaux)
- `accueil.js` (TOOLS + textes FR/EN), `index.html` (`accueil.js?v=`), `sw.js` (PRECACHE), `manifest.webmanifest` (raccourci), `README.md`

## Comportement attendu

- Zone tactile plein écran sous la barre du haut ; chaque doigt posé crée un cercle à sa couleur (`--player-n`, première couleur libre), qui suit le doigt.
- À partir de 2 doigts, un anneau se remplit en 2 s ; tout ajout ou retrait de doigt le relance.
- Résultat :
  - **Un gagnant** (par défaut) : le cercle choisi grossit, les autres s'éteignent ;
  - **Ordre** : chaque cercle affiche son numéro (1, 2, 3…).
- Vibration courte à chaque doigt posé, plus longue au résultat (si le téléphone le permet).
- Le résultat reste affiché tant que des doigts sont posés ; quand tous sont levés, la zone redevient prête.
- Le mode choisi est mémorisé (`qui-commence.mode`).
- Tirage équitable : `crypto.getRandomValues`.

### Cas limites

- Un seul doigt : message « Au moins 2 doigts ».
- Plus de 10 doigts : les suivants sont ignorés.
- Geste système (pointercancel), appui long (menu, sélection, loupe iOS) : neutralisés, le doigt annulé est retiré.
- Souris (PC) : un clic pose un cercle fixe, un clic sur un cercle l'enlève, bouton « Recommencer » pour tout effacer.
- Défilement, zoom et rebond de page désactivés dans la zone (`touch-action: none`, `overscroll-behavior: none`).

## Tests

Recette automatisée (iframe + Edge sans fenêtre, événements pointer simulés) : poser 3 pointeurs → résultat après 2 s avec un seul gagnant ; mode Ordre → numéros 1..3 tous différents ; retirer un pointeur avant 2 s → pas de résultat ; console sans erreur ; 360 px, clair/sombre, FR/EN.
Recette manuelle par Moïse : à plusieurs doigts sur son téléphone.

## Plan d'implémentation

- [x] Étape 1 — Page `qui-commence/index.html` (modèle compteur : CSP, topbar, styles) + `app.js` (dictionnaire FR/EN, suivi des pointeurs, anneau, tirage, modes)
- [x] Étape 2 — Intégration : accueil, sw.js, manifeste, README
- [ ] Étape 3 — Recette automatisée + captures, puis push avec accord

## Notes / Décisions

- Outil séparé plutôt qu'un onglet de `tirage/` : il a besoin de tout l'écran (2026-11-04).
- Recette automatisée faite le 2026-11-04 : tirage après 2 s, relance si un doigt part, mode Ordre, souris, plafond à 10, 360 px, clair/sombre, accueil FR/EN, console sans erreur.
- Vibration : les navigateurs ne l'autorisent qu'après un vrai « tap » (lever un doigt) ; au tout premier tour, le téléphone peut rester muet. Accepté, l'affichage suffit.
- Pendant le résultat, les cercles restent figés même doigts levés (pour lire le résultat) ; le premier contact suivant relance un tour.
- iPhone (2026-11-04) : la zone dépassait en bas, le `min-height: 100vh` de base.css l'emportait sur `100dvh` (100vh ignore la barre d'adresse de Safari) ; corrigé par `min-height: 0` sur la page.
