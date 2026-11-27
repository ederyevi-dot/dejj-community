// Contenu de départ. Tout est modifiable depuis l'administration (onglet Cartes, Mot du jour, Saga...).
// Légendes : fiches de DEJJ La Saga (dejjlasaga.com). Animateurs : noms à compléter. Cartes "exemple" : à remplacer.

export const SEED_CARDS = [
  // ============ Légendes : les fondateurs (source : DEJJ La Saga, dejjlasaga.com) ============
  {
    id: 'edgar-guedj', name: 'Edgar Guedj', nickname: 'Lynclair, le Lynx Clairvoyant', role: 'Fondateur', years: '1921 - 2007',
    bio: 'Né à Sétif, il crée le DEJJ au Maroc puis en France. Sa « méthode Lynclair » : former des formateurs qui en formeront à leur tour.',
    timeline: ['1948 : Se demande comment aller vers les jeunes qui ne viendront jamais au scoutisme', '1961 : S\'installe en France et y transpose le DEJJ', '1965 : 6 000 jeunes encadrés par 550 moniteurs'],
    quote: 'Défendre l\'intérêt des causes sans l\'intérêt de soi.', quoteBy: 'D\'après ses proches', rarity: 'legendaire', collection: 'Légendes du DEJJ', image: 'edgar-guedj.jpg'
  },
  {
    id: 'esther-abitbol', name: 'Esther Abitbol', nickname: 'Fléole', role: 'Fondatrice', years: '1933',
    bio: 'Née à Casablanca, elle fonde le DEJJ au Maroc puis dirige la délégation de Lyon. Le Grand Rabbin Kling l\'appelait avec son mari « Monsieur et Madame DEJJ ».',
    timeline: ['1962 : Prend la direction du DEJJ de Lyon', '1977 : Alyah en Israël', '1997 : Prix Mofet pour son travail éducatif'],
    quote: 'Je m\'appelle Esther Abitbol et je vais créer un mouvement de jeunesse. Confiez-moi vos enfants !', rarity: 'legendaire', collection: 'Légendes du DEJJ', image: ''
  },
  {
    id: 'salomon-abitbol', name: 'Salomon Abitbol', nickname: 'Autruche', role: 'Fondateur', years: '1933',
    bio: 'Chef de troupe aux Éclaireurs de Casablanca, il fait renaître la communauté juive de Saint-Fons en frappant à chaque porte.',
    timeline: ['1960 : Épouse Esther et part en France', '1962 : Dirige la Maison des Jeunes de Saint-Fons', '1990 : Mission de shli\'hout au DEJJ de Paris'],
    quote: 'Nous avions commencé de rien.', rarity: 'legendaire', collection: 'Légendes du DEJJ', image: ''
  },
  {
    id: 'salomon-aflalo', name: 'Salomon Aflalo', nickname: 'Chevreuil', role: 'Fondateur', years: '',
    bio: 'Éducateur et rassembleur, il structure le DEJJ à Nice avant d\'en devenir président. Ses chants dans les camps de Levens ont marqué des générations d\'enfants.',
    timeline: ['1962 : Structure le DEJJ à Nice', '1963 : Encadre les camps de Levens', 'Plus tard : Devient président du DEJJ'],
    quote: 'Agir dans l\'ombre et la discrétion, rester loin des lumières et des médailles.', quoteBy: 'Haïm Benlolo, à propos de Chevreuil', rarity: 'legendaire', collection: 'Légendes du DEJJ', image: ''
  },
  {
    id: 'haim-benlolo', name: 'Haïm Benlolo', nickname: 'Bélier', role: 'Fondateur', years: '1942',
    bio: 'Repéré par Lynclair, il quitte le Maroc en 1963 et lance en France la branche des Pionniers. Une voix de référence du mouvement.',
    timeline: ['1963 : Quitte le Maroc, premiers pas au DEJJ de Lyon', '1967 : Lance les Pionniers (11-15 ans) à Paris', 'Après 1967 : Crée la BEP et la BEC, camps en Corse'],
    quote: 'Une voix à laquelle on se réfère, une opinion respectée.', rarity: 'legendaire', collection: 'Légendes du DEJJ', image: ''
  },
  {
    id: 'andre-darmon', name: 'André Darmon', nickname: 'Otarie', role: 'Fondateur', years: '1928',
    bio: 'Délégué régional du DEJJ à Toulouse, il y organise les premières colonies et des Bar Mitsva pour les enfants de familles modestes.',
    timeline: ['1962 : Nommé délégué régional à Toulouse', '1963 : Première réunion avec 6 ou 7 enfants', 'Colonies : Équipes nommées d\'après les 12 tribus d\'Israël'],
    quote: 'Le DEJJ était sa vie, et le DEJJ a façonné nos vies.', quoteBy: 'Margalith, sa fille', rarity: 'legendaire', collection: 'Légendes du DEJJ', image: ''
  },
  {
    id: 'georges-fhal', name: 'Georges Fhal', nickname: 'Boulette', role: 'Fondateur', years: '1924 - 2021',
    bio: 'Venu de Constantine, il fonde en 1962 la délégation de Marseille. Un homme jovial, « une boule de dynamite ».',
    timeline: ['1962 : Fonde le DEJJ de Marseille', '1962-1972 : Plus d\'une centaine de cadres', '2020 : Publie « Du Rhummel au Kotel »'],
    quote: 'Que seraient devenues nos vies sans toi, Boulette ?', quoteBy: 'Un membre du DEJJ Marseille', rarity: 'legendaire', collection: 'Légendes du DEJJ', image: ''
  },
  {
    id: 'rikki-serfaty', name: 'Rikki Serfaty', nickname: 'Rikki', role: 'Fondatrice', years: '',
    bio: 'Plus de 40 ans consacrés à l\'éducation informelle de l\'enfance juive. Responsable nationale des unités 7-12 ans, devenues les REDEF.',
    timeline: ['1962 : Accueille les enfants rapatriés d\'Algérie', 'Vers 1964 : Mission spéciale à Marseille', '2011 : Prix de la Fondation Gaston Tenoudji'],
    quote: 'Un enfant est un être en devenir que l\'on va aimer et aider à grandir.', rarity: 'legendaire', collection: 'Légendes du DEJJ', image: ''
  },
  {
    id: 'jacques-bakouch', name: 'Jacques Bakouch', nickname: 'Belette', role: 'Fondateur', years: '1937 - 2021',
    bio: 'Membre fondateur du DEJJ à Marseille, éducateur de terrain et formateur BAFA pendant plus de 30 ans. Une « grande gueule » toujours au service des enfants.',
    timeline: ['1965 : Développe le DEJJ à Marseille', 'Pendant 30 ans : Formateur BAFA', '2009 : Officier de l\'Ordre national du mérite'],
    quote: 'Jacques avait pour habitude de ne retenir que le positif.', quoteBy: 'Alain Benhamou, dit Puma', rarity: 'legendaire', collection: 'Légendes du DEJJ', image: ''
  },
  {
    id: 'maurice-arama', name: 'Maurice Arama', nickname: '', role: 'Fondateur, artiste', years: '1934',
    bio: 'Responsable des publications du DEJJ, il a dessiné le logo du DEJJ, la flamme, ainsi qu\'une centaine de figurines.',
    timeline: ['1963 : Responsable des publications du DEJJ', 'Création : Dessine la flamme, logo du DEJJ', 'Chaque semaine : Illustre « La Source de vie »'],
    quote: 'L\'action du DEJJ fut au début comme une torche allumée.', rarity: 'legendaire', collection: 'Légendes du DEJJ', image: ''
  },
  {
    id: 'simon-busbib', name: 'Simon Busbib', nickname: 'Mammouth', role: 'Fondateur, maître des chants', years: '',
    bio: 'Explorateur du DEJJ, il repérait les lieux des futurs camps. Il chantait en français, ladino, espagnol et hébreu autour des feux de camp.',
    timeline: ['1962 : Quitte le Maroc, engagé aussitôt par Lynclair', '1962 : Accueille les familles rapatriées d\'Algérie', 'Veillées : Dirige les chants à plusieurs voix'],
    quote: 'Le chant était sa vie et il aimait partager humblement sa voix magnifique avec tout le monde.', rarity: 'legendaire', collection: 'Légendes du DEJJ', image: ''
  },
  {
    id: 'edmond-elalouf', name: 'Edmond Elalouf', nickname: '', role: 'Co-fondateur', years: '1930 - 2025',
    bio: 'Élève d\'Emmanuel Levinas, il arrive en France en 1963 avec l\'équipe fondatrice. Il préside ensuite le Centre communautaire de Paris.',
    timeline: ['1963 : Co-fonde le DEJJ en France', '1990 : Vice-président du Centre communautaire', '2010 : Chevalier de la Légion d\'honneur'],
    quote: 'Une vision humaniste du judaïsme.', rarity: 'legendaire', collection: 'Légendes du DEJJ', image: ''
  },
  {
    id: 'mady-elalouf', name: 'Mady Elalouf', nickname: '', role: 'Éducatrice, JAC', years: '1934',
    bio: 'Éclaireuse à Fès dès 1943, permanente du DEJJ à Paris, elle anime la JAC pour les adolescents. Cofondatrice du camp d\'Ashkelon.',
    timeline: ['1962 : Dirige le centre aéré de l\'école Maïmonide', 'Années 1960 : Anime la JAC', '2023 : Un hall porte son nom, avec celui d\'Edmond'],
    quote: 'Au Maroc, tout le monde est bénévole !', rarity: 'legendaire', collection: 'Légendes du DEJJ', image: ''
  },
  {
    id: 'ralph-sultan', name: 'Ralph Sultan', nickname: '', role: 'Fondateur, artisan', years: '1930 - 2019',
    bio: 'Bijoutier de métier, il forme les jeunes cadres du DEJJ et veille à la qualité artistique des publications. Il n\'a jamais eu de totem.',
    timeline: ['1963 : Part pour la France avec Lynclair', 'DEJJ : Forme les cadres, travaux manuels', '1969 : S\'installe à Montréal'],
    quote: 'Il adorait sa famille, ses amis, Israël et le Bon Dieu.', rarity: 'legendaire', collection: 'Légendes du DEJJ', image: ''
  },

  // ============ Animateurs d'aujourd'hui (noms à compléter depuis l'administration) ============
  {
    id: 'vice-presidente', name: 'Nom à compléter', nickname: '', role: 'Vice-présidente', years: 'Depuis 2016',
    bio: 'Enfant au DEJJ, puis animatrice, directrice et aujourd\'hui vice-présidente. Une vie de flamme.',
    timeline: ['2016 : Enfant', '2019 : Animatrice', '2022 : Direction', '2025 : Vice-présidente'],
    quote: 'Un enfant n\'est pas un vase que l\'on remplit, mais une flamme que l\'on allume.', rarity: 'epique', collection: 'Animateurs', image: 'vice-presidente.jpg', imagePos: '50% 22%'
  },
  {
    id: 'animateur-casquette', name: 'Nom à compléter', nickname: '', role: 'Animateur', years: 'Depuis 2020',
    bio: 'Au DEJJ depuis 2020, même s\'il a fait un ski en 2018, plus 4 années de JAC.',
    timeline: ['2018 : Premier ski', '2020 : Rejoint le DEJJ', '2023 : Perdu pendant la Maccabiade'],
    quote: 'Je me suis endormi pendant la Maccabiade et mon équipe me cherchait.', rarity: 'rare', collection: 'Animateurs', image: 'animateur-casquette.jpg', imagePos: '50% 30%'
  },
  {
    id: 'animatrice-lunettes', name: 'Nom à compléter', nickname: '', role: 'Animatrice', years: 'Depuis 2025',
    bio: 'Au DEJJ depuis 2025, elle a déjà fait un centre aéré avec des REDEF.',
    timeline: ['2025 : Rejoint le DEJJ', '2025 : Centre aéré avec les REDEF'],
    quote: 'Je suis au DEJJ depuis 2025 et j\'ai fait un centre aéré avec des REDEF.', rarity: 'rare', collection: 'Animateurs', image: 'animatrice-lunettes.jpg', imagePos: '12% 18%'
  },
  {
    id: 'animateur-boucles', name: 'Nom à compléter', nickname: '', role: 'Animateur', years: '',
    bio: 'Animateur du DEJJ, auteur d\'une réponse restée célèbre auprès des petits.',
    timeline: [],
    quote: 'Un petit m\'a demandé qui était le plus rapide entre un guépard et Hachem. J\'ai répondu : il n\'y a pas de débat, c\'est Hachem.', rarity: 'rare', collection: 'Animateurs', image: 'animateur-boucles.jpg', imagePos: '62% 20%'
  },

  // ============ Cartes communes (exemples) ============
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
    id, name, nickname: '', role: 'Objet du quotidien', years: '', timeline: [], quote,
    bio: 'Carte exemple à remplacer depuis l\'administration.', rarity: 'commune', collection: 'Souvenirs', image: ''
  })),
  // ============ Cartes rares (exemples) ============
  ...[
    ['bus-du-depart', 'Le Bus du départ', 'Tout le monde est là, sauf un.'],
    ['valise-oubliee', 'La Valise oubliée', 'Elle a fait trois fois le tour.'],
    ['tableau-des-equipes', 'Le Tableau des équipes', 'Les rivalités commencent ici.'],
    ['lanterne', 'La Lanterne', 'Elle éclaire la veillée.']
  ].map(([id, name, quote]) => ({
    id, name, nickname: '', role: 'Souvenir marquant', years: '', timeline: [], quote,
    bio: 'Carte exemple à remplacer depuis l\'administration.', rarity: 'rare', collection: 'Souvenirs', image: ''
  })),
  // ============ Cartes épiques (exemples) ============
  ...[
    ['grand-jeu', 'Le Grand Jeu', 'Un souvenir que tout le monde raconte autrement.'],
    ['veillee', 'La Veillée', 'Quand tout le monde se tait pour écouter.'],
    ['chaine-humaine', 'La Chaîne humaine', 'Une main, puis dix, puis toute la salle.']
  ].map(([id, name, quote]) => ({
    id, name, nickname: '', role: 'Moment légendaire', years: '', timeline: [], quote,
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
