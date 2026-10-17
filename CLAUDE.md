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
```

## Règles
- **Stockage** : tous les outils partagent le même `localStorage` (même domaine). Chaque clé est préfixée par le nom du dossier de l'outil : utiliser `Outils.createStore('<dossier>')`, ou à défaut des clés `'<dossier>.xxx'`. Ne jamais renommer une clé existante sans migration (les utilisateurs perdraient leurs données).
- **Lien de retour** : chaque outil affiche un lien `← Boîte à outils` vers `../`.
- **Chemins relatifs** uniquement (`../commun/...`), le site est servi sous `/outils/`.
- **Dépendances externes** : seulement via CDN avec une version figée (ex. `three.js/r128`), et un repli si elles ne chargent pas.
- Un outil peut garder son propre design ; les nouveaux outils partent de `commun/base.css`.

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
