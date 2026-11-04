# Environnement de développement

## Prérequis

- Un navigateur récent. Rien à installer pour le projet (pas de npm).
- Un serveur HTTP local : ouvrir les fichiers en `file://` casse certains chemins et le service worker.

## Variables d'environnement

Aucune. La seule configuration est `commun/supabase-config.js` (URL du projet + clé publishable, publiques par nature). La clé `service_role` et l'e-mail admin ne sont jamais dans le dépôt.

## Commandes courantes

```bash
# Démarrer (machine avec Python)
python -m http.server 8000
# PC perso de Moïse (pas de Python système)
D:\IA\ComfyUI_windows_portable\python_embeded\python.exe -I -m http.server 8000
# puis http://localhost:8000/ — après une modification : Ctrl + F5 (le service worker garde l'ancienne version)

# Tester depuis un téléphone du même Wi-Fi : http://<IP du PC>:8000/
# (le pare-feu Windows doit autoriser le port 8000, commande à lancer en administrateur)

# Base de données : exécuter supabase/<outil>.sql dans Supabase > SQL Editor
```

## Tests

Pas de tests automatisés versionnés. Recette avant chaque push : charger l'outil modifié, exercer ses actions principales, console sans erreur ni blocage CSP, 360 px, clair/sombre, FR/EN.

Recette automatisable par Claude (Edge sans fenêtre, sans dépendance) :
- Une page de test temporaire à la racine (`_test.html` + `_test.js`, à supprimer ensuite) charge l'outil dans une `<iframe>` de 360 px, prépare le localStorage, clique sur les boutons via `contentDocument`, et écrit les résultats dans un `<pre>`.
- `msedge --headless --disable-gpu --user-data-dir=<dossier temporaire> --virtual-time-budget=4000 --dump-dom http://localhost:8000/_test.html` renvoie le DOM avec les résultats ; `--enable-logging=stderr --v=0` donne la console (erreurs, CSP).
- Capture d'écran : `--screenshot=<fichier.png> --window-size=740,1100` sur une page qui affiche l'outil dans deux iframes de 360 px (thème clair et sombre via `boardbox.theme`). `--window-size` seul ne descend pas à 360 px : passer par une iframe.
