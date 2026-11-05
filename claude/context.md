# Contexte du projet

## Description

BoardBox regroupe de petites applis web pour les soirées jeux de société (tirage au sort, compteur de points, jeux Undercover et CodeName…), utilisables sur téléphone sans compte, en français et en anglais. Publiées sur GitHub Pages : https://moise-ali.github.io/boardbox/ — projet personnel de Moïse, dépôt public.

## Stack

- **Front** : HTML, CSS, JavaScript natif, sans build ni framework. Polices Sora, Inter, JetBrains Mono auto-hébergées.
- **Hébergement** : GitHub Pages (statique, sous `/boardbox/`, `max-age=600`).
- **Base de données** : un projet Supabase unique pour tout BoardBox (PostgreSQL + RLS + temps réel), utilisé seulement par Undercover et CodeName via supabase-js (CDN, version figée).
- **Authentification** : aucune pour le public ; lien magique Supabase pour l'admin (modération Undercover).
- **Appli installable** : PWA (`manifest.webmanifest`, `sw.js`), fonctionne hors connexion.
- **Bibliothèques** : three.js r128 (dé 3D de Tirage, CDN), qrcode-generator (`commun/vendor/`).

## Fonctionnement global

1. L'accueil (`index.html` + `accueil.js`) liste les outils ; chaque outil est un dossier autonome.
2. Chaque page charge `commun/commun.js` dans le `<head>` : thème (avant affichage), langue, enregistrement du service worker.
3. Les données personnelles (listes, scores, préférences) restent dans le localStorage de l'appareil.
4. Seuls les éléments partagés passent par Supabase : associations Undercover validées, parties CodeName en cours (supprimées après 3 jours d'inactivité).

## Modèle de données

### localStorage (partagé par tous les outils du domaine)

| Préfixe | Contenu |
|---|---|
| `boardbox.` | Préférences communes : `theme`, langue |
| `tirage.` | Listes, historique des tirages |
| `compteur.` | `partie` : objectif, manche, joueurs (`name`, `score`, `base` = score au début de la manche, `c` = couleur), historique d'annulation |
| `undercover.`, `codenames.` | Réglages et état local des jeux |

### Supabase

| Table | Rôle |
|---|---|
| `admins` | E-mails des admins (aucun droit public) — l'e-mail n'est jamais committé |
| `undercover_pairs` | Associations de mots, FR et EN liées par `group_id`, statut en attente / validée |
| `codenames_games` | État public d'une partie (mots, cartes retournées, tour, gagnant), diffusé en temps réel |
| `codenames_secrets` | Grille des couleurs + jeton espion, aucun droit public |

## Rôles et droits

| Rôle | Droits |
|---|---|
| Visiteur | Utilise tous les outils ; propose une association Undercover (insertion « en attente » de `word_a, word_b, theme, lang` uniquement) ; crée et joue une partie CodeName via les fonctions `security definer` |
| Espion CodeName | Possède le jeton (après le `#` du lien) qui permet de lire la grille via une fonction |
| Admin | Valide, traduit, ajoute les associations Undercover (`public.is_admin()`, session en `sessionStorage`) |

## Points critiques / pièges

- **Un seul localStorage pour tout le domaine** `moise-ali.github.io` (partagé aussi avec les autres dépôts du compte) : préfixer chaque clé, et une faille XSS sur un outil expose tous les autres.
- **Cache** : sans incrément du `?v=N`, les visiteurs gardent l'ancien fichier (10 min côté GitHub, indéfiniment côté service worker).
- GitHub Pages ne peut pas envoyer `X-Frame-Options` ni `frame-ancestors` : les pages admin se protègent en JS (`window.top !== window.self`).
- Le lien e-mail de connexion admin s'ouvre dans un nouvel onglet : `flowType: 'implicit'` obligatoire.
- Le glisser-déposer HTML5 ne marche pas au doigt : événements pointer + poignée en `touch-action: none`.
- **Page plein écran** (zone tactile qui remplit l'écran) : `height: 100dvh` **et** `min-height: 0` sur le `body`, sinon le `min-height: 100vh` de `base.css` l'emporte et, sur iPhone, la page passe sous la barre du navigateur (100vh ignore les barres). Modèle : `qui-commence/index.html`.
- Élément qui suit le doigt : le déplacer par la propriété CSS `translate`, et mesurer la zone au contact plutôt qu'à chaque mouvement (fluidité).
- **iPhone** : aucune vibration possible (`navigator.vibrate` absent) ; le son Web Audio passe à l'état « interrupted » dans l'appli installée : le relancer à chaque appui dès qu'il n'est pas « running » (modèle : `minuteur/app.js`).
- Supabase gratuit se met en pause après une semaine d'inactivité : les outils doivent fonctionner avec leurs données intégrées. Depuis le 2026-11-04, le Raspberry de la maison (qui sert aussi https://boardbox.stream) fait une lecture par jour pour l'en empêcher : `supabase-eveil.timer`, documenté dans `D:\PROJET\raspberry-maison\claude\features\boardbox.md`. Il lit l'adresse et la clé dans `commun/supabase-config.js` : garder le format `url: '…'` / `key: '…'` (une valeur par ligne) si on modifie ce fichier.
