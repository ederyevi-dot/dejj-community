// Contenu de départ. Tout est modifiable depuis l'administration (onglet Cartes, Mot du jour, Saga...).
// Les cartes marquées "exemple" sont des modèles à remplacer par de vraies cartes DEJJ.

export const SEED_CARDS = [
  {
    id: 'edgar-guedj',
    name: 'Edgar Guedj',
    nickname: 'Totem à compléter',
    role: 'Figure historique du DEJJ',
    bio: 'Biographie à compléter et à vérifier à partir de DEJJ La Saga (dejjlasaga.com) avant publication.',
    quote: 'Anecdote ou citation à ajouter.',
    rarity: 'legendaire',
    collection: 'Légendes du DEJJ',
    image: 'edgar-guedj.jpg'
  },
  // Cartes communes (exemples)
  ...[
    ['sac-a-dos', 'Le Sac à dos', 'Toujours trop lourd, jamais assez rangé.'],
    ['feu-de-camp', 'Le Feu de camp', 'On y chante plus qu\'on n\'y cuit.'],
    ['guitare', 'La Guitare', 'Trois accords et toute la bande suit.'],
    ['sifflet', 'Le Sifflet', 'Un coup : rassemblement.'],
    ['carnet-de-chants', 'Le Carnet de chants', 'Les pages sont écornées, les refrains connus.'],
    ['badge', 'Le Badge', 'Petit objet, grande fierté.'],
    ['megaphone', 'Le Mégaphone', 'Pour les annonces et les fous rires.'],
    ['gourde', 'La Gourde', 'Plus personne ne sait à qui elle est.']
  ].map(([id, name, quote]) => ({
    id, name, nickname: 'Exemple', role: 'Objet du quotidien DEJJ', quote,
    bio: 'Carte exemple à remplacer depuis l\'administration.', rarity: 'commune', collection: 'Souvenirs', image: ''
  })),
  // Cartes rares (exemples)
  ...[
    ['bus-du-depart', 'Le Bus du départ', 'Tout le monde est là, sauf un.'],
    ['valise-oubliee', 'La Valise oubliée', 'Elle a fait trois fois le tour.'],
    ['tableau-des-equipes', 'Le Tableau des équipes', 'Les rivalités commencent ici.'],
    ['lanterne', 'La Lanterne', 'Elle éclaire la veillée.']
  ].map(([id, name, quote]) => ({
    id, name, nickname: 'Exemple', role: 'Souvenir marquant', quote,
    bio: 'Carte exemple à remplacer depuis l\'administration.', rarity: 'rare', collection: 'Souvenirs', image: ''
  })),
  // Cartes épiques (exemples)
  ...[
    ['grand-jeu', 'Le Grand Jeu', 'Un souvenir que tout le monde raconte autrement.'],
    ['veillee', 'La Veillée', 'Quand tout le monde se tait pour écouter.'],
    ['chaine-humaine', 'La Chaîne humaine', 'Une main, puis dix, puis toute la salle.']
  ].map(([id, name, quote]) => ({
    id, name, nickname: 'Exemple', role: 'Moment légendaire', quote,
    bio: 'Carte exemple à remplacer depuis l\'administration.', rarity: 'epique', collection: 'Moments forts', image: ''
  }))
];

export const SEED_WORDS = [
  { word: 'Kehila', definition: 'La communauté : un groupe de personnes qui avancent ensemble.', hint: 'Commence par K, 6 lettres.' },
  { word: 'Hessed', definition: 'La bonté, l\'acte de générosité gratuit envers l\'autre.', hint: 'Commence par H, 6 lettres.' },
  { word: 'Tsedaka', definition: 'La justice sociale, souvent traduite par charité : donner à ceux qui en ont besoin.', hint: 'Commence par T, 7 lettres.' },
  { word: 'Simha', definition: 'La joie, qu\'on partage lors des fêtes et des rassemblements.', hint: 'Commence par S, 5 lettres.' },
  { word: 'Chalom', definition: 'La paix, mais aussi le mot pour dire bonjour et au revoir.', hint: 'Commence par C, 6 lettres.' },
  { word: 'Mazal', definition: 'La chance, la bonne étoile. On l\'entend dans « Mazal tov ».', hint: 'Commence par M, 5 lettres.' },
  { word: 'Havrouta', definition: 'L\'étude à deux : on apprend en discutant avec un partenaire.', hint: 'Commence par H, 8 lettres.' },
  { word: 'Ahava', definition: 'L\'amour, l\'affection pour les autres.', hint: 'Commence par A, 5 lettres.' },
  { word: 'Emouna', definition: 'La foi, la confiance.', hint: 'Commence par E, 6 lettres.' },
  { word: 'Tikoun', definition: 'La réparation : améliorer ce qui peut l\'être.', hint: 'Commence par T, 6 lettres.' },
  { word: 'Haverim', definition: 'Les amis, les camarades.', hint: 'Commence par H, 7 lettres.' },
  { word: 'Nigoun', definition: 'Une mélodie sans paroles que l\'on chante ensemble.', hint: 'Commence par N, 6 lettres.' },
  { word: 'Mitsva', definition: 'Un commandement, et par extension une bonne action.', hint: 'Commence par M, 6 lettres.' },
  { word: 'Kavana', definition: 'L\'intention, la concentration que l\'on met dans ce que l\'on fait.', hint: 'Commence par K, 6 lettres.' }
];

export const SEED_ANECDOTES = [
  {
    id: 'bienvenue',
    title: 'Bienvenue dans La Saga',
    year: '',
    body: 'Les anecdotes, souvenirs et événements marquants du DEJJ seront publiés ici par l\'équipe. Pour en savoir plus sur l\'histoire de l\'association, rendez-vous sur DEJJ La Saga (dejjlasaga.com).'
  }
];

export const SEED_QUIZ = [
  { id: 'q1', question: 'Combien de bougies allume-t-on traditionnellement pour accueillir Chabbat ?', options: ['1', '2', '3', '4'], answer: 1 },
  { id: 'q2', question: 'Combien de pains (hallot) place-t-on sur la table de Chabbat ?', options: ['1', '2', '3', '4'], answer: 1 },
  { id: 'q3', question: 'À quel moment de la semaine commence Chabbat ?', options: ['Jeudi soir', 'Vendredi soir', 'Samedi matin', 'Dimanche soir'], answer: 1 }
];
