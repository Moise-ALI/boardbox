# Tâches

> Fichier COURT (< 150 lignes), relu à chaque session. Le détail des tâches et bugs terminés part dans la fiche `features/` ou dans `archive/AAAA.md` lors de `/kit:finish`.

## 🟡 En cours

<!-- Une seule tâche à la fois -->

## 🐛 Bugs ouverts

<!-- Format :
- [ ] 🐛 <titre court> — identifié le AAAA-MM-JJ — priorité: haute|normale|basse
  - Symptôme :
  - Fichiers probables :
  - Plan : 1. … 2. …
-->

- [ ] 🐛 Minuteur : la page déborde de 7 px à 360 px de large — identifié le 2026-11-08 — priorité: normale
  - Symptôme : sur l'écran de réglage, `.block.card` et le bouton de départ vont jusqu'à 367 px, défilement horizontal. Présent aussi avant l'audit (version du commit 114edf7 identique). Disparaît dès 385 px utiles.
  - Fichiers probables : `minuteur/index.html` (styles de `.block`, `.start-row`)
  - Plan : à diagnostiquer avec `/kit:bug` (piste : grille sans `minmax(0, 1fr)`, voir `claude/context.md`).
- [ ] 🐛 Durcir les accès publics à Supabase contre les usages abusifs — identifié le 2026-11-08 — priorité: normale
  - Symptôme : relevé en revue, sans abus constaté ; les écritures publiques manquent de limites.
  - Fichiers probables : `supabase/*.sql`, `codenames/donnees.js`, `undercover/donnees.js`

## 🔵 Backlog (priorisé)

- [ ] `robots.txt` déclarant le sitemap (`Sitemap: https://boardbox.stream/sitemap.xml`), pour les moteurs sans déclaration manuelle — priorité: basse — dépend de: rien
- [ ] Mes rangements (où j'ai rangé quoi, recherche, photos, local) — priorité: normale — dépend de: rien — fiche à créer après le Père Noël secret
- [ ] Message secret (s'autodétruit après lecture) — priorité: normale — dépend de: exécution de supabase/message-secret.sql — voir `claude/features/message-secret.md`
- [ ] Passe-Wi-Fi (QR code de connexion pour les invités) — priorité: basse — dépend de: rien — voir `claude/features/passe-wifi.md`

## 💡 Idées en réserve

Voir `claude/idees.md`.

## ✅ Terminées récemment

| Date | Tâche |
|---|---|
| 2026-11-09 | 🐛 Écran noir au lancement de l'appli iPhone : pages servies depuis la mémoire (`archive/2026.md`) |
| 2026-11-08 | Corrections de l'audit : doc d'hébergement, accueil sans JS, aperçus de lien, sitemap (`features/audit-2026-11.md`) |
| 2026-11-06 | Brise-glace : cartes de questions, import, verre dépoli (`features/brise-glace.md`) |
| 2026-11-05 | Père Noël secret, QR codes, nouvelles icônes (`features/pere-noel-secret.md`) |
| 2026-11-05 | Recherche sur l'accueil (`features/recherche-accueil.md`) |
| 2026-11-04 | Minuteur de tours (`features/minuteur.md`) |
| 2026-11-04 | Qui commence ? (`features/qui-commence.md`) |
| 2026-11-03 | Compteur en tuiles colorées (`features/compteur.md`) |
| 2026-11-03 | Fluidité mobile (fond fixe, dé 3D économe) |
| 2026-10-18 | Renommage BoardBox, PWA (`features/socle-commun.md`) |
