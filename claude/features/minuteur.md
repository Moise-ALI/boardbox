# Fonctionnalité : Minuteur de tours

**Statut** : 🟡 En cours
**Priorité** : normale
**Dépend de** : socle-commun (reprend les joueurs de `compteur.partie` s'ils existent)

## Description

Le téléphone posé au milieu de la table chronomètre les tours. Le joueur actif a une grande zone à sa couleur avec son temps ; toucher l'écran passe au suivant.

## Objectif

Éviter que les longues réflexions ralentissent toute la table (idée inspirée du sablier de l'appli d'un collègue).

## Fichiers impactés

- `minuteur/index.html`, `minuteur/app.js` (nouveaux) + intégration (accueil, sw.js, manifeste, README)

## Comportement attendu

- Joueurs : ceux du compteur (noms, couleurs) s'il y a une partie, sinon « Joueur 1… » modifiables ; 2 à 8.
- **Sablier** : durée fixe par tour (60 s par défaut) ; au-delà, le temps continue en négatif (« −0:12 ») et la zone clignote, sans passer la main.
- **Pendule** : réserve par joueur pour la partie (10 min par défaut), qui ne s'écoule que pendant son tour.
- Boutons : pause, retour au joueur précédent, réglages.
- Fin du temps : vibration, bip court (Web Audio), flash.
- Temps calculé sur l'heure réelle (exact en arrière-plan), partie enregistrée (rechargement sans perte), écran maintenu allumé (Wake Lock) si possible.

### Cas limites

- Rechargement ou veille pendant un tour : le temps écoulé entre-temps est compté.
- Wake Lock indisponible (certains navigateurs) : sans effet bloquant.
- Double tap involontaire : un second appui moins de 0,6 s après un passage est ignoré (sinon on sauterait un joueur).
- Touche pendant la pause : reprend le temps au lieu de passer au suivant.
- « Précédent » : rend la main au joueur précédent avec le temps qu'il avait au moment du passage (et sa réserve en pendule).
- Partie du compteur absente ou corrompue : joueurs par défaut ; plus de 8 joueurs : les 8 premiers.

## Tests

Recette automatisée (iframe + Edge sans fenêtre, horloge simulée par `--virtual-time-budget`) :
- sablier 60 s : après 2 s, 0:58 ; passage au suivant remet 1:00 ; double tap ignoré ; temps négatif après la fin ;
- pendule : la réserve du joueur ne baisse que pendant son tour ; « Précédent » restaure sa réserve ;
- pause : le temps ne bouge plus, une touche reprend ;
- rechargement en cours de tour : le temps continue où il en était ;
- reprise des joueurs du compteur ; 360 px, clair/sombre, FR/EN, console sans erreur.

## Plan d'implémentation

- [x] Étape 1 — Écran de réglages : mode (Sablier / Pendule), durée en pastilles (sablier 15 s → 3 min, pendule 1 → 30 min), joueurs (nom, couleur, ajout, retrait, reprise du compteur), « Lancer » / « Reprendre la partie »
- [x] Étape 2 — Écran de jeu plein écran : grande zone du joueur actif (nom, temps, barre de progression), file des joueurs suivants, Précédent / Pause / Réglages ; horloge sur l'heure réelle, partie enregistrée à chaque action ; bip (Web Audio) + vibration + clignotement à la fin du temps ; Wake Lock
- [x] Étape 3 — Intégration : accueil, sw.js, manifeste, README
- [ ] Étape 4 — Recette automatisée + captures, essai sur téléphone par Moïse, push avec accord

## Notes / Décisions

- Joueurs du compteur lus en lecture seule (`compteur.partie`) : le minuteur ne modifie jamais les données d'un autre outil.
- Mode plein écran : même règle de hauteur que `qui-commence` (`100dvh` + `min-height: 0`), seulement pendant la partie (les réglages peuvent défiler).
- Recette automatisée faite le 2026-11-04 : tous les scénarios de la section Tests passent, console sans erreur, 360 px, clair/sombre.
- iPhone (2026-11-04) : pas de vibration possible (Apple ne l'autorise pas au web ni aux applis installées depuis le navigateur). Bip présent dans Chrome mais absent dans l'appli installée : l'audio y passe à l'état « interrupted » (arrière-plan, verrouillage) ; il est maintenant relancé à chaque appui dès qu'il n'est pas « running », avec un son muet au premier appui pour le déverrouiller.
