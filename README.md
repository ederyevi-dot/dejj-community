# DEJJ Community — guide de mise en ligne

## 1. Remplacer les fichiers sur GitHub
Dans le dépôt `dejj-community` : **Add file > Upload files**, glisse TOUS ces fichiers (ils remplacent les anciens), puis **Commit changes** :
`index.html`, `styles.css`, `app.js`, `seed.js`, `firebase-config.js`, `sw.js`, `manifest.webmanifest`, `icon.svg`, `firestore.rules`, plus les 4 photos d'animateurs (`vice-presidente.jpg`, `animatrice-lunettes.jpg`, `animateur-casquette.jpg`, `animateur-boucles.jpg`).

**Important : ne remplace pas `firebase-config.js` si tu y as déjà collé tes clés.**

Garde aussi dans le dépôt `dejj-logo.png` et `edgar-guedj.jpg` (déjà présents).

## 2. Renseigner la configuration Firebase (obligatoire)
Firebase Console > roue dentée > **Paramètres du projet** > **Général** > « Vos applications » > application Web `</>` (crée-la si besoin) > copie les valeurs de `firebaseConfig`, puis colle-les dans `firebase-config.js` (surtout `apiKey`, `messagingSenderId`, `appId`).

## 3. Autoriser le site dans Firebase Authentication
Console > **Authentication** > **Paramètres** > **Domaines autorisés** > ajoute `ederyevi-dot.github.io`.
Sans cela, la connexion échoue sur le site publié.

## 4. Publier les règles de sécurité
Console > **Firestore Database** > **Règles** > remplace tout par le contenu de `firestore.rules` > **Publier**.

## 5. Vérifier ton compte administrateur
Dans Firestore, le document `users/<ton UID>` doit contenir le champ `role` = `admin` (texte). Connecte-toi : l'onglet **Admin** apparaît.

## 6. Premiers contenus (dans l'onglet Admin)
1. **Cartes** > « Importer les cartes de départ », puis modifie la carte Edgar Guedj (surnom, rôle, biographie, anecdote vérifiés sur DEJJ La Saga).
2. Crée tes premiers **événements**, **actualités**, **anecdotes**.
3. Programme **Mot du jour** et **Carte du jour** par date (sinon rotation automatique).
4. **Paracha** : saisis l'histoire de la semaine (nom tel qu'affiché sur la page Chabbat).

## 7. Si l'ancienne version s'affiche encore
Le service worker met le site en cache. Cette version charge toujours le réseau en priorité ; ouvre le site, recharge deux fois (ou vide les données du site).

## Limites à connaître
- **Notifications** : les rappels (J-7, J-3, jour J, nouvel événement, booster, carte) s'affichent à l'ouverture de l'application. Les vraies notifications push en arrière-plan demandent Firebase Cloud Messaging + Cloud Functions (forfait Blaze).
- **Booster quotidien** : limité par compte côté Firestore (changer d'appareil ne sert à rien). Le tirage des cartes se fait dans le navigateur ; l'empêcher totalement de tricher demanderait une Cloud Function. La journée change à minuit UTC (1 h ou 2 h à Paris).
- **Chabbat** : horaires calculés par Hebcal (Marseille, Paris, Nice, Lyon). À comparer avec Torah-Box avant diffusion ; Torah-Box ne propose pas d'accès automatique.
- **Photos et biographies** : à utiliser avec autorisation des personnes concernées.

## Cartes légendaires et animateurs
- Onglet Admin > Cartes > **« Importer les cartes de départ »** : ajoute les 14 fondateurs (textes issus de DEJJ La Saga) et les 4 animateurs. Attention : cela remplace les cartes qui ont le même identifiant.
- Les 4 animateurs s'appellent « Nom à compléter » : modifie-les dans Admin > Cartes (nom, totem, anecdote).
- Les fondateurs n'ont pas encore de photo : dépose un fichier (ex. `esther-abitbol.jpg`) dans le dépôt GitHub, puis indique son nom dans le champ « Fichier photo » de la carte. Utilise-les avec l'accord de DEJJ La Saga et des familles.
- Le champ « Cadrage de la photo » règle la partie visible (ex. `50% 20%` = on voit plutôt le haut).
