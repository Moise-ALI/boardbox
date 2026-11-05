# Fonctionnalité : Recherche sur l'accueil

**Statut** : ✅ Terminé le 2026-11-05
**Priorité** : normale
**Dépend de** : aucune

## Description

Un champ de recherche au-dessus de la liste des outils de l'accueil : la liste se filtre à chaque lettre tapée.

## Objectif

Avec 6 outils (bientôt 7 avec Message secret), la liste dépasse l'écran du téléphone : trouver un outil d'un geste, y compris avec un mot qui n'est pas dans son nom (« chrono », « dé », « score »).

## Fichiers impactés

- `index.html` (champ, style, `accueil.js?v=11`)
- `accueil.js` (filtre, mots-clés FR/EN de chaque outil)
- `claude/architecture.md` (procédure « Ajouter un outil » : penser aux mots-clés)

Aucune logique existante ne fait déjà ce travail.

## Comportement attendu

- Champ `type="search"` avec loupe, au-dessus de la liste ; texte indicatif « Rechercher un outil… ».
- Filtre à chaque frappe sur le nom, la description et des **mots-clés** propres à chaque outil, dans la langue affichée.
- Insensible aux majuscules et aux accents (« equipe » trouve « Équipes ») ; plusieurs mots = tous doivent correspondre.
- Un mot tapé de 3 lettres ou plus doit **commencer** un mot de l'outil (« chrono » → « chronomètre ») ; un mot de 1 ou 2 lettres doit être un mot **entier** (« dé » → Tirage seul). Les mots de liaison (« de », « les », « the »…) sont ignorés, dans les textes comme dans la saisie : « de » sans accent réaffiche donc tout.
- Le compteur « 6 outils » devient « 2 / 6 outils » pendant une recherche (évite l'accord « 1 outils »).
- Aucun résultat : « Aucun outil ne correspond. »
- Entrée : ouvre l'outil s'il ne reste qu'un résultat. Échap ou la croix du champ : efface et réaffiche tout.
- Rien n'est mémorisé (pas de localStorage, pas de paramètre d'URL).

### Sécurité

- Aucun `innerHTML` : les cartes existantes sont seulement masquées (`hidden`), le texte saisi n'est jamais réinjecté dans la page.
- `maxlength="40"` (HTML) et coupure à 40 en JS ; la saisie ne sert qu'à une comparaison de chaînes (pas d'expression régulière construite à partir d'elle).
- Pas de nouvelle source dans la CSP, pas de requête réseau.

### Cas limites

- Champ vide ou espaces seuls : tous les outils.
- Lecteur d'écran : le compteur est annoncé (`aria-live="polite"`), le champ a un libellé.
- 360 px : le champ tient sur la largeur, cible ≥ 44 px.

## Questions ouvertes

- [x] Aucune : comportement standard, choix tranchés ci-dessus.

## Tests

Recette automatisée (iframe + Edge sans fenêtre) :
- « dé » → Tirage seul ; « compteur de points » → Compteur ; « chrono » → Minuteur seul ; « equipe » → Tirage (et CodeName : « en équipes ») ; « score » → Compteur ; « zzz » → message vide ; champ vidé → 6 outils ;
- en anglais : « timer » → Minuteur ;
- Entrée avec un seul résultat → l'outil s'ouvre ;
- saisie `<img src=x onerror=alert(1)>` → aucun élément créé, aucun script exécuté ;
- 360 px, clair/sombre, console sans erreur ni blocage CSP.

## Plan d'implémentation

- [x] 1. `accueil.js` : mots-clés FR/EN par outil, fonction `normalize()` (minuscules, sans accents), filtre, compteur, message vide, Entrée/Échap.
- [x] 2. `index.html` : champ et style (variables de `base.css`), `accueil.js?v=11`.
- [x] 3. Recette (section Tests).
- [x] 4. `architecture.md` : ajouter « mots-clés » à la procédure « Ajouter un outil » ; `history.md`.

## Notes / Décisions

- Demandée par Moïse le 2026-11-05, pendant le plan de Message secret.
- Relecture du 2026-11-05 : la première version cherchait n'importe où dans le texte, et « dé » (« de » sans accent) trouvait les 6 outils. Passage à la comparaison par début de mot, mot entier pour 1-2 lettres, mots de liaison ignorés.
