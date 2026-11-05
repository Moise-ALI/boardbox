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
- Chiffrement **dans le navigateur** (WebCrypto, AES-GCM 256 bits, clé aléatoire) ; seuls le texte chiffré et le vecteur d'initialisation partent vers Supabase.
- Lien obtenu : `…/message-secret/#<id>.<clé>` ; boutons « Copier le lien » et « Partager » (`navigator.share` si disponible).
- Le texte en clair est effacé de la page après création.

### Destinataire
- Ouvre le lien : **rien n'est lu automatiquement**. Un bouton « Afficher le message » est nécessaire. Raison : les messageries et antivirus ouvrent les liens pour en faire un aperçu ; une lecture automatique détruirait le message avant que le destinataire le voie.
- Au clic : la base renvoie le texte chiffré **et supprime la ligne dans la même opération** ; déchiffrement dans le navigateur avec la clé du `#`.
- Le message s'affiche avec un bouton **« Copier »** (`navigator.clipboard`) et l'avertissement « Ce message vient d'être détruit : copiez-le maintenant ».
- L'adresse est nettoyée (`history.replaceState`) pour que la clé ne reste pas dans l'historique du navigateur.

### Base (Supabase)
- Table `message_secret_notes` (id aléatoire de 128 bits généré par la base, texte chiffré, iv, `expires_at`) : RLS activé, **aucun droit public**.
- `message_secret_create(p_cipher, p_iv, p_ttl)` (`security definer`) : vérifie les tailles et la durée, supprime au passage les messages expirés, renvoie l'id.
- `message_secret_read(p_id)` (`security definer`) : `delete … returning` sur une ligne non expirée ; renvoie rien si déjà lue, expirée ou inexistante.
- Appels par `fetch` sur `/rest/v1/rpc/…` (pas de supabase-js : pas besoin de temps réel, une dépendance CDN de moins). CSP `connect-src` limitée au projet Supabase ; `referrer: no-referrer`.

### Cas limites

- Lien déjà lu, expiré ou inventé : même message « Ce message n'existe plus » (ne pas révéler lequel des trois cas).
- Clé absente ou abîmée dans le lien (copie partielle) : message d'erreur, **sans** appeler la base (sinon le message serait détruit pour rien).
- Hors connexion ou Supabase en pause : message clair ; c'est le seul outil qui ne peut pas fonctionner sans réseau (exception assumée à la règle du repli).
- Anti-abus (dépôt public) : texte limité (quelques Ko après chiffrement), durée de vie maximale, nombre total de messages en attente plafonné côté base (création refusée au-delà).
- Mot de passe erroné : le message ne doit **pas** être détruit (sinon une faute de frappe le perd). À trancher au plan : nombre d'essais limité côté base avant destruction, en gardant la suppression atomique une fois déchiffré.
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

- [ ] À proposer après réponse aux questions ouvertes.

## Notes / Décisions

- Idée retenue le 2026-11-04 ; bouton « Copier » côté destinataire demandé par Moïse.
