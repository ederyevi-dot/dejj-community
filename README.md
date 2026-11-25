# DEJJ Community — version Firebase

Cette version transforme le prototype local en première application connectée au projet Firebase `dejj-community`.

## Fonctions incluses
- Connexion et création de compte par e-mail / mot de passe (Firebase Authentication).
- Création automatique d'un profil `member` dans `users/{uid}` lors de l'inscription.
- Lecture des événements en temps réel depuis Firestore.
- Création d'événements par les profils `admin` et `responsable`.
- Inscriptions partagées par événement, avec compteur de places et contrôle de capacité dans une transaction Firestore.
- Consultation des inscrits par les profils `admin`, `responsable` et `animator`.
- Appel à volontaires One Shot par événement pour les animateurs ; sélection/refus par un `admin` ou `responsable`.
- Modification du nom et de la délégation dans le profil.
- Collection de cartes toujours en démonstration et stockée localement sur l'appareil.

## Configuration Firebase déjà renseignée
Le projet Firebase et l'application Web sont déjà configurés dans `app.js`. La configuration Web Firebase n'est pas un mot de passe. La sécurité dépend des règles Firestore et des contrôles d'accès.

## Étapes de mise en service
1. Dans Firebase Console > Firestore Database > Règles, remplace les règles actuelles par le contenu de `firestore.rules`, puis clique sur Publier.
2. Vérifie dans Authentication > Méthode de connexion que « Adresse e-mail/Mot de passe » est activé.
3. Vérifie que le document `users/{UID_ADMIN}` existe avec `role: "admin"` (le profil administrateur créé manuellement).
4. Déploie les fichiers de ce dossier sur un hébergement HTTPS (GitHub Pages convient pour cette PWA statique).
5. Ouvre le site, connecte-toi avec le compte administrateur déjà créé, puis crée un premier événement de test.
6. Crée un compte animateur de test. Un administrateur devra ensuite modifier son document `users/{uid}` dans Firestore et passer `role` à `animator` pour tester One Shot.

## Rôles reconnus
- `admin` : tous les droits de gestion.
- `responsable` : création/gestion des événements et sélection des volontaires.
- `animator` : consultation des inscrits et candidature One Shot.
- `member` : consultation et inscription aux événements.

Les rôles sont attribués par un administrateur dans Firestore. Un utilisateur ne peut pas modifier son propre rôle avec les règles fournies.

## Important avant ouverture au public
- Cette version est une première intégration ; elle n'a pas encore été testée sur ton projet en production.
- Les horaires de Shabbat restent des emplacements de démonstration : aucun horaire n'est calculé.
- Les boosters, cartes et anecdotes restent en démonstration locale ; ils ne sont pas encore synchronisés entre membres.
- Les notifications push, les rappels J-7/J-3/Jour J, l'envoi d'e-mails, le stockage des photos et les tâches planifiées ne sont pas encore configurés.
- Le décompte des places et les inscriptions sont sécurisés par une transaction et des règles Firestore ; il faudra tester les cas de forte concurrence avant un lancement à grande échelle.
- Les données des inscrits sont visibles uniquement par la personne concernée et les profils d'animation autorisés selon les règles.
- Ne publie pas de vraies données personnelles avant d'avoir testé les règles et le parcours complet avec des comptes de test.

## Hébergement
Le site doit être servi en HTTPS pour que le service worker PWA fonctionne. GitHub Pages fournit HTTPS. Pour mettre à jour une version déjà installée, le cache du service worker est versionné (`dejj-static-v2`).
