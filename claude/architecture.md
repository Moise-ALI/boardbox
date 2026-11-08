# Architecture

## Structure

```
index.html, accueil.js   Accueil : cartes des outils en dur dans index.html ; textes FR/EN et recherche dans accueil.js
sitemap.xml, favicon.ico Référencement : liste des pages publiques, icône demandée par défaut par les navigateurs
manifest.webmanifest     PWA : nom, icônes, raccourcis vers chaque outil
sw.js                    Service worker (portée : racine du site) : PRECACHE, stratégies de cache
commun/base.css          Design system « aurora » : variables clair/sombre, reset, .topbar, .btn-primary…
commun/commun.js         window.BoardBox : createStore, thème, langue, i18n, cssVar, service worker
commun/supabase-config.js  URL + clé publishable Supabase (window.BOARDBOX_SUPABASE)
commun/qr.js             BoardBox.drawQr(canvas, texte, taille) : QR code net, couleurs du thème (après vendor/qrcode.js)
commun/fonts/            WOFF2 variables + licences OFL
commun/icons/            Icônes PWA générées aux couleurs de la charte ; apercu-lien.png, image des aperçus de lien (source : claude/apercu-lien.html)
commun/vendor/           Bibliothèques hébergées (qrcode-generator) + licences
tirage/                  Tirage au sort & équipes : app.js (logique sans DOM), ui.js (interface), de.js (dé 3D), i18n.js
compteur/                Compteur de points : une tuile colorée par joueur (app.js)
qui-commence/, minuteur/ Qui commence ? (doigts sur l'écran), Minuteur de tours (app.js)
brise-glace/             Brise-glace : app.js, cartes/<langue>/<paquet>.txt (une question par ligne, lues « réseau d'abord »)
pere-noel/               Père Noël secret : tirage.js (tirage sous contraintes, liens, sans DOM), app.js (interface)
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

### Référencement et aperçus de lien
- Chaque page publique a dans son `<head>` : `meta description`, `link rel="canonical"`, balises `og:*` et `twitter:card`, en français et en adresses complètes. La page d'administration (`noindex`) n'en a pas.
- Image commune `commun/icons/apercu-lien.png` (1200×630). Source : `claude/apercu-lien.html` ; capture : serveur local lancé, `msedge --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 --screenshot=<fichier> http://localhost:8000/claude/apercu-lien.html`. Le serveur la met 30 jours en cache : pour la changer, changer aussi son nom.

### PWA
- Chaque page a dans son `<head>` : `rel="manifest"`, favicon, apple-touch-icon, `meta theme-color` (mise à jour par commun.js selon le thème).
- `sw.js` : pages en réseau d'abord (4 s max, puis mémoire), fichiers statiques et CDN en mémoire d'abord (le `?v=N` garantit les mises à jour), Supabase jamais en mémoire. Caches préfixés `boardbox-`.
- Exception : les contenus modifiés à la main sans `?v=N` (cartes du Brise-glace, `isEditableContent()` dans `sw.js`) sont traités comme les pages, en réseau d'abord.

## Procédures récurrentes

### Ajouter un outil
1. Créer `nom-outil/index.html` + `nom-outil/app.js` sur le modèle de `compteur/` : CSP, topbar avec langue/thème, `base.css` et `commun.js` dans le head, store préfixé, dictionnaire FR/EN.
2. Ajouter sa carte dans `index.html` (`data-tool`, français) et le compte d'outils juste au-dessus, ses textes dans `accueil.js` (nom, description et mots-clés de recherche, FR/EN), ses fichiers dans `PRECACHE` de `sw.js`, un raccourci dans `manifest.webmanifest`, son adresse dans `sitemap.xml`, une ligne dans `README.md`. Sur sa page : `canonical` et balises `og:*`, à recopier d'un autre outil en changeant le titre, la description et l'adresse.
3. Vérifier : mobile 360 px, thème clair et sombre, FR et EN, rechargement (données conservées), console sans erreur ni blocage CSP, téléphone lent (3G + processeur ralenti 4×, voir `claude/dev.md`).
4. Commit, push et publication sur le serveur (avec accord, voir `claude/rules.md`).

### Ajouter des cartes au Brise-glace
- **Une carte** : ajouter une ligne dans `brise-glace/cartes/<fr|en>/<paquet>.txt` (possible directement sur GitHub, bouton crayon), puis publier sur le serveur (`git pull`). Rien d'autre à changer : pas de `?v=N`. Lignes vides et lignes commençant par `#` ignorées ; 300 caractères au plus par carte.
- **Un paquet** : créer `cartes/fr/<id>.txt` (et `cartes/en/<id>.txt`), ajouter `{ id, icon }` dans `PACKS` de `brise-glace/app.js` et son nom `'pack.<id>'` en FR/EN, ajouter les fichiers au `PRECACHE` de `sw.js`, puis incrémenter `app.js?v=N`.

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
| 2026-11-05 | Père Noël secret : le tirage de chacun est dans son lien (après le `#`, base64url, pas chiffré), sans serveur | Exception assumée à « un secret de jeu ne doit jamais être calculable côté client » : sans serveur, rien n'empêche l'organisateur d'ouvrir les liens des autres. Atténuation : le résultat n'est jamais affiché ni mémorisé chez lui. Un serveur n'apporterait que cette garantie, pour un échange entre proches |
| 2026-11-06 | Brise-glace : cartes en fichiers texte lus « réseau d’abord » par le service worker | Moïse ajoute une carte en éditant une ligne sur GitHub, sans base de données ni numéro de version à changer ; la copie en mémoire ne sert qu’au mode hors connexion |
| 2026-11-08 | Site sur boardbox.stream (serveur personnel, nginx, tunnel Cloudflare), GitHub Pages coupé, publication manuelle par `git pull` | Un seul site officiel, et des en-têtes de sécurité que GitHub Pages ne permet pas |
| 2026-11-08 | Cartes de l'accueil en dur dans `index.html`, plus de registre `TOOLS` en JS | Sans JavaScript, moteurs de recherche et aperçus de lien ne voyaient aucun outil. Le JS traduit et filtre ce qui existe déjà |
| 2026-11-08 | Bouton de langue : libellé dans la langue d'arrivée (« Switch to English », avec `lang="en"`), pas « Passer en anglais » comme le proposait l'audit | Celui qui atterrit sur une page dans une langue qu'il ne lit pas doit comprendre le bouton qui l'en sort |
