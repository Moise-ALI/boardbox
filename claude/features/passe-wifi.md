# Fonctionnalité : Passe-Wi-Fi

**Statut** : 🔵 À faire
**Priorité** : basse
**Dépend de** : socle-commun (réutilise `commun/vendor/qrcode.js`)

## Description

On saisit son Wi-Fi une fois (nom du réseau, mot de passe, type de sécurité) ; l'appli affiche un grand QR code que les invités scannent avec l'appareil photo de leur téléphone pour se connecter, sur iPhone comme sur Android.

## Objectif

Ne plus épeler le mot de passe du Wi-Fi à chaque invité.

## Fichiers impactés

- `passe-wifi/index.html`, `passe-wifi/app.js` (nouveaux) + intégration (accueil, sw.js, manifeste, README)

## Comportement attendu

- Format standard reconnu par les appareils photo : `WIFI:T:WPA;S:<nom>;P:<mot de passe>;;` (échapper `\ ; , : "` dans le nom et le mot de passe).
- Réseaux mémorisés sur l'appareil seulement (localStorage), jamais envoyés en ligne.
- Mode « affichage » plein écran, luminosité de lecture (fond clair même en thème sombre), mot de passe masqué par défaut.

### Cas limites

- Réseau ouvert (`T:nopass`), réseau caché (`H:true`), caractères spéciaux et accents dans le nom.

## Questions ouvertes

- [ ] Plusieurs réseaux mémorisés (maison, résidence secondaire) ou un seul ?

## Tests

Scanner le QR code avec un iPhone et un Android réels.

## Plan d'implémentation

- [ ] À détailler au démarrage.

## Notes / Décisions

- Idée retenue le 2026-11-04, mise de côté pour une autre fois à la demande de Moïse.
