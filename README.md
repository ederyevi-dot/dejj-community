# DEJJ Community

Application communautaire du DEJJ — un mouvement pour tous.
Événements et inscriptions, cartes à collectionner (format vertical, esprit Pokémon TCG), boosters quotidiens,
album personnel, horaires de Chabbat et paracha, contenus quotidiens, mémoire de l'association (La Saga)
et administration sécurisée par rôles.

- **En ligne** : https://ederyevi-dot.github.io/dejj-community/
- **Test sans risque** : ajouter `?demo=1` à l'adresse (données locales, comptes de démonstration).
- **Hébergement** : GitHub Pages + Firebase (Authentication, Firestore, Rules) + Hebcal — **0 € / mois** dans l'offre gratuite.
- **Guide de mise en ligne, de validation et de coûts** : [`GUIDE-MISE-EN-LIGNE.md`](GUIDE-MISE-EN-LIGNE.md)

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | structure de la page, logo officiel, PWA |
| `styles.css` | design complet, cartes TCG, responsive mobile d'abord |
| `app.js` | application (routage, Firebase, admin, mode démo) |
| `seed.js` | contenu de départ (La Saga, animateurs, souvenirs, mots, quiz) |
| `firestore.rules` | règles de sécurité à publier dans la console Firebase |
| `sw.js` | service worker (cache hors ligne, notifications) |
| `manifest.webmanifest` | installation sur téléphone |
| `firebase-config.js` | configuration Firebase — **ne pas modifier** |

## Règles de contenu

Aucune date, fonction, citation ou anecdote n'est inventée. Les fiches historiques reprennent les informations
publiées par [DEJJ La Saga](https://www.dejjlasaga.com/fr/) et sont marquées « à valider » jusqu'à la relecture
d'un administrateur. Les photos fournies sont conservées telles quelles : aucune image générée par IA ne représente
une personne réelle.
