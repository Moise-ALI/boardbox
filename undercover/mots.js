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
    ],
    // Deux personnages ou éléments d'univers différents qui jouent le même rôle
    crossover: [
      ['Orochimaru', 'Voldemort'], ['Gandalf', 'Dumbledore'], ['Goku', 'Superman'], ['Freezer', 'Thanos'],
      ['Dark Vador', 'Madara'], ['Maître Yoda', 'Tortue Géniale'], ['Hermione', 'Sakura'], ['Luffy', 'Jack Sparrow'],
      ['Sauron', 'Sukuna'], ['Gollum', 'Dobby'], ['L', 'Sherlock Holmes'], ['Saitama', 'Hulk'],
      ['Poudlard', 'Académie de Konoha'], ['Sabre laser', 'Zanpakutō']
    ]
  },

  en: {
    animaux: [
      ['Cat', 'Dog'], ['Lion', 'Tiger'], ['Wolf', 'Fox'], ['Dolphin', 'Shark'], ['Bee', 'Wasp'],
      ['Crocodile', 'Alligator'], ['Horse', 'Donkey'], ['Owl', 'Hawk'], ['Frog', 'Toad'], ['Rabbit', 'Hare'],
      ['Butterfly', 'Moth'], ['Penguin', 'Puffin'], ['Snail', 'Slug'], ['Crow', 'Raven'], ['Sheep', 'Goat'],
      ['Mouse', 'Hamster'], ['Whale', 'Orca'], ['Spider', 'Scorpion']
    ],
    nourriture: [
      ['Pizza', 'Flatbread'], ['Croissant', 'Muffin'], ['Pancake', 'Waffle'], ['Burger', 'Sandwich'], ['Sushi', 'Ramen'],
      ['Ice cream', 'Frozen yogurt'], ['Cheese', 'Butter'], ['Spaghetti', 'Noodles'], ['Apple', 'Pear'], ['Lemon', 'Lime'],
      ['Strawberry', 'Raspberry'], ['Banana', 'Mango'], ['Tomato', 'Bell pepper'], ['Fries', 'Chips'], ['Chocolate', 'Caramel'],
      ['Cookie', 'Biscuit'], ['Taco', 'Burrito'], ['Hot dog', 'Corn dog'], ['Cupcake', 'Donut'], ['Honey', 'Jam'],
      ['Omelette', 'Scrambled eggs'], ['Ketchup', 'Mustard'], ['Rice', 'Pasta'], ['Soup', 'Stew'], ['Popcorn', 'Pretzel'],
      ['Coffee', 'Tea'], ['Wine', 'Champagne'], ['Beer', 'Cider'], ['Orange juice', 'Lemonade'], ['Coke', 'Iced tea'],
      ['Milk', 'Milkshake'], ['Mojito', 'Margarita']
    ],
    maison: [
      ['Sofa', 'Armchair'], ['Bed', 'Hammock'], ['Fork', 'Spoon'], ['Knife', 'Scissors'], ['Plate', 'Bowl'],
      ['Lamp', 'Candle'], ['Pillow', 'Blanket'], ['Shower', 'Bathtub'], ['Toothbrush', 'Comb'], ['Umbrella', 'Raincoat'],
      ['Key', 'Padlock'], ['Mirror', 'Window'], ['Clock', 'Watch'], ['Backpack', 'Suitcase'], ['Pen', 'Pencil'],
      ['Book', 'Magazine'], ['Fridge', 'Freezer'], ['Oven', 'Microwave'], ['Vacuum', 'Broom'], ['Rug', 'Carpet']
    ],
    mode: [
      ['Socks', 'Tights'], ['Sweater', 'Hoodie'], ['Jeans', 'Sweatpants'], ['Sneakers', 'Flip-flops'], ['Cap', 'Beanie'],
      ['Scarf', 'Tie'], ['Dress', 'Skirt'], ['Pajamas', 'Bathrobe'], ['Glasses', 'Contact lenses'], ['Ring', 'Bracelet']
    ],
    lieux: [
      ['Beach', 'Swimming pool'], ['Mountain', 'Hill'], ['Forest', 'Jungle'], ['Desert', 'Savanna'], ['Hospital', 'Pharmacy'],
      ['School', 'University'], ['Cinema', 'Theater'], ['Restaurant', 'Cafeteria'], ['Hotel', 'Campsite'], ['Museum', 'Library'],
      ['Bakery', 'Coffee shop'], ['Supermarket', 'Market'], ['Airport', 'Train station'], ['Castle', 'Palace'], ['Church', 'Temple'],
      ['Zoo', 'Aquarium'], ['London', 'New York'], ['Lake', 'Pond'], ['Island', 'Peninsula'], ['Prison', 'Police station']
    ],
    transports: [
      ['Car', 'Motorcycle'], ['Bike', 'Scooter'], ['Train', 'Subway'], ['Plane', 'Helicopter'], ['Boat', 'Submarine'],
      ['Bus', 'Tram'], ['Taxi', 'Uber'], ['Rocket', 'Satellite']
    ],
    metiers: [
      ['Doctor', 'Nurse'], ['Firefighter', 'Police officer'], ['Baker', 'Pastry chef'], ['Teacher', 'Principal'], ['Lawyer', 'Judge'],
      ['Pilot', 'Flight attendant'], ['Hairdresser', 'Barber'], ['Chef', 'Waiter'], ['Plumber', 'Electrician'], ['Dentist', 'Optician'],
      ['Journalist', 'News anchor'], ['Astronaut', 'Astronomer']
    ],
    sport: [
      ['Football', 'Rugby'], ['Tennis', 'Badminton'], ['Basketball', 'Volleyball'], ['Skiing', 'Snowboarding'], ['Swimming', 'Diving'],
      ['Boxing', 'Wrestling'], ['Golf', 'Mini golf'], ['Yoga', 'Pilates'], ['Chess', 'Checkers'], ['Poker', 'Blackjack'],
      ['Surfing', 'Windsurfing'], ['Running', 'Walking'], ['Bowling', 'Pool'], ['Karaoke', 'Concert'], ['Puzzle', 'Lego'],
      ['Baseball', 'Cricket'], ['Soccer', 'Hockey']
    ],
    nature: [
      ['Sun', 'Moon'], ['Rain', 'Snow'], ['Thunderstorm', 'Hurricane'], ['Cloud', 'Fog'], ['Rose', 'Tulip'],
      ['Tree', 'Bush'], ['Volcano', 'Geyser'], ['Star', 'Planet'], ['Rainbow', 'Northern lights'], ['Fire', 'Lava']
    ],
    fetes: [
      ['Christmas', 'New Year\'s Eve'], ['Birthday', 'Wedding'], ['Halloween', 'Carnival'], ['Vacation', 'Weekend'], ['Breakfast', 'Brunch'],
      ['Nap', 'Sleep-in'], ['Picnic', 'Barbecue'], ['First date', 'Job interview'], ['Kiss', 'Hug'], ['Dream', 'Nightmare'],
      ['Thanksgiving', 'Easter']
    ],
    tech: [
      ['Phone', 'Tablet'], ['Computer', 'Console'], ['WhatsApp', 'Text message'], ['Wi-Fi', 'Bluetooth'], ['Robot', 'Cyborg'],
      ['Netflix', 'YouTube'], ['Instagram', 'TikTok'], ['Photo', 'Selfie'], ['Keyboard', 'Mouse'], ['Email', 'Letter']
    ],
    culture: [
      ['Guitar', 'Violin'], ['Piano', 'Keyboard'], ['Drums', 'Tambourine'], ['Rap', 'Rock'], ['Movie', 'TV show'],
      ['Harry Potter', 'The Lord of the Rings'], ['Batman', 'Spider-Man'], ['Cartoon', 'Comic book'], ['Star Wars', 'Star Trek'], ['Titanic', 'Avatar'],
      ['Marvel', 'DC'], ['Disney', 'Pixar']
    ],
    fantastique: [
      ['Ghost', 'Zombie'], ['Vampire', 'Werewolf'], ['Pirate', 'Viking'], ['Knight', 'Samurai'], ['Witch', 'Fairy'],
      ['Dragon', 'Dinosaur'], ['Unicorn', 'Pegasus'], ['Treasure', 'Safe'], ['Elf', 'Dwarf'], ['Mermaid', 'Nymph']
    ],
    'jeux-video': [
      ['Mario', 'Sonic'], ['Minecraft', 'Roblox'], ['Fortnite', 'Call of Duty'], ['Pokémon', 'Digimon'], ['Zelda', 'Final Fantasy'],
      ['PlayStation', 'Xbox'], ['Nintendo Switch', 'Game Boy'], ['Tetris', 'Pac-Man'], ['League of Legends', 'Dota'], ['FIFA', 'Rocket League'],
      ['GTA', 'Red Dead Redemption'], ['Among Us', 'Fall Guys']
    ],
    anime: [
      ['Naruto', 'Sasuke'], ['One Piece', 'Fairy Tail'], ['Dragon Ball', 'One Punch Man'], ['Goku', 'Vegeta'], ['Luffy', 'Zoro'],
      ['Attack on Titan', 'Tokyo Ghoul'], ['Death Note', 'Code Geass'], ['Pikachu', 'Eevee'], ['Totoro', 'Spirited Away'], ['Demon Slayer', 'Jujutsu Kaisen'],
      ['Manga', 'Webtoon'], ['Shonen', 'Seinen'], ['Ninja', 'Samurai'], ['Kamehameha', 'Rasengan']
    ],
    crossover: [
      ['Orochimaru', 'Voldemort'], ['Gandalf', 'Dumbledore'], ['Goku', 'Superman'], ['Frieza', 'Thanos'],
      ['Darth Vader', 'Madara'], ['Yoda', 'Master Roshi'], ['Hermione', 'Sakura'], ['Luffy', 'Jack Sparrow'],
      ['Sauron', 'Sukuna'], ['Gollum', 'Dobby'], ['L', 'Sherlock Holmes'], ['Saitama', 'Hulk'],
      ['Hogwarts', 'Hidden Leaf Village'], ['Lightsaber', 'Zanpakuto']
    ]
  }
};
