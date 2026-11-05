# Fonctionnalité : Tirage & Équipes

**Statut** : ✅ Terminé
**Priorité** : normale
**Dépend de** : socle-commun

## Description

Tirer au sort dans une liste, répartir en équipes équilibrées, lancer un dé 3D. La liste peut être partagée par lien.

## Objectif

Remplacer le papier dans le chapeau et le dé physique.

## Fichiers impactés

- `tirage/index.html`, `tirage/app.js` (logique sans DOM), `tirage/ui.js` (interface), `tirage/de.js` (dé 3D, three.js r128), `tirage/i18n.js`

## Comportement attendu

- Le dé 3D se pose sur la face réellement tournée vers l'utilisateur.
- Glisser-déposer des éléments au doigt (poignée dédiée, événements pointer).

### Cas limites

- Lien de partage : contenu limité en taille et jamais injecté en HTML (faille XSS corrigée le 2026-10-17).
- three.js indisponible : le reste de l'outil fonctionne (dé emoji à la place). Il est chargé par `ui.js` après l'affichage, pour ne pas retarder la page.
- Une erreur JS en début de script casse le dé : vérifier la console.

## Tests

Recette : ajouter/retirer des éléments, tirer, faire des équipes, lancer le dé, ouvrir un lien de partage.
