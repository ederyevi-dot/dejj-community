# DEJJ — Le magazine de la communauté

Refonte éditoriale du site DEJJ Community, toujours connectée au projet Firebase `dejj-community`.

## Direction graphique
- Univers magazine / scrapbook : papier crème, gros titres éditoriaux, étiquettes, rubans adhésifs, photos façon tirage et encarts colorés.
- Palette : bleu encre, rouge corail, jaune papier, rose et vert doux.
- Mise en page responsive pour ordinateur et mobile.
- Accueil organisé comme une couverture de magazine : une à la une, agenda, encart Chabbat, chronique de la Paracha et mot du jour.

## Fonctionnalités conservées
- Connexion et création de compte par Firebase Authentication.
- Profils et délégations dans Firestore.
- Événements partagés en temps réel.
- Inscriptions avec capacité et compteur transactionnel.
- Consultation des inscrits par l'équipe autorisée.
- Appel à volontaires One Shot et validation par un responsable.

## Chabbat et Paracha
- Sélecteur de ville : Marseille, Paris, Nice et Lyon.
- Lien direct vers les horaires de Chabbat de Torah-Box : https://www.torah-box.com/calendrier/chabbat
- La chronique affichée dans cette édition est consacrée à Vayichla'h, pour le Chabbat du 28 novembre 2026 (diaspora). Le texte est un résumé original, avec lien vers une ressource Torah-Box.
- Les horaires ne sont pas calculés ni importés automatiquement dans cette version. Le bouton renvoie vers Torah-Box : ne pas afficher les horaires comme s'ils étaient synchronisés.
- Le contenu de la Paracha est statique dans cette édition et devra être renouvelé chaque semaine par un administrateur ou par une intégration validée.

## Collection des animateurs
- Les anciennes cartes génériques ont été retirées.
- Les boosters sont désactivés tant que les portraits de vrais animateurs n'ont pas été validés.
- Avant publication d'une carte : confirmer l'identité, le prénom/surnom, la délégation, la biographie et obtenir l'accord pour l'utilisation de la photo et des informations personnelles.
- Ne pas aspirer ou republier automatiquement les photos Instagram. Utiliser les comptes publics uniquement comme pistes de contact/vérification et demander les autorisations nécessaires.

## Configuration et déploiement
Le projet Firebase est configuré dans `app.js`. Le site peut être déployé sur GitHub Pages en HTTPS.

Pour mettre à jour le dépôt existant : remplacer les fichiers par ceux de cette archive, en conservant `firestore.rules` déjà publiées si elles n'ont pas été modifiées. Le service worker utilise le cache `dejj-static-v3` pour forcer le rafraîchissement des fichiers.

## Limites à traiter avant ouverture publique
- Les horaires de Chabbat ne sont pas encore synchronisés automatiquement.
- La chronique de Paracha n'est pas encore alimentée automatiquement chaque semaine.
- Les boosters et la collection d'animateurs nécessitent une base de cartes Firestore, une interface d'administration et les autorisations des personnes représentées.
- Les notifications push et rappels planifiés ne sont pas encore configurés.
- Tester les règles Firestore et les parcours avec des comptes de test avant d'enregistrer des données réelles.
