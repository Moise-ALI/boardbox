# Fonctionnalité : Compteur de points

**Statut** : ✅ Terminé
**Priorité** : normale
**Dépend de** : socle-commun

## Description

Une tuile colorée par joueur (grille de 2 sur téléphone) : −10/−5/−1 en haut, score au centre, +1/+5/+10 en bas, badge des points de la manche, bande de progression vers l'objectif avec le rang.

## Objectif

Compter les points d'une soirée jeux d'une main, sans erreur (annulation) ; forme inspirée de l'appli d'un collègue de Moïse (2026-11-03).

## Fichiers impactés

- `compteur/index.html`, `compteur/app.js`, `commun/base.css` (`--player-1…12`, `--tint-dark`, `--tint-light`)

## Comportement attendu

- Tuiles en ordre d'ajout fixe : rien ne bouge sous le doigt ; rang « sportif » (ex æquo à la même place), meneur entouré.
- Badge = `score − base` ; « Manche suivante » remet `base = score`.
- Objectif atteint : bandeau + confettis ; Annuler (40 états), Remettre à zéro (confirmation).
- 12 joueurs maximum, noms de 18 caractères.

### Cas limites

- Partie enregistrée avant le champ `base` : migrée avec `base = score` (badge à 0).
- Score à 4 chiffres ou plus : police réduite.
- Retrait d'un joueur : annulable depuis le toast, le joueur revient à sa place.

## Tests

Recette automatisée faite le 2026-11-03 (iframe + Edge sans fenêtre) : migration, badge, rangs, victoire, retrait + annulation, 360 px, clair/sombre.
