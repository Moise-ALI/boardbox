# Boîte à outils — conventions

Petites applis web personnelles publiées sur GitHub Pages : https://moise-ali.github.io/outils/

## Principes
- **Statique uniquement** : HTML, CSS, JavaScript natif. Pas de build, pas de framework, pas de npm. Un fichier ouvert dans le navigateur doit fonctionner.
- **Un outil = un dossier** autonome (`nom-outil/index.html`, + `app.js` si la logique dépasse ~300 lignes).
- **Dépôt public** : jamais de clé d'API, mot de passe ou donnée personnelle dans le code.
- Interface en **français**, utilisable au doigt sur mobile (cibles ≥ 44px, pas de défilement horizontal à 360px de large).

## Structure
```
index.html          Accueil ; registre TOOLS et textes dans accueil.js
commun/base.css     Couleurs clair/sombre, reset, .topbar / .back-link / .theme-btn
commun/commun.js    window.Outils : createStore(prefix), bindThemeButton(btn)
tirage/             Tirage au sort & équipes (app.js logique, ui.js interface + dé 3D Three.js, i18n.js)
compteur/           Compteur de points (app.js)
undercover/         Jeu Undercover (un téléphone) + admin.html (modération des associations)
codenames/          Nom de code : salle partagée par lien (vue espion / joueur), temps réel Supabase
supabase/           Scripts SQL à exécuter dans Supabase > SQL Editor (undercover.sql, codenames.sql)
```

## Données partagées et secrets (Supabase)
- Projet Supabase unique pour toute la boîte à outils ; une table par besoin, préfixée par l'outil (`undercover_pairs`).
- Seules l'URL du projet et la clé **publishable/anon** vont dans le code, à un seul endroit : `commun/supabase-config.js` (`window.OUTILS_SUPABASE`). Jamais la clé `secret`/`service_role`, ni un mot de passe.
- Un secret de jeu (ex. grille des couleurs de Nom de code) ne doit jamais être calculable côté client : il vit dans une table sans aucun droit public, et n'est lu que via une fonction `security definer` qui exige un jeton. Les jetons voyagent après le `#` de l'URL (jamais envoyé au serveur), avec `referrer: no-referrer`.
- Temps réel : `postgres_changes` de supabase-js sur une table publique ajoutée à la publication `supabase_realtime` ; toujours prévoir un rafraîchissement de secours (veille du téléphone, réseau).
- Toute table a **RLS activé** et des policies explicites ; le SQL versionné dans `supabase/` est la référence (ré-exécutable).
- Écritures réservées : via `public.is_admin()` (table `admins`, par e-mail de session). L'e-mail admin n'est jamais committé.
- Le public n'insère que des lignes « en attente » ; insérer avec `Prefer: return=minimal` (il ne peut pas relire ce qu'il a écrit).
- L'outil doit rester utilisable si Supabase est indisponible ou en pause (données intégrées en repli).
- Undercover : chaque association validée existe en FR et en EN (lignes liées par `group_id`). Le public ne peut insérer que `word_a, word_b, theme, lang` (droits par colonne). L'admin valide via `undercover_approve` (proposition + traduction, transactionnel), complète via `undercover_set_translation`, ajoute via `undercover_add` ; ces fonctions `security definer` revérifient `is_admin()`.
- Besoin d'un secret côté serveur (clé d'API payante) : Supabase Edge Function ou Cloudflare Worker, jamais dans le front.

## Règles
- **Stockage** : tous les outils partagent le même `localStorage` (même domaine). Chaque clé est préfixée par le nom du dossier de l'outil : utiliser `Outils.createStore('<dossier>')`, ou à défaut des clés `'<dossier>.xxx'`. Ne jamais renommer une clé existante sans migration (les utilisateurs perdraient leurs données). Pour renommer des clés, ne modifier que les appels `localStorage.*` : un remplacement global touche aussi les `id` HTML et les `getElementById` du même nom.
- **Avant chaque push** : charger l'outil modifié et exercer ses actions principales en vérifiant la console (une erreur JS en début de script casse tout ce qui suit, ex. le dé 3D de `tirage/`).
- **Lien de retour** : chaque outil affiche un lien `← Boîte à outils` vers `../`.
- **Cache** : GitHub Pages sert les fichiers avec `max-age=600`. Les scripts/styles propres à un outil sont inclus avec `?v=N` (ex. `app.js?v=2`) : incrémenter N dans les `<script>` à chaque modification du fichier, sinon les visiteurs gardent l'ancienne version jusqu'à 10 min (cas vécu : config.js vide en cache).
- **Chemins relatifs** uniquement (`../commun/...`), le site est servi sous `/outils/`.
- **Dépendances externes** : seulement via CDN avec une version figée (ex. `three.js/r128`), et un repli si elles ne chargent pas.
- **Design system** (`commun/base.css`, style « aurora ») commun à tous les outils : palette chaude rouge/orange : `--accent` (orange brûlé, boutons/liens), `--accent-2` (orange), `--accent-3` (rouge), contrastes WCAG vérifiés, dégradé `--grad` (boutons) et `.grad-text` (titres), verre via `.card` / `.glass`, polices Sora (titres) + Inter (texte). Toujours utiliser les variables (jamais de couleur en dur) pour que les thèmes clair et sombre fonctionnent.
- **Tout le design est piloté par `base.css`** : couleurs, ombres (`--shadow`, `--shadow-lg`, `--shadow-color`), voile des fenêtres (`--overlay`), bouton principal (classe `.btn-primary` ou jetons `--btn-primary-bg/-ink/-shadow`), textes sur couleur (`--on-color`, `--on-signal`), couleurs des joueurs (`--player-1…12`). Aucune couleur en dur dans les outils, CSS comme JS (seule exception : l'éclairage blanc neutre de la scène 3D).
- Côté JS : `Outils.cssVar('--accent')` pour lire une couleur ; les éléments dessinés (canvas, WebGL) écoutent l'événement `outils:theme` pour se redessiner au changement de thème.
- `commun.js` se charge dans le `<head>` (il applique le thème avant l'affichage) ; `base.css` et `commun.js` sont versionnés `?v=N` comme le reste.

## Langues (FR/EN)
- `commun.js` détermine la langue (`Outils.lang` : choix mémorisé, sinon langue du navigateur) ; le bouton `#langBtn` recharge la page dans l'autre langue.
- Chaque outil a un dictionnaire `{ fr: {...}, en: {...} }` (fichier `i18n.js` si gros) et `const t = Outils.i18n(dict)` ; `t('cle', { var })` remplace `{var}`. Repli : français, puis la clé (visible = oubli facile à repérer).
- HTML statique : `data-i18n`, `data-i18n-placeholder`, `data-i18n-aria-label`, `data-i18n-title`, appliqués par `Outils.applyI18n(t)`. Clés communes `common.back`, `common.theme`.
- Contenus de jeu par langue (ex. `UNDERCOVER_PAIRS.fr / .en`, colonne `lang` en base) : listes séparées, pas de traduction mot à mot.
- `undercover/admin.html` (modération) reste en français uniquement.

## Sécurité (à respecter pour tout nouvel outil)
- **Jamais de donnée utilisateur dans `innerHTML`** (ni saisie, ni paramètre d'URL, ni import) : `textContent`, `value`, création d'éléments. Une faille XSS sur n'importe quel outil expose le localStorage de tous (dont la session admin Supabase).
- **Aucun script en ligne** (`<script>…</script>`, `onclick=`) : tout dans des fichiers `.js`. Chaque page a une **CSP** en `<meta>` (`script-src 'self'` + CDN strictement nécessaires, `connect-src` limité) ; la recopier depuis une page existante.
- Scripts de CDN : version figée + **SRI** (`integrity` + `crossorigin="anonymous"`).
- Limiter la taille des entrées (longueur, nombre d'éléments), surtout celles venant d'un lien ou d'un fichier.
- **Aucun service tiers au chargement** : polices auto-hébergées dans `commun/fonts/` (WOFF2 variables + licences OFL, déclarées en `@font-face` dans `base.css`). Ne pas réintroduire Google Fonts ; la CSP n'autorise que `'self'` pour les polices et styles.
- Session admin Supabase en `sessionStorage` (fin de session à la fermeture de l'onglet), `flowType: 'implicit'` obligatoire (le lien e-mail s'ouvre dans un nouvel onglet).
- Glisser-déposer : événements pointer (pas le drag & drop HTML5, inopérant au doigt) ; au doigt, poignée dédiée en `touch-action: none` pour préserver le défilement.
- Pages sensibles (actions admin) : protection anti-clickjacking en JS (`window.top !== window.self`), GitHub Pages ne pouvant pas envoyer `X-Frame-Options` / `frame-ancestors`.
- Lire le localStorage avec garde (`try/catch`, vérifier le type) : une donnée corrompue ne doit pas casser la page.

## Ajouter un outil
1. Créer `nom-outil/index.html` + `nom-outil/app.js` (modèle : `compteur/` — CSP, topbar avec langue/thème, base.css, commun.js dans le head, store préfixé, dictionnaire FR/EN).
2. Ajouter une ligne dans `TOOLS` de `index.html`.
3. Vérifier : mobile 360px, thème clair et sombre, FR et EN, rechargement de page (données conservées), console sans erreur ni blocage CSP.
4. Commit puis push : GitHub Pages republie en ~1 minute.

## Tester en local
```
python -m http.server 8000
```
puis http://localhost:8000/ (ouvrir les fichiers en `file://` casse certains chemins).
