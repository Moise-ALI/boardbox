# Fonctionnalité : Minuteur de tours

**Statut** : 🔵 À faire
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
- **Sablier** : durée fixe par tour (60 s par défaut) ; au-delà, le temps continue en négatif, en rouge, sans passer la main.
- **Pendule** : réserve par joueur pour la partie (10 min par défaut), qui ne s'écoule que pendant son tour.
- Boutons : pause, retour au joueur précédent, réglages.
- Fin du temps : vibration, bip court (Web Audio), flash.
- Temps calculé sur l'heure réelle (exact en arrière-plan), partie enregistrée (rechargement sans perte), écran maintenu allumé (Wake Lock) si possible.

### Cas limites

- Rechargement ou veille pendant un tour : le temps écoulé entre-temps est compté.
- Wake Lock indisponible (certains navigateurs) : sans effet bloquant.

## Tests

À définir au démarrage de la tâche (recette automatisée sur le modèle de `qui-commence`).

## Plan d'implémentation

- [ ] À détailler au démarrage (`/kit:continue` après validation de la fiche).
