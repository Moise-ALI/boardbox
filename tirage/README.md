# 🎲 Tirage & Équipes

Une application web simple pour gérer une liste d'éléments, en tirer un ou plusieurs au hasard, et les répartir en équipes équilibrées.

## 🎯 Fonctionnalités

### ✅ Gestion de liste
- **Ajouter des éléments** : Entrez une valeur et cliquez sur "Ajouter" (ou appuyez sur Entrée)
- **Modifier un élément** : Cliquez sur le nom d'un élément pour le modifier en direct (Entrée pour valider, Échap pour annuler)
- **Supprimer des éléments** : Cliquez sur le bouton × à côté d'un élément
- **Réinitialiser** : Effacez toute la liste d'un clic

### 🎲 Tirage au sort
- **Tirage simple** : Un élément aléatoire
- **Tirage multiple** : Plusieurs éléments (spécifiez le nombre)
- **Historique** : Les 10 derniers tirages sont conservés

### 🎲 Dé 3D interactif
- **Dé 3D en WebGL** (Three.js) : rendu temps réel avec faces texturées, éclairage et halo lumineux
- **Interactif** : on attrape le dé et on le fait tourner en déplaçant la souris ; la vitesse de rotation suit la force du geste, puis le dé décélère et se cale très fluidement sur une face (snap par quaternion)
- **Repli automatique** : si WebGL ou Three.js ne sont pas disponibles, un dé emoji classique s'affiche

### 👥 Création d'équipes
- **Nombre d'équipes** : Indiquez combien d'équipes vous voulez (2, 3, 4, 5, …)
- **Répartition équitable** : Tous les éléments sont répartis aussi uniformément que possible
  - Exemple : 21 éléments / 4 équipes → 6, 5, 5, 5
  - Exemple : 10 éléments / 3 équipes → 4, 3, 3
- **Mélange aléatoire** : Les éléments sont mélangés (Fisher-Yates) avant la répartition
- **Affichage clair** : Les équipes s'affichent dans une grille avec le nombre de membres

### 💾 Export & Import
- **Export JSON** : Sauvegardez votre liste en fichier JSON
- **Import JSON** : Restaurez une liste depuis un fichier JSON
- **Sauvegarde automatique** : La liste est conservée dans le localStorage du navigateur (clés `tirage.elements` et `tirage.drawHistory`)

### 🔗 Partage
- **Lien de partage** : Générez un lien contenant votre liste
- **Liens pré-remplis** : Ouvrez une URL avec `?items=elem1,elem2,elem3` pour pré-remplir la liste

## 🚀 Utilisation

1. **Ouvrez** https://moise-ali.github.io/outils/tirage/
2. **Ajoutez** des éléments à votre liste
3. **Choisissez** une action :
   - Tirer au sort un ou plusieurs éléments
   - Créer des équipes en indiquant leur nombre
   - Exporter / importer la liste
   - Partager la liste via un lien

### Créer des équipes

1. Ajoutez tous les éléments à répartir
2. Indiquez le **nombre d'équipes** souhaité
3. Cliquez sur "🎲 Créer les équipes"
4. Les équipes s'affichent en grille, avec un résumé de la répartition

## 🔧 Structure du projet

```
index.html    # Interface utilisateur et logique d'affichage
app.js        # Classe RandomSelector (liste, tirages, équipes)
README.md     # Ce fichier
```

### Technologies
- **HTML5 / CSS3** : Interface responsive
- **JavaScript ES6** : Logique applicative
- **Three.js (WebGL)** : Dé 3D interactif (chargé via CDN, avec repli emoji)
- **localStorage** : Persistance côté client
- **Blob API** : Export JSON

### API principale (classe `RandomSelector`)

| Méthode | Description |
|---|---|
| `addElement(value)` | Ajoute un élément (refuse les doublons) |
| `removeElement(index)` | Supprime un élément par son index |
| `updateElement(index, value)` | Modifie un élément par son index (refuse les doublons et la valeur vide) |
| `resetList()` | Vide la liste |
| `drawRandom(count, withoutReplacement)` | Tire `count` éléments au sort |
| `generateBalancedTeams(teamCount)` | Répartit tous les éléments en `teamCount` équipes équilibrées |
| `exportList()` | Retourne la liste en JSON |
| `importList(jsonData)` | Importe une liste depuis un JSON |
| `generateShareLink()` | Génère un lien de partage |

## 🌐 Déploiement

### En local
```bash
python3 -m http.server 8000
```
Puis ouvrez `http://localhost:8000/index.html`

### Sur un serveur
Placez les fichiers `index.html` et `app.js` sur votre serveur web (GitHub Pages, Netlify, Vercel, etc.).

## 📱 Compatibilité

Fonctionne sur tous les navigateurs modernes (Chrome, Firefox, Safari, Edge). Interface responsive adaptée aux mobiles et tablettes.

---

*Dernière mise à jour : Octobre 2026*
