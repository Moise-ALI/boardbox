# Fonctionnalité : Message secret

**Statut** : 🔵 À faire
**Priorité** : normale
**Dépend de** : socle-commun ; exécution du nouveau `supabase/message-secret.sql` par Moïse (Supabase > SQL Editor)

## Description

On écrit un message (code de porte, mot de passe, IBAN…), l'appli donne un lien à envoyer par n'importe quelle messagerie. Le destinataire l'ouvre, lit, peut copier le texte, et le message est détruit. Personne d'autre, pas même la base de données, ne peut le lire.

## Objectif

Ne plus laisser d'informations sensibles pour toujours dans l'historique WhatsApp/SMS, avec un outil vérifiable, sans pub ni compte.

## Fichiers impactés

- `message-secret/index.html`, `message-secret/app.js` (nouveaux)
- `supabase/message-secret.sql` (nouveau : table + fonctions)
- Intégration : `accueil.js`, `index.html`, `sw.js`, `manifest.webmanifest`, `README.md`

Aucune logique existante ne fait déjà ce travail. Réutilisés : `commun/supabase-config.js` (URL + clé publishable), le principe « jeton après le `#` » de CodeName, le nettoyage paresseux des lignes expirées de `codenames_create`.

## Comportement attendu

### Expéditeur
- Un champ texte (taille limitée) + durée de vie, bouton « Créer le lien ».
- Chiffrement **dans le navigateur** (WebCrypto, AES-GCM 256 bits, clé aléatoire) ; seuls le texte chiffré, le vecteur d'initialisation et l'empreinte du jeton de lecture partent vers Supabase.
- Lien obtenu : `…/message-secret/#<id>.<clé>` ; boutons « Copier le lien » et « Partager » (`navigator.share` si disponible).
- Le texte en clair est effacé de la page après création.

### Destinataire
- Ouvre le lien : **rien n'est lu automatiquement**. Un bouton « Afficher le message » est nécessaire. Raison : les messageries et antivirus ouvrent les liens pour en faire un aperçu ; une lecture automatique détruirait le message avant que le destinataire le voie.
- Au clic : la base renvoie le texte chiffré **et supprime la ligne dans la même opération** ; déchiffrement dans le navigateur avec la clé du `#`.
- Le message s'affiche avec un bouton **« Copier »** (`navigator.clipboard`) et l'avertissement « Ce message vient d'être détruit : copiez-le maintenant ».
- L'adresse est nettoyée (`history.replaceState`) pour que la clé ne reste pas dans l'historique du navigateur.

### Base (Supabase)
- Table `message_secret_notes` (id aléatoire généré par la base, texte chiffré, iv, empreinte du jeton de lecture, essais ratés, `expires_at`) : RLS activé, **aucun droit public**.
- `message_secret_create(…)` et `message_secret_read(…)` (`security definer`) : détail dans le plan d'implémentation.
- Appels par `fetch` sur `/rest/v1/rpc/…` (pas de supabase-js : pas besoin de temps réel, une dépendance CDN de moins). CSP `connect-src` limitée au projet Supabase ; `referrer: no-referrer`.

### Cas limites

- Lien déjà lu, expiré ou inventé : même message « Ce message n'existe plus » (ne pas révéler lequel des trois cas).
- Clé absente ou abîmée dans le lien (copie partielle) : message d'erreur, **sans** appeler la base (sinon le message serait détruit pour rien).
- Hors connexion ou Supabase en pause : message clair ; c'est le seul outil qui ne peut pas fonctionner sans réseau (exception assumée à la règle du repli).
- Anti-abus (dépôt public) : texte limité (quelques Ko après chiffrement), durée de vie maximale, nombre total de messages en attente plafonné côté base (création refusée au-delà).
- Mot de passe erroné : le message n'est **pas** détruit (sinon une faute de frappe le perd). 5 essais, puis destruction (voir « Clés et jeton de lecture » dans le plan).
- Presse-papiers refusé (ancien navigateur) : le texte reste sélectionnable à la main.

## Questions ouvertes

Réponses de Moïse le 2026-11-04 :
- [x] Q1 — Durée de vie : 1 h, 24 h ou 7 jours ; 24 h par défaut.
- [x] Q2 — Accusé de lecture : non (première version).
- [x] Q3 — Mot de passe facultatif en plus du lien : oui (clé dérivée du mot de passe et de la clé du lien, PBKDF2 ; le mot de passe ne quitte jamais le téléphone).
- [x] Q4 — Taille : 2 000 caractères, texte seul.
- [x] Q5 — Hébergement de la base : **Supabase** (comme Undercover et CodeName). Postgres sur le Raspberry écarté : rien à gagner en confidentialité (le message est chiffré dans le téléphone), et la mise en pause est réglée par le réveil quotidien du Pi.

## Tests

Recette automatisée (iframe + Edge sans fenêtre) :
- création → lien ; ouverture → rien n'est lu avant le clic ; clic → message affiché, bouton Copier ;
- deuxième ouverture du même lien → « n'existe plus » ;
- lien avec clé abîmée → erreur sans appel à la base (vérifié : la ligne existe toujours) ;
- message expiré → « n'existe plus » ;
- texte trop long refusé côté page **et** côté base (appel direct à la fonction) ;
- la base ne contient que du texte chiffré (lecture de la table via le SQL Editor) ;
- aucun droit public sur la table (appel REST direct refusé) ;
- 360 px, clair/sombre, FR/EN, console sans erreur ni blocage CSP.
Recette manuelle par Moïse : envoi d'un message réel par WhatsApp à soi-même (l'aperçu du lien ne doit pas le détruire), copie sur iPhone.

## Plan d'implémentation

Proposé le 2026-11-05, à valider par Moïse.

### Clés et jeton de lecture (règle le cas du mot de passe erroné)

- Le lien contient 32 octets aléatoires `L` (base64url) ; un mot de passe éventuel est ajouté par un `.m` final : `#<id>.<L>` ou `#<id>.<L>.m`. Le destinataire sait donc s'il doit demander un mot de passe, sans interroger la base.
- Le navigateur calcule `PBKDF2-SHA-256(mot de passe ou "", sel = L, 600 000 itérations)` → 64 octets : les 32 premiers forment la **clé AES-GCM**, les 32 suivants le **jeton de lecture**. Un seul chemin de code, avec ou sans mot de passe.
- La base ne reçoit que l'empreinte `SHA-256(jeton)`. À la lecture, elle compare l'empreinte du jeton envoyé :
  - bon jeton → `delete … returning` (lecture et destruction en une opération) ;
  - mauvais jeton → compteur d'essais + 1, message conservé ; au 5ᵉ échec, destruction.
- Conséquences : le mot de passe ne quitte jamais le téléphone ; connaître seulement l'`id` ne permet ni de lire ni de détruire le message ; la base ne peut rien déchiffrer.

### Base (`supabase/message-secret.sql`, ré-exécutable)

- Table `message_secret_notes` : `id uuid` aléatoire (122 bits), `cipher text`, `iv text`, `token_hash text`, `failed_attempts int`, `expires_at timestamptz`. RLS activé, aucune policy, `revoke all` pour `anon` et `authenticated`.
- `message_secret_create(p_cipher, p_iv, p_token_hash, p_ttl_hours)` : `p_ttl_hours` ∈ {1, 24, 168} ; texte chiffré ≤ 11 000 caractères (2 000 caractères, emoji compris, une fois chiffrés en base64) ; supprime les messages expirés ; refuse au-delà de 5 000 messages en attente ; renvoie l'`id`.
- `message_secret_read(p_id, p_token_hash)` : renvoie `(statut, cipher, iv, essais_restants)` avec statut `ok`, `mauvais_mot_de_passe` ou `introuvable` (lu, expiré ou inventé, sans distinction).

### Fichiers

- `message-secret/chiffrement.js` : WebCrypto seul, sans DOM (génération de `L`, dérivation, chiffrement, déchiffrement, lecture et écriture du lien).
- `message-secret/donnees.js` : les deux appels `fetch` sur `/rest/v1/rpc/…` avec la clé publishable de `commun/supabase-config.js`.
- `message-secret/app.js` : interface et dictionnaire FR/EN. `message-secret/index.html` : CSP (`connect-src` limité au projet Supabase), `meta referrer no-referrer`.
- L'adresse est nettoyée (`history.replaceState`) **dès l'ouverture** : la clé est gardée en mémoire seulement. Un rechargement perd l'accès, pas le message : il suffit de rouvrir le lien.

### Étapes

- [ ] 1. Écrire `supabase/message-secret.sql`.
- [ ] 2. **Moïse** l'exécute dans Supabase > SQL Editor ; je vérifie par appels REST directs : création, lecture, deuxième lecture `introuvable`, lecture directe de la table refusée, texte trop long et durée invalide refusés.
- [ ] 3. `chiffrement.js` + test navigateur : aller-retour avec et sans mot de passe, mauvais mot de passe, lien abîmé, temps de dérivation mesuré (cible < 1 s sur téléphone, sinon baisser les itérations).
- [ ] 4. `donnees.js`.
- [ ] 5. `index.html` + `app.js` : écran de création (texte et compteur 2 000, durée 1 h / 24 h / 7 j, mot de passe facultatif) et écran du lien (Copier, Partager, Nouveau message).
- [ ] 6. Écran de lecture : bouton « Afficher le message », champ mot de passe si `.m`, message + Copier + avertissement, essais restants, erreurs (lien abîmé sans appel à la base, introuvable, hors connexion).
- [ ] 7. Intégration : `accueil.js` (🔒, FR/EN), `index.html` (`?v`), `sw.js` (PRECACHE), `manifest.webmanifest`, `README.md`.
- [ ] 8. Recette automatisée (section Tests) + téléphone lent, 360 px, clair/sombre, FR/EN, console sans erreur ni blocage CSP.
- [ ] 9. **Moïse** : recette manuelle (WhatsApp vers soi-même, l'aperçu ne détruit rien ; copie sur iPhone, avec et sans mot de passe).
- [ ] 10. Documentation : `context.md` (table, rôle « destinataire »), `architecture.md` (décision : chiffrement dans le navigateur, jeton de lecture dérivé), `history.md`.

## Notes / Décisions

- Idée retenue le 2026-11-04 ; bouton « Copier » côté destinataire demandé par Moïse.
