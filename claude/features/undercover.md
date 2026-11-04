# Fonctionnalité : Undercover

**Statut** : ✅ Terminé
**Priorité** : normale
**Dépend de** : socle-commun

## Description

Jeu d'ambiance sur un seul téléphone qu'on se passe : civils, undercover et Mister White optionnel. Associations de mots par thèmes, intégrées et proposées par les joueurs, modérées par un admin.

## Objectif

Jouer sans cartes ni appli à pubs, avec des associations qui s'enrichissent.

## Fichiers impactés

- `undercover/index.html`, `app.js`, `mots.js`, `themes.js`, `donnees.js`, `i18n.js`
- `undercover/admin.html`, `admin.js` (modération, français uniquement)
- `supabase/undercover.sql`

## Comportement attendu

- Chaque association validée existe en FR et en EN (lignes liées par `group_id`).
- Le public ne peut insérer que `word_a, word_b, theme, lang` (droits par colonne), en attente.
- L'admin valide via `undercover_approve` (proposition + traduction, transactionnel), complète via `undercover_set_translation`, ajoute via `undercover_add` ; ces fonctions revérifient `is_admin()`.

### Cas limites

- Supabase en pause : associations intégrées (`mots.js`) en repli.
- Page admin chargée dans un cadre : elle se vide (anti-clickjacking).

## Tests

Recette : partie complète à 4 joueurs avec et sans Mister White ; proposition d'association ; validation côté admin.
