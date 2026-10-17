/* Paires de départ, intégrées à l'appli : le jeu fonctionne sans connexion.
   Les paires validées dans Supabase viennent s'y ajouter au chargement.
   Règle d'une bonne paire : assez proches pour que l'undercover ne se doute de rien,
   assez différentes pour qu'on puisse le démasquer en quelques tours. */
window.UNDERCOVER_PAIRS = [
  // Animaux
  ['Chat', 'Chien'], ['Lion', 'Tigre'], ['Loup', 'Renard'], ['Dauphin', 'Requin'], ['Abeille', 'Guêpe'],
  ['Crocodile', 'Alligator'], ['Cheval', 'Âne'], ['Hibou', 'Chouette'], ['Grenouille', 'Crapaud'], ['Lapin', 'Lièvre'],
  ['Papillon', 'Libellule'], ['Pingouin', 'Manchot'], ['Escargot', 'Limace'], ['Corbeau', 'Pie'], ['Mouton', 'Chèvre'],
  ['Souris', 'Hamster'], ['Baleine', 'Orque'], ['Araignée', 'Scorpion'],
  // Nourriture
  ['Pizza', 'Tarte flambée'], ['Croissant', 'Pain au chocolat'], ['Crêpe', 'Gaufre'], ['Burger', 'Sandwich'], ['Sushi', 'Maki'],
  ['Glace', 'Sorbet'], ['Fromage', 'Beurre'], ['Spaghetti', 'Tagliatelles'], ['Pomme', 'Poire'], ['Citron', 'Orange'],
  ['Fraise', 'Framboise'], ['Banane', 'Mangue'], ['Tomate', 'Poivron'], ['Frites', 'Chips'], ['Chocolat', 'Caramel'],
  ['Raclette', 'Fondue'], ['Couscous', 'Tajine'], ['Kebab', 'Tacos'], ['Muffin', 'Cupcake'], ['Miel', 'Confiture'],
  ['Omelette', 'Œuf au plat'], ['Ketchup', 'Mayonnaise'], ['Riz', 'Pâtes'], ['Soupe', 'Velouté'], ['Macaron', 'Meringue'],
  // Boissons
  ['Café', 'Thé'], ['Vin', 'Champagne'], ['Bière', 'Cidre'], ['Jus d\'orange', 'Limonade'], ['Coca', 'Ice tea'],
  ['Lait', 'Yaourt'], ['Mojito', 'Piña colada'],
  // Maison & objets
  ['Canapé', 'Fauteuil'], ['Lit', 'Hamac'], ['Fourchette', 'Cuillère'], ['Couteau', 'Ciseaux'], ['Assiette', 'Bol'],
  ['Lampe', 'Bougie'], ['Oreiller', 'Couette'], ['Douche', 'Baignoire'], ['Brosse à dents', 'Peigne'], ['Parapluie', 'Imperméable'],
  ['Clé', 'Cadenas'], ['Miroir', 'Fenêtre'], ['Horloge', 'Montre'], ['Sac à dos', 'Valise'], ['Stylo', 'Crayon'],
  ['Livre', 'Magazine'], ['Frigo', 'Congélateur'], ['Four', 'Micro-ondes'], ['Aspirateur', 'Balai'], ['Tapis', 'Moquette'],
  // Vêtements
  ['Chaussettes', 'Collants'], ['Pull', 'Sweat'], ['Jean', 'Jogging'], ['Baskets', 'Tongs'], ['Casquette', 'Bonnet'],
  ['Écharpe', 'Cravate'], ['Robe', 'Jupe'], ['Pyjama', 'Peignoir'], ['Lunettes', 'Lentilles'], ['Bague', 'Bracelet'],
  // Lieux
  ['Plage', 'Piscine'], ['Montagne', 'Colline'], ['Forêt', 'Jungle'], ['Désert', 'Savane'], ['Hôpital', 'Pharmacie'],
  ['École', 'Université'], ['Cinéma', 'Théâtre'], ['Restaurant', 'Cantine'], ['Hôtel', 'Camping'], ['Musée', 'Bibliothèque'],
  ['Boulangerie', 'Pâtisserie'], ['Supermarché', 'Marché'], ['Aéroport', 'Gare'], ['Château', 'Palais'], ['Église', 'Mosquée'],
  ['Zoo', 'Aquarium'], ['Paris', 'Londres'], ['Lac', 'Étang'], ['Île', 'Presqu\'île'], ['Prison', 'Commissariat'],
  // Transports
  ['Voiture', 'Moto'], ['Vélo', 'Trottinette'], ['Train', 'Métro'], ['Avion', 'Hélicoptère'], ['Bateau', 'Sous-marin'],
  ['Bus', 'Tramway'], ['Taxi', 'Uber'], ['Fusée', 'Satellite'],
  // Métiers
  ['Médecin', 'Infirmier'], ['Pompier', 'Policier'], ['Boulanger', 'Pâtissier'], ['Professeur', 'Directeur'], ['Avocat', 'Juge'],
  ['Pilote', 'Steward'], ['Coiffeur', 'Barbier'], ['Cuisinier', 'Serveur'], ['Plombier', 'Électricien'], ['Dentiste', 'Opticien'],
  ['Journaliste', 'Présentateur'], ['Astronaute', 'Astronome'],
  // Sports & loisirs
  ['Football', 'Rugby'], ['Tennis', 'Badminton'], ['Basket', 'Handball'], ['Ski', 'Snowboard'], ['Natation', 'Plongée'],
  ['Boxe', 'Judo'], ['Golf', 'Mini-golf'], ['Yoga', 'Pilates'], ['Échecs', 'Dames'], ['Poker', 'Belote'],
  ['Surf', 'Planche à voile'], ['Course à pied', 'Marche'], ['Bowling', 'Billard'], ['Karaoké', 'Concert'], ['Puzzle', 'Lego'],
  // Musique & culture
  ['Guitare', 'Violon'], ['Piano', 'Synthétiseur'], ['Batterie', 'Tambour'], ['Rap', 'Rock'], ['Film', 'Série'],
  ['Netflix', 'YouTube'], ['Instagram', 'TikTok'], ['Harry Potter', 'Le Seigneur des anneaux'], ['Mario', 'Sonic'], ['Batman', 'Spider-Man'],
  ['Dessin animé', 'Manga'], ['Photo', 'Selfie'],
  // Nature & météo
  ['Soleil', 'Lune'], ['Pluie', 'Neige'], ['Orage', 'Tempête'], ['Nuage', 'Brouillard'], ['Rose', 'Tulipe'],
  ['Arbre', 'Buisson'], ['Volcan', 'Geyser'], ['Étoile', 'Planète'], ['Arc-en-ciel', 'Aurore boréale'], ['Feu', 'Lave'],
  // Moments & fêtes
  ['Noël', 'Nouvel An'], ['Anniversaire', 'Mariage'], ['Halloween', 'Carnaval'], ['Vacances', 'Week-end'], ['Petit-déjeuner', 'Brunch'],
  ['Sieste', 'Grasse matinée'], ['Pique-nique', 'Barbecue'], ['Rendez-vous', 'Entretien d\'embauche'],
  // Tech & divers
  ['Téléphone', 'Tablette'], ['Ordinateur', 'Console'], ['WhatsApp', 'SMS'], ['Wi-Fi', 'Bluetooth'], ['Robot', 'Cyborg'],
  ['Fantôme', 'Zombie'], ['Vampire', 'Loup-garou'], ['Pirate', 'Viking'], ['Chevalier', 'Samouraï'], ['Sorcière', 'Fée'],
  ['Dragon', 'Dinosaure'], ['Licorne', 'Pégase'], ['Trésor', 'Coffre-fort'], ['Rêve', 'Cauchemar'], ['Bisou', 'Câlin']
];
