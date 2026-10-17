/* Paires de départ par langue puis par thème (ids de themes.js), intégrées à l'appli :
   le jeu fonctionne sans connexion. Les paires validées dans Supabase s'y ajoutent.
   Règle d'une bonne paire : assez proches pour que l'undercover ne se doute de rien,
   assez différentes pour qu'on puisse le démasquer en quelques tours. */
window.UNDERCOVER_PAIRS = {
  fr: {
    animaux: [
      ['Chat', 'Chien'], ['Lion', 'Tigre'], ['Loup', 'Renard'], ['Dauphin', 'Requin'], ['Abeille', 'Guêpe'],
      ['Crocodile', 'Alligator'], ['Cheval', 'Âne'], ['Hibou', 'Chouette'], ['Grenouille', 'Crapaud'], ['Lapin', 'Lièvre'],
      ['Papillon', 'Libellule'], ['Pingouin', 'Manchot'], ['Escargot', 'Limace'], ['Corbeau', 'Pie'], ['Mouton', 'Chèvre'],
      ['Souris', 'Hamster'], ['Baleine', 'Orque'], ['Araignée', 'Scorpion']
    ],
    nourriture: [
      ['Pizza', 'Tarte flambée'], ['Croissant', 'Pain au chocolat'], ['Crêpe', 'Gaufre'], ['Burger', 'Sandwich'], ['Sushi', 'Maki'],
      ['Glace', 'Sorbet'], ['Fromage', 'Beurre'], ['Spaghetti', 'Tagliatelles'], ['Pomme', 'Poire'], ['Citron', 'Orange'],
      ['Fraise', 'Framboise'], ['Banane', 'Mangue'], ['Tomate', 'Poivron'], ['Frites', 'Chips'], ['Chocolat', 'Caramel'],
      ['Raclette', 'Fondue'], ['Couscous', 'Tajine'], ['Kebab', 'Tacos'], ['Muffin', 'Cupcake'], ['Miel', 'Confiture'],
      ['Omelette', 'Œuf au plat'], ['Ketchup', 'Mayonnaise'], ['Riz', 'Pâtes'], ['Soupe', 'Velouté'], ['Macaron', 'Meringue'],
      ['Café', 'Thé'], ['Vin', 'Champagne'], ['Bière', 'Cidre'], ['Jus d\'orange', 'Limonade'], ['Coca', 'Ice tea'],
      ['Lait', 'Yaourt'], ['Mojito', 'Piña colada']
    ],
    maison: [
      ['Canapé', 'Fauteuil'], ['Lit', 'Hamac'], ['Fourchette', 'Cuillère'], ['Couteau', 'Ciseaux'], ['Assiette', 'Bol'],
      ['Lampe', 'Bougie'], ['Oreiller', 'Couette'], ['Douche', 'Baignoire'], ['Brosse à dents', 'Peigne'], ['Parapluie', 'Imperméable'],
      ['Clé', 'Cadenas'], ['Miroir', 'Fenêtre'], ['Horloge', 'Montre'], ['Sac à dos', 'Valise'], ['Stylo', 'Crayon'],
      ['Livre', 'Magazine'], ['Frigo', 'Congélateur'], ['Four', 'Micro-ondes'], ['Aspirateur', 'Balai'], ['Tapis', 'Moquette']
    ],
    mode: [
      ['Chaussettes', 'Collants'], ['Pull', 'Sweat'], ['Jean', 'Jogging'], ['Baskets', 'Tongs'], ['Casquette', 'Bonnet'],
      ['Écharpe', 'Cravate'], ['Robe', 'Jupe'], ['Pyjama', 'Peignoir'], ['Lunettes', 'Lentilles'], ['Bague', 'Bracelet']
    ],
    lieux: [
      ['Plage', 'Piscine'], ['Montagne', 'Colline'], ['Forêt', 'Jungle'], ['Désert', 'Savane'], ['Hôpital', 'Pharmacie'],
      ['École', 'Université'], ['Cinéma', 'Théâtre'], ['Restaurant', 'Cantine'], ['Hôtel', 'Camping'], ['Musée', 'Bibliothèque'],
      ['Boulangerie', 'Pâtisserie'], ['Supermarché', 'Marché'], ['Aéroport', 'Gare'], ['Château', 'Palais'], ['Église', 'Mosquée'],
      ['Zoo', 'Aquarium'], ['Paris', 'Londres'], ['Lac', 'Étang'], ['Île', 'Presqu\'île'], ['Prison', 'Commissariat']
    ],
    transports: [
      ['Voiture', 'Moto'], ['Vélo', 'Trottinette'], ['Train', 'Métro'], ['Avion', 'Hélicoptère'], ['Bateau', 'Sous-marin'],
      ['Bus', 'Tramway'], ['Taxi', 'Uber'], ['Fusée', 'Satellite']
    ],
    metiers: [
      ['Médecin', 'Infirmier'], ['Pompier', 'Policier'], ['Boulanger', 'Pâtissier'], ['Professeur', 'Directeur'], ['Avocat', 'Juge'],
      ['Pilote', 'Steward'], ['Coiffeur', 'Barbier'], ['Cuisinier', 'Serveur'], ['Plombier', 'Électricien'], ['Dentiste', 'Opticien'],
      ['Journaliste', 'Présentateur'], ['Astronaute', 'Astronome']
    ],
    sport: [
      ['Football', 'Rugby'], ['Tennis', 'Badminton'], ['Basket', 'Handball'], ['Ski', 'Snowboard'], ['Natation', 'Plongée'],
      ['Boxe', 'Judo'], ['Golf', 'Mini-golf'], ['Yoga', 'Pilates'], ['Échecs', 'Dames'], ['Poker', 'Belote'],
      ['Surf', 'Planche à voile'], ['Course à pied', 'Marche'], ['Bowling', 'Billard'], ['Karaoké', 'Concert'], ['Puzzle', 'Lego']
    ],
    nature: [
      ['Soleil', 'Lune'], ['Pluie', 'Neige'], ['Orage', 'Tempête'], ['Nuage', 'Brouillard'], ['Rose', 'Tulipe'],
      ['Arbre', 'Buisson'], ['Volcan', 'Geyser'], ['Étoile', 'Planète'], ['Arc-en-ciel', 'Aurore boréale'], ['Feu', 'Lave']
    ],
    fetes: [
      ['Noël', 'Nouvel An'], ['Anniversaire', 'Mariage'], ['Halloween', 'Carnaval'], ['Vacances', 'Week-end'], ['Petit-déjeuner', 'Brunch'],
      ['Sieste', 'Grasse matinée'], ['Pique-nique', 'Barbecue'], ['Rendez-vous', 'Entretien d\'embauche'], ['Bisou', 'Câlin'], ['Rêve', 'Cauchemar']
    ],
    tech: [
      ['Téléphone', 'Tablette'], ['Ordinateur', 'Console'], ['WhatsApp', 'SMS'], ['Wi-Fi', 'Bluetooth'], ['Robot', 'Cyborg'],
      ['Netflix', 'YouTube'], ['Instagram', 'TikTok'], ['Photo', 'Selfie'], ['Clavier', 'Souris'], ['E-mail', 'Lettre']
    ],
    culture: [
      ['Guitare', 'Violon'], ['Piano', 'Synthétiseur'], ['Batterie', 'Tambour'], ['Rap', 'Rock'], ['Film', 'Série'],
      ['Harry Potter', 'Le Seigneur des anneaux'], ['Batman', 'Spider-Man'], ['Dessin animé', 'Bande dessinée'], ['Star Wars', 'Star Trek'], ['Titanic', 'Avatar'],
      ['Astérix', 'Tintin'], ['Disney', 'Pixar']
    ],
    fantastique: [
      ['Fantôme', 'Zombie'], ['Vampire', 'Loup-garou'], ['Pirate', 'Viking'], ['Chevalier', 'Samouraï'], ['Sorcière', 'Fée'],
      ['Dragon', 'Dinosaure'], ['Licorne', 'Pégase'], ['Trésor', 'Coffre-fort'], ['Elfe', 'Nain'], ['Sirène', 'Nymphe']
    ],
    'jeux-video': [
      ['Mario', 'Sonic'], ['Minecraft', 'Roblox'], ['Fortnite', 'Call of Duty'], ['Pokémon', 'Digimon'], ['Zelda', 'Final Fantasy'],
      ['PlayStation', 'Xbox'], ['Nintendo Switch', 'Game Boy'], ['Tetris', 'Pac-Man'], ['League of Legends', 'Dota'], ['FIFA', 'Rocket League'],
      ['GTA', 'Red Dead Redemption'], ['Among Us', 'Fall Guys']
    ],
    anime: [
      ['Naruto', 'Sasuke'], ['One Piece', 'Fairy Tail'], ['Dragon Ball', 'One Punch Man'], ['Goku', 'Vegeta'], ['Luffy', 'Zoro'],
      ['Attaque des Titans', 'Tokyo Ghoul'], ['Death Note', 'Code Geass'], ['Pikachu', 'Évoli'], ['Totoro', 'Chihiro'], ['Demon Slayer', 'Jujutsu Kaisen'],
      ['Manga', 'Webtoon'], ['Shonen', 'Seinen'], ['Ninja', 'Samouraï'], ['Kamehameha', 'Rasengan']
    ]
  }
};
