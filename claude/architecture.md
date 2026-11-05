# Architecture

## Structure

```
index.html, accueil.js   Accueil ; registre TOOLS et textes FR/EN dans accueil.js
manifest.webmanifest     PWA : nom, icônes, raccourcis vers chaque outil
sw.js                    Service worker (portée /boardbox/) : PRECACHE, stratégies de cache
commun/base.css          Design system « aurora » : variables clair/sombre, reset, .topbar, .btn-primary…
commun/commun.js         window.BoardBox : createStore, thème, langue, i18n, cssVar, service worker
commun/supabase-config.js  URL + clé publishable Supabase (window.BOARDBOX_SUPABASE)
commun/fonts/            WOFF2 variables + licences OFL
commun/icons/            Icônes PWA générées aux couleurs de la charte
commun/vendor/           Bibliothèques hébergées (qrcode-generator) + licences
tirage/                  Tirage au sort & équipes : app.js (logique sans DOM), ui.js (interface), de.js (dé 3D), i18n.js
compteur/                Compteur de points : une tuile colorée par joueur (app.js)
undercover/              Jeu sur un téléphone (app.js, mots.js, themes.js, donnees.js, i18n.js) + admin.html/admin.js (modération, FR seul)
codenames/               Salle partagée par lien, vue espion / joueur, temps réel (app.js, mots.js, donnees.js, i18n.js)
supabase/                Scripts SQL de référence (undercover.sql, codenames.sql)
```

## Règles par couche

| Couche | Fait | Ne fait pas |
|---|---|---|
| `outil/index.html` | Structure, CSP, styles propres à l'outil, inclusion des scripts `?v=N` | Script en ligne, couleur en dur |
| `outil/app.js` (+ `ui.js`, `i18n.js` si gros) | Logique et interface de l'outil, dictionnaire FR/EN | Accès direct au localStorage sans préfixe, `innerHTML` avec donnée utilisateur |
| `commun/` | Ce qui sert à plusieurs outils (design, stockage, thème, langue) | Code propre à un outil |
| `supabase/*.sql` | Tables, RLS, policies, fonctions `security definer` | Données personnelles, e-mail admin |
| `sw.js` | Mise en cache | Mettre Supabase en mémoire |

## Conventions transverses

### Design system (`commun/base.css`)
- Palette chaude : `--accent` (orange brûlé, boutons/liens), `--accent-2` (orange), `--accent-3` (rouge), contrastes WCAG vérifiés ; dégradé `--grad` (boutons) et `.grad-text` (titres) ; verre via `.card` / `.glass`.
- Ombres `--shadow`, `--shadow-lg`, `--shadow-color` ; voile des fenêtres `--overlay` ; bouton principal `.btn-primary` (jetons `--btn-primary-bg/-ink/-shadow`) ; textes sur couleur `--on-color`, `--on-signal`.
- Couleurs des joueurs `--player-1…12` ; voiles sur couleur de joueur `--tint-dark` (boutons) et `--tint-light` (bandes).
- JS : `BoardBox.cssVar('--accent')` pour lire une couleur ; canvas et WebGL écoutent l'événement `boardbox:theme` (émis sur `document`) pour se redessiner. `commun.js` se charge dans le `<head>` : il applique le thème avant l'affichage.

### Langues (FR/EN)
- `commun.js` détermine `BoardBox.lang` (choix mémorisé, sinon langue du navigateur) ; `#langBtn` recharge la page dans l'autre langue.
- Chaque outil : dictionnaire `{ fr: {...}, en: {...} }`, `const t = BoardBox.i18n(dict)`, `t('cle', { var })`. Repli : français, puis la clé (visible = oubli facile à repérer).
- HTML statique : `data-i18n`, `data-i18n-placeholder`, `data-i18n-aria-label`, `data-i18n-title`, appliqués par `BoardBox.applyI18n(t)`. Clés communes `common.back`, `common.theme`.
- Contenus de jeu : listes séparées par langue (`UNDERCOVER_PAIRS.fr / .en`, colonne `lang`), pas de traduction mot à mot.

### Supabase
- Une table par besoin, préfixée par l'outil ; **RLS activé** et policies explicites partout.
- Secret de jeu dans une table sans droit public, lu via une fonction `security definer` qui exige un jeton ; les jetons voyagent après le `#` de l'URL, avec `referrer: no-referrer`.
- Écritures réservées via `public.is_admin()` (table `admins`, e-mail de session) ; les fonctions admin le revérifient.
- Le public n'insère que des lignes « en attente », avec `Prefer: return=minimal`.
- Temps réel : `postgres_changes` sur une table publique de la publication `supabase_realtime`, toujours avec un rafraîchissement de secours (veille du téléphone, réseau).
- Besoin d'un secret serveur (clé d'API payante) : Supabase Edge Function ou Cloudflare Worker, jamais dans le front.

### PWA
- Chaque page a dans son `<head>` : `rel="manifest"`, favicon, apple-touch-icon, `meta theme-color` (mise à jour par commun.js selon le thème).
- `sw.js` : pages en réseau d'abord (4 s max, puis mémoire), fichiers statiques et CDN en mémoire d'abord (le `?v=N` garantit les mises à jour), Supabase jamais en mémoire. Caches préfixés `boardbox-`.

## Procédures récurrentes

### Ajouter un outil
1. Créer `nom-outil/index.html` + `nom-outil/app.js` sur le modèle de `compteur/` : CSP, topbar avec langue/thème, `base.css` et `commun.js` dans le head, store préfixé, dictionnaire FR/EN.
2. Ajouter une ligne dans `TOOLS` de `accueil.js` (+ textes FR/EN), ses fichiers dans `PRECACHE` de `sw.js`, un raccourci dans `manifest.webmanifest`, une ligne dans `README.md`.
3. Vérifier : mobile 360 px, thème clair et sombre, FR et EN, rechargement (données conservées), console sans erreur ni blocage CSP, téléphone lent (3G + processeur ralenti 4×, voir `claude/dev.md`).
4. Commit puis push (avec accord).

### Renommer des clés de localStorage
Écrire une migration (lire l'ancienne clé, écrire la nouvelle). Ne modifier que les appels `localStorage.*` : un remplacement global touche aussi les `id` HTML et les `getElementById` du même nom.

### Modifier la base Supabase
Modifier le `.sql` de `supabase/` (il doit rester ré-exécutable), puis l'exécuter dans Supabase > SQL Editor.

## Décisions

| Date | Décision | Raison |
|---|---|---|
| 2026-10-17 | Site statique sans build, un dossier par outil | Hébergement GitHub Pages gratuit, maintenance minimale |
| 2026-10-17 | Supabase pour les seules données partagées, RLS + fonctions `security definer` | Dépôt public : la sécurité doit tenir côté base, la clé publique ne suffit à rien |
| 2026-10-17 | Polices auto-hébergées, CSP stricte, SRI | Aucun service tiers au chargement, réduire l'impact d'une faille |
| 2026-10-17 | Session admin en `sessionStorage` | Pas lisible depuis les autres outils du domaine, disparaît à la fermeture |
| 2026-10-18 | PWA avec précache complet | Utilisable en soirée sans réseau |
| 2026-11-03 | Fond fixe, pas de verre dépoli sur les éléments nombreux | Fluidité sur téléphone d'entrée de gamme |
| 2026-11-03 | Compteur en tuiles à ordre fixe (plus de tri par score) | Les boutons ne doivent pas bouger sous le doigt ; le rang reste affiché |
| 2026-11-04 | Rester sur Supabase plutôt qu'un Postgres sur le Raspberry ; le Pi réveille Supabase chaque jour | Un Postgres seul n'est pas joignable depuis un navigateur : il faudrait reconstruire l'API, le temps réel de CodeName et la connexion admin par e-mail. Une base à la maison rendrait aussi tout BoardBox dépendant de la maison. Le seul vrai problème était la mise en pause après 7 jours d'inactivité |
