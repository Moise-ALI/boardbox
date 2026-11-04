# Fonctionnalité : Socle commun (accueil, design, langues, PWA)

**Statut** : ✅ Terminé
**Priorité** : haute
**Dépend de** : aucune

## Description

Ce que partagent tous les outils : l'accueil, le design system « aurora » (`commun/base.css`), le socle JS `window.BoardBox` (`commun/commun.js`), le français/anglais, le thème clair/sombre et l'appli installable hors connexion.

## Objectif

Des outils cohérents entre eux, qu'on ajoute vite, et qui marchent sur téléphone même sans réseau.

## Fichiers impactés

- `index.html`, `accueil.js`, `commun/*`, `sw.js`, `manifest.webmanifest`

## Comportement attendu

- Le thème est appliqué avant l'affichage (pas de flash), mémorisé dans `boardbox.theme`.
- La langue suit le choix mémorisé, sinon le navigateur ; le bouton EN/FR recharge la page.
- Tous les outils fonctionnent hors connexion après une première visite (précache complet).

### Cas limites

- localStorage corrompu ou bloqué : les lectures sont gardées, la page s'affiche quand même.
- Ancienne adresse `/outils/` : caches distincts (préfixe `boardbox-`).

## Tests

Recette : chaque page en FR/EN, clair/sombre, 360 px, mode avion après une visite.

## Notes / Décisions

Conventions détaillées dans `claude/architecture.md` (Design system, Langues, PWA). Historique : boîte à outils renommée BoardBox le 2026-10-18 ; fond fixe sans verre dépoli pour la fluidité mobile le 2026-11-03.
