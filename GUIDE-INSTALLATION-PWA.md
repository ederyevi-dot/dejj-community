# DEJJ Community — installation sur téléphone et ordinateur

## Ordinateur
Ouvrir https://ederyevi-dot.github.io/dejj-community/ dans un navigateur récent.
Le site reste accessible par ce lien.

## Android
Ouvrir le lien dans Chrome. Lorsque le bouton « Installer » apparaît dans l'application, cliquer dessus et confirmer.
Si le bouton n'apparaît pas : menu ⋮ > Installer l'application (ou Ajouter à l'écran d'accueil).

## iPhone / iPad
Ouvrir le lien dans Safari > bouton Partager > « Sur l'écran d'accueil » > Ajouter.
Sur iOS, l'installation se fait depuis le menu de partage de Safari ; le bouton automatique d'installation n'est pas proposé comme sur Android.

## Publication
Remplacer les fichiers du dépôt GitHub Pages par le contenu du dossier `dejj-community` de cette archive, puis valider les changements.
Conserver `firebase-config.js` et `firestore.rules` en l'état, sauf modification volontaire et vérifiée des règles Firebase.
La mise à jour du cache est déjà prévue dans `sw.js` (cache `dejj-v8-pwa`).
