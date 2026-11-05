# BoardBox

Mes petites applis du quotidien, utilisables depuis n'importe quel appareil, en français et en anglais.

**➡️ https://moise-ali.github.io/boardbox/**

| Outil | Description |
|---|---|
| [🎲 Tirage & Équipes](https://moise-ali.github.io/boardbox/tirage/) | Tirer au sort dans une liste, répartir en équipes équilibrées, dé 3D |
| [👆 Qui commence ?](https://moise-ali.github.io/boardbox/qui-commence/) | Chacun pose un doigt sur l'écran : l'appli désigne qui commence, ou tout l'ordre de jeu |
| [🧮 Compteur de points](https://moise-ali.github.io/boardbox/compteur/) | Scores des soirées jeux : une tuile colorée par joueur, objectif, manches, annulation |
| [⏳ Minuteur de tours](https://moise-ali.github.io/boardbox/minuteur/) | Sablier par tour ou pendule par joueur : on touche l'écran pour passer la main |
| [🎅 Père Noël secret](https://moise-ali.github.io/boardbox/pere-noel/) | Tirage au sort sans inscription : un lien par participant, qui ne révèle que sa propre personne à gâter |
| [🎭 Undercover](https://moise-ali.github.io/boardbox/undercover/) | Jeu d'ambiance sur un seul téléphone, avec associations proposées par les joueurs et modérées |
| [🕵️ CodeName](https://moise-ali.github.io/boardbox/codenames/) | Jeu d'espions en équipes : salle partagée par lien, vue espion et vue joueur synchronisées en direct |

Tout fonctionne dans le navigateur, sans compte : les données restent sur votre appareil.
Seuls les éléments partagés sont stockés en ligne (Supabase) : les associations d'Undercover validées, et les parties de CodeName en cours (supprimées après 3 jours d'inactivité).

## Développement

Site statique (HTML, CSS, JavaScript, sans build). Tester en local :

```
python -m http.server 8000
```

puis http://localhost:8000/.

- Conventions, design system, langues et règles de sécurité : [claude/rules.md](claude/rules.md) et [claude/architecture.md](claude/architecture.md)
- Fonctionnalités et suivi des tâches : [claude/features/](claude/features/), [claude/tasks.md](claude/tasks.md)
- Base de données (tables, droits, fonctions) : [supabase/undercover.sql](supabase/undercover.sql), [supabase/codenames.sql](supabase/codenames.sql)
