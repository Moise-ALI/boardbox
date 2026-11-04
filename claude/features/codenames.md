# Fonctionnalité : CodeName

**Statut** : ✅ Terminé
**Priorité** : normale
**Dépend de** : socle-commun

## Description

Jeu d'espions en équipes : une salle partagée par lien (et QR code), vue espion et vue joueur synchronisées en temps réel par Supabase.

## Objectif

Jouer à plusieurs téléphones sans plateau ni installation.

## Fichiers impactés

- `codenames/index.html`, `app.js`, `mots.js`, `donnees.js`, `i18n.js`, `commun/vendor/qrcode.js`
- `supabase/codenames.sql`

## Comportement attendu

- La grille des couleurs n'est jamais lisible par l'API : `codenames_secrets` sans droit public, lue via une fonction qui exige le jeton espion.
- Retourner une carte est fait par la base (seule elle connaît la couleur) ; tour, assassin et victoire appliqués côté base.
- Jetons après le `#` de l'URL, `referrer: no-referrer`.
- Parties supprimées après 3 jours d'inactivité.

### Cas limites

- Téléphone en veille ou réseau coupé : rafraîchissement de secours en plus du temps réel.
- Mots longs : police réduite plutôt que coupés.

## Tests

Recette (2026-10-17, vraie base) : grille inaccessible sans jeton, règles appliquées par la base, synchronisation espion/joueur ~375 ms.
