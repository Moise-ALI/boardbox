# BoardBox — Claude Code

> Chargé automatiquement à chaque session. C'est un aiguillage : le détail est dans `claude/`.

Petites applis web pour les soirées jeux, en ligne sur https://boardbox.stream/ — **dépôt public**.

## Démarrage

Avant toute modification, lire : `claude/rules.md` → `claude/tasks.md` → `claude/context.md`.
Pour reprendre après une interruption : `/kit:start`.

## Cycle de travail (plugin kit)

| Commande | Quand |
|---|---|
| `/kit:start` | Début de session : où en est-on ? |
| `/kit:feature <nom>` | Nouvelle fonctionnalité (fiche + questions, puis plan) |
| `/kit:continue` | Reprendre l'étape suivante de la tâche en cours |
| `/kit:validate` | Contrôle avant de clore (relecteur indépendant) |
| `/kit:finish` | Clore la tâche : historique, archive, suite |
| `/kit:bug <symptôme>` | Déclarer un bug (diagnostic + plan, pas de code avant validation) |
| `/kit:fix <quoi>` | Petit correctif direct, tracé dans l'historique |
| `/kit:retour` | Fin de session : ce qu'on retient pour le projet ou pour le kit |

Brouillon d'idée : déposer un `.md` libre dans `claude/inbox/`, puis `/kit:feature <nom>`.

## Source de vérité

`commun/base.css` (design), `commun/commun.js` (socle JS), `supabase/*.sql` (base), `sw.js` + `manifest.webmanifest` + `index.html` + `accueil.js` + `sitemap.xml` (registre des outils). Séquence obligatoire après modification (`?v=N`, précache, recette, publication) : `claude/rules.md`.

## Stack

HTML, CSS, JavaScript natif sans build ni npm ; serveur personnel (nginx, tunnel Cloudflare) ; Supabase (Undercover, CodeName) ; PWA hors connexion.

## Fichiers clés

| Besoin | Fichier |
|---|---|
| Interdits, obligations, sécurité, séquence après modification | `claude/rules.md` |
| Structure, design system, langues, Supabase, PWA, ajouter un outil | `claude/architecture.md` |
| Stockage, tables, rôles, pièges | `claude/context.md` |
| Tester en local (serveur, recette automatisée) | `claude/dev.md` |
| Décisions d'architecture | `claude/architecture.md` (section Décisions) |
| Fonctionnalités | `claude/features/` |
| Questions en attente | `claude/questions.md` |
