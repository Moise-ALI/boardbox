# Fonctionnalité : Père Noël secret

**Statut** : ✅ Terminé le 2026-11-05
**Priorité** : normale
**Dépend de** : aucune

## Description

L'organisateur saisit les prénoms des participants et les exclusions (pas de cadeau à son conjoint…). L'appli fait le tirage et donne un lien par participant. Chacun ouvre le sien et ne découvre que la personne à qui il offre un cadeau. Pas de serveur, pas d'e-mail, pas de compte.

## Objectif

Organiser un Père Noël secret (Secret Santa) en famille ou entre amis en quelques secondes. Les sites existants demandent tous des e-mails et un compte.

## Fichiers impactés

- `pere-noel/index.html`, `pere-noel/tirage.js` (logique sans DOM, testable seule), `pere-noel/app.js` (interface) — nouveaux
- Intégration : `accueil.js` (🎅, textes et mots-clés FR/EN), `index.html` (`?v`), `sw.js` (PRECACHE), `manifest.webmanifest`, `README.md`

Aucune logique existante ne fait ce tirage sous contraintes. Le tirage au hasard utilisera `crypto.getRandomValues`, comme `qui-commence/app.js` (petite fonction locale, comme dans les autres outils).

## Comportement attendu

### Organisateur
- Saisie des prénoms (3 à 30), un par ligne ou un par un.
- Exclusions : pour chaque personne, cocher qui elle ne doit pas tirer (le couple est proposé dans les deux sens).
- Bouton « Faire le tirage » : tirage aléatoire où personne ne se tire soi-même ni une personne exclue.
- Écran des liens : une ligne par participant (« Lien de Paul » : Copier, Partager). **Le résultat n'est jamais affiché à l'organisateur.**
- Après le tirage, l'appli **oublie le résultat** : il n'est ni affiché ni mémorisé. Seuls les liens le contiennent.

### Participant
- Ouvre son lien : « Paul, tu offres un cadeau à… » puis un bouton « Découvrir » (évite qu'un écran regardé par-dessus l'épaule le dévoile).
- Le lien reste valable : on peut le rouvrir si on a oublié.
- Rien n'est lu par le réseau : tout est dans le lien, après le `#` (jamais envoyé au serveur ni lu par l'aperçu des messageries).

### Contenu du lien
- `…/pere-noel/#<données>` : prénom du participant, prénom de la personne à gâter, éventuellement budget et date. Encodé (pas lisible d'un coup d'œil dans l'adresse), pas chiffré : le lien **est** le secret.

### Sécurité
- Les prénoms venant d'un lien sont affichés par `textContent`, longueur limitée (30 caractères), lien plafonné en taille ; un lien abîmé ou trafiqué affiche « Lien invalide », sans planter.
- CSP stricte habituelle, aucune requête réseau, `referrer no-referrer`.

### Cas limites
- Tirage impossible (trop d'exclusions, ex. 3 personnes dont un couple qui s'exclut) : message clair, avec la personne bloquante si possible.
- Prénoms en double : refusé (« deux Paul » → demander « Paul B. »).
- Moins de 3 participants : refusé (à 2, chacun devinerait).
- L'organisateur participe aussi : il reçoit son lien comme les autres.

### Limite assumée
L'organisateur qui ouvrirait les liens des autres verrait leur tirage : impossible à empêcher sans serveur. Atténuation : l'appli n'affiche jamais le résultat et ne le garde pas.

## Questions ouvertes

Réponses de Moïse le 2026-11-05 (toutes les recommandations retenues) :
- [x] Q1 — Distribution : liens par messagerie **et** mode « passe le téléphone ».
- [x] Q2 — Budget et date de l'échange dans le lien, facultatifs.
- [x] Q3 — Liste d'envies : non (impossible sans serveur).
- [x] Q4 — Participants et exclusions mémorisés chez l'organisateur, **jamais** le résultat.
- [x] Q5 — « Pas la même personne que l'an dernier » : non (exclusion à ajouter à la main).

## Tests

Recette automatisée (iframe + Edge sans fenêtre) :
- 1 000 tirages aléatoires avec exclusions : jamais soi-même, jamais une exclusion, chacun donne et reçoit exactement une fois ;
- cas impossible (3 personnes, un couple exclu dans les deux sens) : message, pas de boucle infinie ;
- ouverture de chaque lien → bon prénom après « Découvrir » ;
- lien trafiqué, tronqué, ou prénom de 10 000 caractères / balise `<img onerror>` → « Lien invalide » ou texte affiché tel quel, aucun élément créé ;
- l'écran de l'organisateur ne contient jamais le nom d'une personne à gâter (recherche dans le DOM), et le localStorage non plus ;
- 360 px, clair/sombre, FR/EN, console sans erreur ni blocage CSP, téléphone lent.

## Plan d'implémentation

Validé par Moïse le 2026-11-05 (« tu peux lancer la feature »).

Choix techniques :
- Exclusions saisies **par paires** (« Paul ↔ Julie », dans les deux sens) : couvre le cas du couple en un geste ; l'exclusion à sens unique, rare, n'est pas proposée.
- Tirage : appariement par chemins augmentants (algorithme de Kuhn) avec ordres mélangés par `crypto.getRandomValues`. Toujours une solution s'il en existe une, jamais de boucle infinie, et la personne bloquante est connue si c'est impossible.
- Lien : `#` + base64url du JSON `{ v: 1, from, to, budget?, date? }` ; taille, types et longueurs vérifiés à l'ouverture.
- Résultat gardé **en mémoire seulement** ; avertissement du navigateur si on quitte la page avant d'avoir envoyé tous les liens.
- Stockage `pere-noel.organisation` : `{ names, exclusions, budget, date }`.

- [x] 1. `pere-noel/tirage.js` : tirage sous contraintes (Kuhn) + encodage/décodage du lien, testés seuls (1 000 tirages, cas impossible, liens trafiqués).
- [x] 2. `pere-noel/index.html` + écran d'organisation : prénoms, paires d'exclusion, budget, date, mémorisation.
- [x] 3. Écran des liens (Copier, Partager, coche « envoyé ») et mode « passe le téléphone » (prénom → confirmation → Découvrir → Cacher).
- [x] 4. Écran du participant (lien ouvert) : « Découvrir », budget, date, lien vers « Organiser mon tirage ».
- [x] 5. Intégration : `accueil.js` (🎅, mots-clés), `index.html` (`?v`), `sw.js`, `manifest.webmanifest`, `README.md`.
- [x] 6. Recette (section Tests).
- [x] 7. Documentation : `context.md` (préfixe `pere-noel.`), `history.md`.

## Notes / Décisions

- Idée retenue le 2026-11-05 parmi les idées « en réserve » (choisie avec « Mes rangements », à faire ensuite).
- QR code par participant (demandé par Moïse le 2026-11-05) : bouton « QR » sur chaque ligne de lien, et « Emporter mon lien (QR code) » en mode « passer le téléphone » une fois la personne découverte ; le participant scanne son lien sur l'écran de l'organisateur. La fonction de dessin de CodeName a été déplacée dans `commun/qr.js` (`BoardBox.drawQr`) pour ne pas la dupliquer. Vérifié : le QR décodé (OpenCV) redonne exactement le lien.
- Exclusions par paires (dans les deux sens) ; avertissement du navigateur si on quitte la page avant d'avoir distribué tous les liens.
- Icônes de l'accueil changées à la demande de Moïse le 2026-11-05 : compteur 🧮, Père Noël secret 🎅, Undercover 🎭, CodeName 🕵️.
- Relecture du 2026-11-05 : boutons passés à 44 px, prénoms nettoyés des caractères de contrôle et coupés par caractère (un emoji n'est plus coupé en deux), décision « le lien porte le secret » inscrite dans `architecture.md`.
