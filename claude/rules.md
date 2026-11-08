# Règles — lire avant toute modification

## Interdictions absolues

- Coder sans avoir lu `claude/tasks.md` (risque de hors-périmètre).
- Créer une logique en double : vérifier que `commun/commun.js` ou un autre outil ne le fait pas déjà.
- **Dépôt public** : jamais de clé d'API, mot de passe, e-mail admin ou donnée personnelle dans le code ni dans `claude/`.
  Seules l'URL Supabase et la clé **publishable/anon** sont permises, à un seul endroit : `commun/supabase-config.js`. Jamais la clé `secret`/`service_role`.
- **Pas de build, pas de framework, pas de npm** : HTML, CSS, JavaScript natif. Un fichier ouvert dans le navigateur doit fonctionner.
- **Jamais de donnée utilisateur dans `innerHTML`** (saisie, paramètre d'URL, import) : `textContent`, `value`, création d'éléments. Une faille XSS sur un outil expose le localStorage de tous (dont la session admin Supabase).
- **Aucun script en ligne** (`<script>…</script>`, `onclick=`) : tout dans des fichiers `.js`.
- **Aucune couleur en dur** dans les outils, CSS comme JS (seule exception : l'éclairage blanc neutre de la scène 3D du dé). Tout passe par les variables de `commun/base.css`.
- **Aucun service tiers au chargement** : polices auto-hébergées (`commun/fonts/`), ne pas réintroduire Google Fonts.
- **Ne jamais renommer une clé de localStorage sans migration** (les utilisateurs perdraient leurs données).
- Un secret de jeu (ex. grille de CodeName) ne doit jamais être calculable côté client.

## Obligations

- Cocher les étapes dans `claude/tasks.md` au fur et à mesure, pas à la fin.
- Noter toute décision d'architecture non triviale dans `claude/architecture.md` (Décisions).
- Mettre à jour `claude/context.md` si un comportement global change.
- Message de commit en français qui dit **quoi** (titre ≤ 72 caractères) et **pourquoi** (corps). Ne pas committer ni pousser sans l'accord de Moïse.
- Interface en **français et anglais**, utilisable au doigt : cibles ≥ 44 px, pas de défilement horizontal à 360 px de large.
- **Chemins relatifs** uniquement (`../commun/...`) : le site doit pouvoir changer d'adresse sans retouche (il l'a déjà fait). Seule exception : les balises qui exigent une adresse complète (`canonical`, `og:*`, `sitemap.xml`), en `https://boardbox.stream/…`.
- **Stockage** : clés préfixées par le dossier de l'outil, via `BoardBox.createStore('<dossier>')`. Lire avec garde (`try/catch`, vérifier le type) : une donnée corrompue ne doit pas casser la page.
- **Limiter la taille des entrées** (longueur, nombre d'éléments), surtout celles venant d'un lien ou d'un fichier.
- Chaque page a une **CSP** en `<meta>` (`script-src 'self'` + CDN strictement nécessaires, `connect-src` limité) : la recopier depuis une page existante.
- **Dépendances externes** : version figée + **SRI** (`integrity` + `crossorigin="anonymous"`) + un repli si elles ne chargent pas. Celles qui doivent marcher hors ligne vont dans `commun/vendor/` avec leur licence.
- Chaque outil affiche un lien `← BoardBox` vers `../`.
- L'outil doit rester utilisable si Supabase est indisponible ou en pause (données intégrées en repli).

## Lisibilité — le projet doit rester maintenable sans IA

Un développeur qui découvre le projet doit pouvoir s'y retrouver seul, avec `claude/architecture.md` et `claude/features/`, sans passer par une IA.
- **Noms explicites** (variables, fonctions, fichiers) : ils disent ce que c'est ou ce que ça fait. Pas d'abréviations obscures.
- **Fonctions courtes**, une seule responsabilité ; sortir tôt plutôt qu'empiler les `if` imbriqués.
- **Le simple plutôt que le malin** : pas d'astuce, pas d'abstraction « pour plus tard », pas de dépendance pour dix lignes.
- **Suivre le style du code existant** (organisation, nommage, langue) plutôt que d'en introduire un nouveau.
- **Commentaires sur le pourquoi**, pas sur le quoi : règle métier non évidente, contournement, choix surprenant.
- **Pas de code mort**, de logique en double, ni de TODO sans tâche associée.
- Test de fin : quelqu'un qui ouvre ce fichier pour la première fois comprend-il ce qu'il fait en deux minutes ?

## Source de vérité

- **Design** : `commun/base.css` (couleurs, ombres, boutons, couleurs des joueurs, thèmes clair/sombre).
- **Socle JS** : `commun/commun.js` (`window.BoardBox` : stockage, thème, langue, i18n, service worker).
- **Base de données** : `supabase/*.sql`, la référence ré-exécutable (Supabase > SQL Editor).
- **Hors connexion** : `PRECACHE` de `sw.js` ; **raccourcis** : `manifest.webmanifest` ; **accueil** : cartes dans `index.html`, textes FR/EN dans `accueil.js` ; **référencement** : `sitemap.xml`.

**Séquence obligatoire après toute modification d'un fichier `.js` ou `.css`** (le serveur envoie `max-age=600`, le service worker garde les fichiers en mémoire) :
1. Incrémenter son `?v=N` dans **toutes** les pages qui l'incluent (`base.css` et `commun.js` sont inclus par toutes les pages). Cas vécu : `config.js` vide resté en cache.
2. Nouveau fichier nécessaire hors connexion → l'ajouter à `PRECACHE` de `sw.js` (chemin sans `?v=`). Incrémenter `CACHE_VERSION` seulement pour forcer un re-téléchargement complet.
3. Charger l'outil (voir `claude/dev.md`) et exercer ses actions principales, console sans erreur ni blocage CSP. Une erreur JS en début de script casse tout ce qui suit.
4. Commit puis push (avec accord), puis publier sur le serveur : `git pull --ff-only` dans son clone du dépôt (la procédure détaillée est gardée hors de ce dépôt public). Le push seul ne met rien en ligne.

## Garde-fous automatiques (candidats aux hooks)

- Une modification d'un `.js`/`.css` sans changement de son `?v=N` dans le HTML.
- `innerHTML` alimenté par autre chose qu'un gabarit fixe.
- Une couleur hexadécimale ou `rgb(` dans un fichier d'outil (hors `commun/base.css`).
- La clé `service_role` ou un e-mail dans un fichier versionné.

## Périmètre

Chaque tâche a un périmètre dans `claude/tasks.md`. Une modification hors périmètre qui semble nécessaire :
1. la signaler dans la réponse ;
2. créer une tâche (`/kit:bug` ou `/kit:feature`) ;
3. continuer la tâche en cours sans dévier.
