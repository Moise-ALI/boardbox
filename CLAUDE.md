# Boîte à outils — conventions

Petites applis web personnelles publiées sur GitHub Pages : https://moise-ali.github.io/outils/

## Principes
- **Statique uniquement** : HTML, CSS, JavaScript natif. Pas de build, pas de framework, pas de npm. Un fichier ouvert dans le navigateur doit fonctionner.
- **Un outil = un dossier** autonome (`nom-outil/index.html`, + `app.js` si la logique dépasse ~300 lignes).
- **Dépôt public** : jamais de clé d'API, mot de passe ou donnée personnelle dans le code.
- Interface en **français**, utilisable au doigt sur mobile (cibles ≥ 44px, pas de défilement horizontal à 360px de large).

## Structure
```
index.html          Accueil : registre TOOLS (une ligne par outil)
commun/base.css     Couleurs clair/sombre, reset, .topbar / .back-link / .theme-btn
commun/commun.js    window.Outils : createStore(prefix), bindThemeButton(btn)
tirage/             Tirage au sort & création d'équipes (design propre, dé 3D Three.js)
compteur/           Compteur de points pour jeux de société
undercover/         Jeu Undercover (un téléphone) + admin.html (modération des associations)
supabase/           Scripts SQL à exécuter dans Supabase > SQL Editor (schéma + règles RLS)
```

## Données partagées et secrets (Supabase)
- Projet Supabase unique pour toute la boîte à outils ; une table par besoin, préfixée par l'outil (`undercover_pairs`).
- Seules l'URL du projet et la clé **publishable/anon** vont dans le code (`<outil>/config.js`). Jamais la clé `secret`/`service_role`, ni un mot de passe.
- Toute table a **RLS activé** et des policies explicites ; le SQL versionné dans `supabase/` est la référence (ré-exécutable).
- Écritures réservées : via `public.is_admin()` (table `admins`, par e-mail de session). L'e-mail admin n'est jamais committé.
- Le public n'insère que des lignes « en attente » ; insérer avec `Prefer: return=minimal` (il ne peut pas relire ce qu'il a écrit).
- L'outil doit rester utilisable si Supabase est indisponible ou en pause (données intégrées en repli).
- Besoin d'un secret côté serveur (clé d'API payante) : Supabase Edge Function ou Cloudflare Worker, jamais dans le front.

## Règles
- **Stockage** : tous les outils partagent le même `localStorage` (même domaine). Chaque clé est préfixée par le nom du dossier de l'outil : utiliser `Outils.createStore('<dossier>')`, ou à défaut des clés `'<dossier>.xxx'`. Ne jamais renommer une clé existante sans migration (les utilisateurs perdraient leurs données). Pour renommer des clés, ne modifier que les appels `localStorage.*` : un remplacement global touche aussi les `id` HTML et les `getElementById` du même nom.
- **Avant chaque push** : charger l'outil modifié et exercer ses actions principales en vérifiant la console (une erreur JS en début de script casse tout ce qui suit, ex. le dé 3D de `tirage/`).
- **Lien de retour** : chaque outil affiche un lien `← Boîte à outils` vers `../`.
- **Cache** : GitHub Pages sert les fichiers avec `max-age=600`. Les scripts/styles propres à un outil sont inclus avec `?v=N` (ex. `app.js?v=2`) : incrémenter N dans les `<script>` à chaque modification du fichier, sinon les visiteurs gardent l'ancienne version jusqu'à 10 min (cas vécu : config.js vide en cache).
- **Chemins relatifs** uniquement (`../commun/...`), le site est servi sous `/outils/`.
- **Dépendances externes** : seulement via CDN avec une version figée (ex. `three.js/r128`), et un repli si elles ne chargent pas.
- **Design system** (`commun/base.css`, style « aurora ») commun à tous les outils : bleu = couleur principale (`--accent`), orange = accent (`--accent-2`), dégradé `--grad` (boutons) et `.grad-text` (titres), verre via `.card` / `.glass`, polices Sora (titres) + Inter (texte). Toujours utiliser les variables (jamais de couleur en dur) pour que les thèmes clair et sombre fonctionnent.
- `commun.js` se charge dans le `<head>` (il applique le thème avant l'affichage) ; `base.css` et `commun.js` sont versionnés `?v=N` comme le reste.

## Ajouter un outil
1. Créer `nom-outil/index.html` (partir de `compteur/index.html` comme modèle : topbar, base.css, commun.js, store préfixé).
2. Ajouter une ligne dans `TOOLS` de `index.html`.
3. Vérifier : mobile 360px, thème clair et sombre, rechargement de page (données conservées), console sans erreur.
4. Commit puis push : GitHub Pages republie en ~1 minute.

## Tester en local
```
python -m http.server 8000
```
puis http://localhost:8000/ (ouvrir les fichiers en `file://` casse certains chemins).
