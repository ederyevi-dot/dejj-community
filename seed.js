// Contenu de départ — DEJJ Community
// RÈGLES DE CONTENU (cahier des charges) :
//  · aucune date, fonction, citation ou anecdote inventée ;
//  · les fiches historiques ci-dessous reprennent les informations publiées par DEJJ La Saga
//    (https://www.dejjlasaga.com/fr/) : elles doivent être relues et validées par un administrateur
//    avant publication, et les droits des photos doivent être obtenus ;
//  · les cartes « exemple » servent uniquement à tester l'album et les boosters : elles ne représentent
//    aucune personne réelle. Elles sont supprimables en un clic depuis l'administration.
//  · les champs « à compléter » ne contiennent aucune information inventée : ils restent vides.

export const SEED_CARDS = [
  // ================= LÉGENDES — fondateurs, source DEJJ La Saga =================
  {
    id: 'edgar-guedj', name: 'Edgar Guedj', nickname: 'Lynclair, le Lynx Clairvoyant', role: 'Fondateur',
    category: 'personne', collection: 'Légendes du DEJJ', rarity: 'legendaire', order: 10,
    anecdote: "Né à Sétif, il se demande comment aller vers les jeunes qui ne viendront jamais au scoutisme. De là naît le DEJJ, au Maroc puis en France, et sa « méthode Lynclair » : former des formateurs qui en formeront à leur tour.",
    career: ['1948 : Se demande comment aller vers les jeunes qui ne viendront jamais au scoutisme', "1961 : S'installe en France et y transpose le DEJJ", '1965 : 6 000 jeunes encadrés par 550 moniteurs'],
    years: '1921 - 2007', quote: "Défendre l'intérêt des causes sans l'intérêt de soi.", quoteBy: 'D’après ses proches',
    image: 'edgar-guedj.jpg', sources: 'DEJJ La Saga — dejjlasaga.com', historical: true, toVerify: true, published: true, inPack: true
  },
  {
    id: 'esther-abitbol', name: 'Esther Abitbol', nickname: 'Fléole', role: 'Fondatrice',
    category: 'personne', collection: 'Légendes du DEJJ', rarity: 'legendaire', order: 20,
    anecdote: "Née à Casablanca, elle fonde le DEJJ au Maroc puis dirige la délégation de Lyon. Le Grand Rabbin Kling l'appelait avec son mari « Monsieur et Madame DEJJ ».",
    career: ['1962 : Prend la direction du DEJJ de Lyon', '1977 : Alyah en Israël', '1997 : Prix Mofet pour son travail éducatif'],
    years: '1933', quote: "Je m'appelle Esther Abitbol et je vais créer un mouvement de jeunesse. Confiez-moi vos enfants !",
    image: 'esther-abitbol.jpg', sources: 'DEJJ La Saga — dejjlasaga.com', historical: true, toVerify: true, published: true, inPack: true
  },
  {
    id: 'salomon-abitbol', name: 'Salomon Abitbol', nickname: 'Autruche', role: 'Fondateur',
    category: 'personne', collection: 'Légendes du DEJJ', rarity: 'legendaire', order: 30,
    anecdote: "Chef de troupe aux Éclaireurs de Casablanca, il fait renaître la communauté juive de Saint-Fons en frappant à chaque porte.",
    career: ['1960 : Épouse Esther et part en France', '1962 : Dirige la Maison des Jeunes de Saint-Fons', "1990 : Mission de shli'hout au DEJJ de Paris"],
    years: '1933', quote: 'Nous avions commencé de rien.',
    image: 'salomon-abitbol.png', sources: 'DEJJ La Saga — dejjlasaga.com', historical: true, toVerify: true, published: true, inPack: true
  },
  {
    id: 'salomon-aflalo', name: 'Salomon Aflalo', nickname: 'Chevreuil', role: 'Fondateur puis président',
    category: 'personne', collection: 'Légendes du DEJJ', rarity: 'legendaire', order: 40,
    anecdote: "Éducateur et rassembleur, il structure le DEJJ à Nice avant d'en devenir président. Ses chants dans les camps de Levens ont marqué des générations d'enfants.",
    career: ['1962 : Structure le DEJJ à Nice', '1963 : Encadre les camps de Levens', 'Plus tard : Devient président du DEJJ'],
    years: '', quote: "Agir dans l'ombre et la discrétion, rester loin des lumières et des médailles.", quoteBy: 'Haïm Benlolo, à propos de Chevreuil',
    image: 'salomon-aflalo.png', sources: 'DEJJ La Saga — dejjlasaga.com', historical: true, toVerify: true, published: true, inPack: true
  },
  {
    id: 'haim-benlolo', name: 'Haïm Benlolo', nickname: 'Bélier', role: 'Fondateur, Pionniers',
    category: 'personne', collection: 'Légendes du DEJJ', rarity: 'legendaire', order: 50,
    anecdote: 'Repéré par Lynclair, il quitte le Maroc en 1963 et lance en France la branche des Pionniers. Une voix de référence du mouvement.',
    career: ['1963 : Quitte le Maroc, premiers pas au DEJJ de Lyon', '1967 : Lance les Pionniers (11-15 ans) à Paris', 'Après 1967 : Crée la BEP et la BEC, camps en Corse'],
    years: '1942', quote: 'Une voix à laquelle on se réfère, une opinion respectée.',
    image: 'haim-benlolo.png', sources: 'DEJJ La Saga — dejjlasaga.com', historical: true, toVerify: true, published: true, inPack: true
  },
  {
    id: 'andre-darmon', name: 'André Darmon', nickname: 'Otarie', role: 'Délégué régional, Toulouse',
    category: 'personne', collection: 'Légendes du DEJJ', rarity: 'legendaire', order: 60,
    anecdote: "Délégué régional du DEJJ à Toulouse, il y organise les premières colonies et des Bar Mitsva pour les enfants de familles modestes.",
    career: ['1962 : Nommé délégué régional à Toulouse', '1963 : Première réunion avec 6 ou 7 enfants', "Colonies : Équipes nommées d'après les 12 tribus d'Israël"],
    years: '1928', quote: 'Le DEJJ était sa vie, et le DEJJ a façonné nos vies.', quoteBy: 'Margalith, sa fille',
    image: 'andre-darmon.png', sources: 'DEJJ La Saga — dejjlasaga.com', historical: true, toVerify: true, published: true, inPack: true
  },
  {
    id: 'georges-fhal', name: 'Georges Fhal', nickname: 'Boulette', role: 'Fondateur, Marseille',
    category: 'personne', collection: 'Légendes du DEJJ', rarity: 'legendaire', order: 70,
    anecdote: "Venu de Constantine, il fonde en 1962 la délégation de Marseille. Un homme jovial, « une boule de dynamite ».",
    career: ['1962 : Fonde le DEJJ de Marseille', "1962-1972 : Plus d'une centaine de cadres", '2020 : Publie « Du Rhummel au Kotel »'],
    years: '1924 - 2021', quote: 'Que seraient devenues nos vies sans toi, Boulette ?', quoteBy: 'Un membre du DEJJ Marseille',
    image: 'georges-fhal.jpg', sources: 'DEJJ La Saga — dejjlasaga.com', historical: true, toVerify: true, published: true, inPack: true
  },
  {
    id: 'rikki-serfaty', name: 'Rikki Serfaty', nickname: 'Rikki', role: 'Responsable nationale des 7-12 ans (REDEF)',
    category: 'personne', collection: 'Légendes du DEJJ', rarity: 'legendaire', order: 80,
    anecdote: "Plus de 40 ans consacrés à l'éducation informelle de l'enfance juive. Responsable nationale des unités 7-12 ans, devenues les REDEF.",
    career: ["1962 : Accueille les enfants rapatriés d'Algérie", 'Vers 1964 : Mission spéciale à Marseille', '2011 : Prix de la Fondation Gaston Tenoudji'],
    years: '', quote: "Un enfant est un être en devenir que l'on va aimer et aider à grandir.",
    image: 'rikki-serfaty.png', sources: 'DEJJ La Saga — dejjlasaga.com', historical: true, toVerify: true, published: true, inPack: true
  },
  {
    id: 'jacques-bakouch', name: 'Jacques Bakouch', nickname: 'Belette', role: 'Fondateur, formateur BAFA',
    category: 'personne', collection: 'Légendes du DEJJ', rarity: 'legendaire', order: 90,
    anecdote: "Membre fondateur du DEJJ à Marseille, éducateur de terrain et formateur BAFA pendant plus de 30 ans. Une « grande gueule » toujours au service des enfants.",
    career: ['1965 : Développe le DEJJ à Marseille', 'Pendant 30 ans : Formateur BAFA', "2009 : Officier de l'Ordre national du mérite"],
    years: '1937 - 2021', quote: 'Jacques avait pour habitude de ne retenir que le positif.', quoteBy: 'Alain Benhamou, dit Puma',
    image: 'jacques-bakouch.png', sources: 'DEJJ La Saga — dejjlasaga.com', historical: true, toVerify: true, published: true, inPack: true
  },
  {
    id: 'maurice-arama', name: 'Maurice Arama', nickname: '', role: 'Responsable des publications, dessinateur du logo',
    category: 'personne', collection: 'Légendes du DEJJ', rarity: 'legendaire', order: 100,
    anecdote: "Responsable des publications du DEJJ, il a dessiné le logo du DEJJ, la flamme, ainsi qu'une centaine de figurines.",
    career: ['1963 : Responsable des publications du DEJJ', 'Création : Dessine la flamme, logo du DEJJ', 'Chaque semaine : Illustre « La Source de vie »'],
    years: '1934', quote: "L'action du DEJJ fut au début comme une torche allumée.",
    image: 'maurice-arama.jpg', sources: 'DEJJ La Saga — dejjlasaga.com', historical: true, toVerify: true, published: true, inPack: true
  },
  {
    id: 'simon-busbib', name: 'Simon Busbib', nickname: 'Mammouth', role: 'Fondateur, maître des chants',
    category: 'personne', collection: 'Légendes du DEJJ', rarity: 'legendaire', order: 110,
    anecdote: "Explorateur du DEJJ, il repérait les lieux des futurs camps. Il chantait en français, ladino, espagnol et hébreu autour des feux de camp.",
    career: ['1962 : Quitte le Maroc, engagé aussitôt par Lynclair', "1962 : Accueille les familles rapatriées d'Algérie", 'Veillées : Dirige les chants à plusieurs voix'],
    years: '', quote: 'Le chant était sa vie et il aimait partager humblement sa voix magnifique avec tout le monde.',
    image: 'simon-busbib.png', sources: 'DEJJ La Saga — dejjlasaga.com', historical: true, toVerify: true, published: true, inPack: true
  },
  {
    id: 'edmond-elalouf', name: 'Edmond Elalouf', nickname: '', role: 'Co-fondateur',
    category: 'personne', collection: 'Légendes du DEJJ', rarity: 'legendaire', order: 120,
    anecdote: "Élève d'Emmanuel Levinas, il arrive en France en 1963 avec l'équipe fondatrice. Il préside ensuite le Centre communautaire de Paris.",
    career: ['1963 : Co-fonde le DEJJ en France', '1990 : Vice-président du Centre communautaire', "2010 : Chevalier de la Légion d'honneur"],
    years: '1930 - 2025', quote: 'Une vision humaniste du judaïsme.',
    image: 'edmond-elalouf.jpg', sources: 'DEJJ La Saga — dejjlasaga.com', historical: true, toVerify: true, published: true, inPack: true
  },
  {
    id: 'mady-elalouf', name: 'Mady Elalouf', nickname: '', role: 'Éducatrice, JAC',
    category: 'personne', collection: 'Légendes du DEJJ', rarity: 'legendaire', order: 130,
    anecdote: "Éclaireuse à Fès dès 1943, permanente du DEJJ à Paris, elle anime la JAC pour les adolescents. Cofondatrice du camp d'Ashkelon.",
    career: ["1962 : Dirige le centre aéré de l'école Maïmonide", 'Années 1960 : Anime la JAC', "2023 : Un hall porte son nom, avec celui d'Edmond"],
    years: '1934', quote: 'Au Maroc, tout le monde est bénévole !',
    image: 'mady-elalouf.png', sources: 'DEJJ La Saga — dejjlasaga.com', historical: true, toVerify: true, published: true, inPack: true
  },
  {
    id: 'ralph-sultan', name: 'Ralph Sultan', nickname: '', role: 'Fondateur, artisan',
    category: 'personne', collection: 'Légendes du DEJJ', rarity: 'legendaire', order: 140,
    anecdote: "Bijoutier de métier, il forme les jeunes cadres du DEJJ et veille à la qualité artistique des publications. Il n'a jamais eu de totem.",
    career: ['1963 : Part pour la France avec Lynclair', 'DEJJ : Forme les cadres, travaux manuels', "1969 : S'installe à Montréal"],
    years: '1930 - 2019', quote: 'Il adorait sa famille, ses amis, Israël et le Bon Dieu.',
    image: 'ralph-sultan.png', sources: 'DEJJ La Saga — dejjlasaga.com', historical: true, toVerify: true, published: true, inPack: true
  },

  // ================= ANIMATEURS D'AUJOURD'HUI =================
  // Les noms restent vides tant que l'utilisateur ne les a pas fournis : rien n'est inventé.
  // Chaque carte garde sa photo d'origine (déposer animateur-*.jpg) et son anecdote, sans mélange entre photos.
  {
    id: 'animateur-boucles', name: 'À compléter', nickname: '', role: 'Animateur',
    category: 'animateur', collection: 'Animateurs', rarity: 'rare', order: 210, toVerify: true,
    anecdote: "Un enfant lui demande qui est le plus rapide entre un guépard et Hachem. Il répond qu'il n'y a pas de débat : Hachem est le plus rapide.",
    career: [], joinYear: null, years: '', quote: '', quoteBy: '',
    image: 'animateur-boucles.jpg', imagePos: '50% 24%',
    sources: 'Anecdote transmise par l’intéressé — nom et photo à confirmer', published: true, inPack: true
  },
  {
    id: 'animatrice-crepes', name: 'À compléter', nickname: '', role: 'Vice-présidente',
    category: 'animateur', collection: 'Animateurs', rarity: 'epique', order: 220, toVerify: true,
    anecdote: "Son parcours en dit long : enfant au DEJJ, puis animatrice (et reine des crêpes), directrice, et aujourd'hui vice-présidente. Sa phrase est restée : « Un enfant n'est pas un vase que l'on remplit, mais une flamme que l'on allume. »",
    career: ['2016 : Enfant', '2019 : Animatrice', '2022 : Direction', '2025 : Vice-présidente'],
    joinYear: 2016, years: 'Depuis 2016', quote: "Un enfant n'est pas un vase que l'on remplit, mais une flamme que l'on allume.",
    image: 'animatrice-crepes.jpg', imagePos: '50% 22%',
    sources: 'Parcours et citation transmis par l’intéressée — nom et photo à confirmer', published: true, inPack: true
  },
  {
    id: 'animateur-casquette', name: 'À compléter', nickname: '', role: 'Animateur',
    category: 'animateur', collection: 'Animateurs', rarity: 'rare', order: 230, toVerify: true,
    anecdote: "Il s'est endormi pendant une Macabiade en 2023… et son équipe le cherchait partout.",
    career: ['2018 : Un ski', '2020 : Rejoint le DEJJ', '2023 : La Macabiade où il a disparu (il dormait)'],
    joinYear: 2020, years: 'Depuis 2020', quote: 'Quatre années de JAC à son actif, et un sommeil légendaire.',
    image: 'animateur-casquette.jpg', imagePos: '50% 28%',
    sources: 'Anecdote et parcours transmis — nom et photo à confirmer', published: true, inPack: true
  },
  {
    id: 'animatrice-lunettes', name: 'À compléter', nickname: '', role: 'Animatrice',
    category: 'animateur', collection: 'Animateurs', rarity: 'rare', order: 240, toVerify: true,
    anecdote: "Arrivée en 2025, elle a déjà fait un centre aéré avec des REDEF — et elle est repartie avec une réserve d'histoires.",
    career: ['2025 : Rejoint le DEJJ', '2025 : Centre aéré avec les REDEF'],
    joinYear: 2025, years: 'Depuis 2025', quote: '',
    image: 'animatrice-lunettes.jpg', imagePos: '50% 20%',
    sources: 'Informations transmises — nom et photo à confirmer', published: true, inPack: true
  }
];

export const SEED_WORDS = [
  { word: 'Kehila', definition: 'La communauté : un groupe de personnes qui avancent ensemble.', hint: 'Commence par K, 6 lettres.' },
  { word: 'Hessed', definition: "La bonté, l'acte de générosité gratuit envers l'autre.", hint: 'Commence par H, 6 lettres.' },
  { word: 'Tsedaka', definition: 'La justice sociale, souvent traduite par charité : donner à ceux qui en ont besoin.', hint: 'Commence par T, 7 lettres.' },
  { word: 'Simha', definition: "La joie, qu'on partage lors des fêtes et des rassemblements.", hint: 'Commence par S, 5 lettres.' },
  { word: 'Chalom', definition: "La paix, mais aussi le mot pour dire bonjour et au revoir.", hint: 'Commence par C, 6 lettres.' },
  { word: 'Mazal', definition: 'La chance, la bonne étoile. On l’entend dans « Mazal tov ».', hint: 'Commence par M, 5 lettres.' },
  { word: 'Havrouta', definition: "L'étude à deux : on apprend en discutant avec un partenaire.", hint: 'Commence par H, 8 lettres.' },
  { word: 'Ahava', definition: "L'amour, l'affection pour les autres.", hint: 'Commence par A, 5 lettres.' },
  { word: 'Emouna', definition: 'La foi, la confiance.', hint: 'Commence par E, 6 lettres.' },
  { word: 'Tikoun', definition: "La réparation : améliorer ce qui peut l'être.", hint: 'Commence par T, 6 lettres.' },
  { word: 'Haverim', definition: 'Les amis, les camarades.', hint: 'Commence par H, 7 lettres.' },
  { word: 'Nigoun', definition: 'Une mélodie sans paroles que l’on chante ensemble.', hint: 'Commence par N, 6 lettres.' },
  { word: 'Mitsva', definition: 'Un commandement, et par extension une bonne action.', hint: 'Commence par M, 6 lettres.' },
  { word: 'Kavana', definition: "L'intention, la concentration que l'on met dans ce que l'on fait.", hint: 'Commence par K, 6 lettres.' }
];

export const SEED_ANECDOTES = [
  {
    id: 'bienvenue',
    title: 'Bienvenue dans La Saga',
    year: '',
    body: "Les anecdotes, souvenirs et événements marquants du DEJJ sont publiés ici par l'équipe : colonies, Macabiades, JAC, camps et vie associative. Pour aller plus loin sur l'histoire de l'association : DEJJ La Saga (dejjlasaga.com)."
  }
];

export const SEED_QUIZ = [
  { id: 'q1', question: 'Combien de bougies allume-t-on traditionnellement pour accueillir Chabbat ?', options: ['1', '2', '3', '4'], answer: 1 },
  { id: 'q2', question: 'Combien de pains (hallot) place-t-on sur la table de Chabbat ?', options: ['1', '2', '3', '4'], answer: 1 },
  { id: 'q3', question: 'À quel moment de la semaine commence Chabbat ?', options: ['Jeudi soir', 'Vendredi soir', 'Samedi matin', 'Dimanche soir'], answer: 1 }
];

// Cartes « Souvenirs » : objets et moments génériques (aucune personne réelle, aucune donnée inventée sur quelqu'un).
// Elles peuvent être supprimées depuis l'administration si l'équipe ne souhaite que des personnes réelles.
const SOUVENIRS = [
  ['sac-a-dos', 'Le Sac à dos', 'Objet', 'commune', 300, 'Toujours trop lourd, jamais assez rangé : il contient la gourde, le carnet de chants et le pull « au cas où ».', ''],
  ['feu-de-camp', 'Le Feu de camp', 'Lieu', 'commune', 301, 'On y chante plus qu’on n’y cuit, et personne ne se souvient de qui a allumé le feu.', ''],
  ['guitare', 'La Guitare', 'Objet', 'rare', 302, 'Trois accords et toute la bande suit. Elle a traversé plus de veillées que n’importe quel animateur.', ''],
  ['sifflet', 'Le Sifflet', 'Objet', 'commune', 303, 'Un coup : rassemblement. Deux coups : on ne sait jamais, mais tout le monde accourt.', ''],
  ['carnet-de-chants', 'Le Carnet de chants', 'Objet', 'rare', 304, 'Les pages sont écornées, les refrains connus par cœur, et la couverture a vu passer des générations.', ''],
  ['badge', 'Le Badge', 'Objet', 'commune', 305, 'Petit objet, grande fierté : on le coud, on le perd, on le réclame.', ''],
  ['megaphone', 'Le Mégaphone', 'Objet', 'commune', 306, 'Pour les annonces, les départs de bus et les fous rires imprévus.', ''],
  ['gourde', 'La Gourde', 'Objet', 'commune', 307, 'Plus personne ne sait à qui elle est, mais elle est toujours remplie.', ''],
  ['bus-du-depart', 'Le Bus du départ', 'Événement', 'rare', 308, 'Tout le monde est là, sauf un. Le départ est retardé de dix minutes, comme chaque année.', ''],
  ['valise-oubliee', 'La Valise oubliée', 'Objet', 'epique', 309, 'Elle a fait trois fois le tour du camp avant de retrouver son propriétaire.', ''],
  ['tableau-des-equipes', 'Le Tableau des équipes', 'Objet', 'rare', 310, 'Les rivalités commencent ici, les amitiés aussi.', ''],
  ['lanterne', 'La Lanterne', 'Objet', 'rare', 311, 'Elle éclaire la veillée, et surtout les visages qui écoutent.', ''],
  ['grand-jeu', 'Le Grand Jeu', 'Événement', 'epique', 312, 'Un souvenir que tout le monde raconte autrement, avec à chaque fois une nouvelle règle.', ''],
  ['veillee', 'La Veillée', 'Événement', 'epique', 313, 'Quand tout le monde se tait pour écouter, on sait que la journée est réussie.', ''],
  ['chaine-humaine', 'La Chaîne humaine', 'Événement', 'rare', 314, 'Une main, puis dix, puis toute la salle : le moment où le groupe devient un groupe.', '']
];
SEED_CARDS.push(...SOUVENIRS.map(([id, name, category, rarity, order, anecdote, image]) => ({
  id, name, nickname: '', role: 'Souvenir du DEJJ', category: category.toLowerCase() === 'objet' ? 'objet' : category.toLowerCase() === 'lieu' ? 'lieu' : 'evenement',
  collection: 'Souvenirs', rarity, order, anecdote, career: [], years: '', quote: '', image,
  sources: 'Carte « souvenir » générique (aucune personne réelle)', published: true, inPack: true
})));
