# Boîte à outils

Mes petites applis du quotidien, utilisables depuis n'importe quel appareil, en français et en anglais.

**➡️ https://moise-ali.github.io/outils/**

| Outil | Description |
|---|---|
| [🎲 Tirage & Équipes](https://moise-ali.github.io/outils/tirage/) | Tirer au sort dans une liste, répartir en équipes équilibrées, dé 3D |
| [🏆 Compteur de points](https://moise-ali.github.io/outils/compteur/) | Scores des soirées jeux : classement animé, objectif, manches, annulation |
| [🕵️ Undercover](https://moise-ali.github.io/outils/undercover/) | Jeu d'ambiance sur un seul téléphone, avec associations proposées par les joueurs et modérées |
| [🗝️ CodeName](https://moise-ali.github.io/outils/codenames/) | Jeu d'espions en équipes : salle partagée par lien, vue espion et vue joueur synchronisées en direct |

Tout fonctionne dans le navigateur, sans compte : les données restent sur votre appareil.
Seuls les éléments partagés sont stockés en ligne (Supabase) : les associations d'Undercover validées, et les parties de CodeName en cours (supprimées après 3 jours d'inactivité).

## Développement

Site statique (HTML, CSS, JavaScript, sans build). Tester en local :

```
python -m http.server 8000
```

puis http://localhost:8000/.

- Conventions, design system, langues et règles de sécurité : [CLAUDE.md](CLAUDE.md)
- Base de données (tables, droits, fonctions) : [supabase/undercover.sql](supabase/undercover.sql), [supabase/codenames.sql](supabase/codenames.sql)
