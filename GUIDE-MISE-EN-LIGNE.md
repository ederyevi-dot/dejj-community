# DEJJ Community — mise en ligne et guide de validation

> Application communautaire du DEJJ : événements et inscriptions, cartes à collectionner (format Pokémon TCG),
> boosters quotidiens, album, Chabbat et paracha, contenus quotidiens, La Saga, administration par rôles.
> **0 € d'abonnement mensuel** : GitHub Pages + offre gratuite Firebase (Spark) + Hebcal. Les limites payantes sont signalées.

---

## 1. Ce qui a changé (résumé)

| Étape du cahier des charges | État |
|---|---|
| 1. Design vertical des cartes, photos, anecdote → parcours → ancienneté | ✅ refait (cadre métallique, badges, sceau flamme) |
| 2. Boosters : probabilités, enregistrement, doublons | ✅ transaction + journal `boosters` + compteur de doublons |
| 3. Cartes historiques La Saga + cartes animateurs | ✅ pré-remplies (sources La Saga, fiches « à valider ») |
| 4. Album, carte du jour, mot du jour, anecdotes, quiz | ✅ album complet, contenus programmables |
| 5. Agenda, inscriptions, liste d'attente, exports | ✅ + exports CSV **et** Excel |
| 6. Chabbat, paracha, notifications, administration | ✅ Hebcal + paracha éditable + alertes + admin 4 rôles |
| 7. Tests téléphone / ordinateur | ✅ testé en navigateur (desktop 1280 px et mobile 390 px) |

Détail par fonction :

- **Cartes** : format vertical 5/7, cadre métallique (argent / or / violet / holographique), photo réelle centrale,
  bandeau du nom, bandeau fonction, **anecdote mise en avant**, **parcours**, **badge d'ancienneté** en dernier,
  sceau du logo officiel. Les effets (holo, étincelles, inclinaison 3D) sont **derrière** la face : ils ne masquent jamais
  la photo ni les textes. Raretés : Commune (argentée), Rare (dorée), Épique (violette), Légendaire (multicolore animée).
- **Boosters** : un par jour et par compte, probabilités **60 / 28 / 9 / 3** par défaut, **modifiables par l'admin**,
  indication claire « par carte » ou « par booster ». Ouverture animée, révélation une par une, effet spécial Légendaire,
  ajout automatique à l'album, doublons comptés (`×3` sur la carte).
- **Album** : progression en %, compteurs par rareté, doublons, filtres collection / catégorie / possédées / manquantes,
  tri par rareté, nom ou doublons, recherche, clic pour ouvrir la carte en grand. Les cartes manquantes restent
  **anonymes** (nom réel masqué, anecdote en aperçu) pour garder l'effet de découverte.
- **Agenda** : fiche événement (titre, date, horaires, lieu, description, visuel, délégation, capacité),
  « Je participe » / « Je ne participe pas », places restantes en temps réel, blocage quand c'est complet,
  **liste d'attente** automatique, désistement, liste des participants réservée aux animateurs et au-dessus,
  **exports CSV et Excel**.
- **Chabbat** : Marseille, Paris, Nice, Lyon (villes et identifiants GeoNames modifiables), calcul Hebcal selon la date
  et le fuseau Europe/Paris (changements d'heure inclus), **message clair si l'API est indisponible** — aucune heure inventée —
  et cache 6 h pour le hors ligne. Paracha de la semaine + texte explicatif programmable.
- **Contenus quotidiens** : mot du jour (indice, saisie, révélation), carte du jour (programmable + rotation automatique),
  anecdotes (programmables par date), quiz avec score. Calendrier de programmation dans l'admin.
- **Administration** : 4 rôles (administrateur, responsable, animateur, membre), autorisations appliquées **dans les règles
  Firestore**, gestion des événements, inscriptions, actualités, cartes, mots, carte du jour, anecdotes, quiz, paracha,
  membres et rôles, probabilités des boosters, paramètres Chabbat, notifications.

---

## 2. Mise en ligne (10 minutes)

1. **Sauvegarde** : sur GitHub, note le commit actuel (tu peux revenir en arrière à tout moment).
2. **Dépose les fichiers** de ce dossier à la racine du dépôt `ederyevi-dot/dejj-community`
   (remplace `index.html`, `styles.css`, `app.js`, `seed.js`, `sw.js`, `manifest.webmanifest`, `firestore.rules`,
   et ajoute les images : `logo-flame.png`, `logo-tagline.png`, `icon-192.png`, `icon-512.png`, `icon-maskable.png`, `crest-emblem.jpg`).
   ⚠️ **Ne touche pas à `firebase-config.js`** : il est conservé tel quel.
3. Attends 1 à 2 minutes (GitHub Pages reconstruit), puis ouvre <https://ederyevi-dot.github.io/dejj-community/>
   et **recharge avec Ctrl+Maj+R** (ou vide le cache) : le service worker passe en `dejj-v5`.
4. **Règles Firestore** : Firebase Console → Firestore Database → Règles → colle le contenu de `firestore.rules` → **Publier**.
   Sans cette étape, les nouvelles fonctions (noms protégés, compteurs, journal des boosters) sont refusées.
5. **Créer les index composite** : aucun n'est nécessaire (l'application a été écrite pour éviter les index composites).
6. **Premier administrateur** : connecte-toi une fois avec ton compte, puis dans Firestore →
   `users` → ton document → champ `role` = `admin`. (Ensuite, tout se gère depuis Admin → Membres & rôles.)
7. **Importer le contenu de départ** : Admin → **Cartes** → « Importer le contenu de départ » (33 cartes),
   puis Admin → Mot du jour → « Importer le contenu de départ » (14 mots), idem pour Anecdotes et Quiz.
8. **Photos** : dépose les fichiers des animateurs à la racine du dépôt avec **exactement** ces noms
   (ou renseigne un autre chemin dans l'admin) :
   `animateur-boucles.jpg`, `animatrice-crepes.jpg`, `animateur-casquette.jpg`, `animatrice-lunettes.jpg`.
   L'écran affiche des initiales en attendant — **aucune image générée par IA n'est utilisée à la place d'une personne**.
9. **Vérifications après déploiement** (5 minutes) :
   - accueil : carte du jour, mot du jour, horaires de Chabbat du jour ;
   - agenda : créer un événement limité à 2 places, s'inscrire avec 2 comptes, vérifier « Complet » puis la liste d'attente ;
   - booster : ouvrir une fois, vérifier que le bouton disparaît le lendemain seulement, vérifier le `×2` sur un doublon ;
   - admin → inscriptions : export CSV et Excel ;
   - téléphone : installer via « Ajouter à l'écran d'accueil ».

---

## 3. Mode démo (pour tester sans toucher aux données réelles)

Ajoute `?demo=1` à l'adresse : `…/index.html?demo=1`.
Toutes les données restent dans ton navigateur (aucune connexion Firebase). Deux comptes de test :
**Membre** et **Administrateur**. Un bandeau orange rappelle qu'on est en démo ; « réinitialiser » remet les données à zéro.
C'est l'outil idéal pour montrer l'application ou tester une modification sans risque.

---

## 4. Données à compléter (je n'invente rien)

| À compléter | Où | Remarque |
|---|---|---|
| Noms des 4 animateurs | Admin → Cartes (4 fiches « À compléter ») | l'anecdote et la photo restent attachées à la bonne fiche |
| Année d'arrivée de l'animateur aux cheveux bouclés | Admin → Cartes → « Année d'arrivée » | sans date confirmée, le badge indique « À confirmer » |
| Photos des 4 animateurs | dépôt GitHub ou champ Photo | photos d'origine, jamais retouchées |
| Validation des 14 fiches La Saga | Admin → Cartes → décocher « à valider » | textes repris de dejjlasaga.com, à relire avant diffusion |
| Droits des photos historiques | — | autorisation à obtenir avant d'ajouter les portraits |
| Parachas | Admin → Paracha | le nom doit correspondre à Hebcal (ex. `Vayishlach`) |
| Notifications push (facultatif) | Admin → Boosters & réglages → clé VAPID | voir § 6 |

Pour les cartes historiques, les photos des fondateurs ne sont **pas** incluses (droits) : la carte fonctionne avec
les initiales tant qu'aucune photo autorisée n'est fournie.

---

## 5. Rôles et données personnelles

| Rôle | Peut |
|---|---|
| **Membre** | voir les contenus, s'inscrire aux événements, ouvrir son booster, remplir son album, gérer son profil |
| **Animateur** | + voir les listes de participants et les noms |
| **Responsable** | + créer/modifier événements et contenus, exporter CSV/Excel |
| **Administrateur** | tout : cartes, probabilités, membres et rôles, paramètres |

- Chaque membre ne lit que **son** profil et **sa** collection ; les autres membres ne voient que des **compteurs**
  (jamais les noms) ; les noms sont dans une sous-collection `names` lisible uniquement par les animateurs et au-dessus.
- Le rôle ne peut jamais être modifié par le membre lui-même : la règle Firestore l'interdit.
- Les exports contiennent des données personnelles : usage interne, à ne pas diffuser.
  Le guide « Règles & limites » dans l'admin le rappelle.

---

## 6. Gratuit / payant (transparence)

| Élément | Coût | Remarque |
|---|---|---|
| GitHub Pages | **0 €** | hébergement du site |
| Firebase Authentication + Cloud Firestore + Security Rules | **0 €** dans l'offre Spark | quotas quotidiens (≈50 000 lectures/jour, 20 000 écritures/jour) : largement suffisant pour une communauté |
| Hebcal (horaires, paracha) | **0 €** | API libre, sans clé |
| Firebase Storage (upload des photos depuis l'admin) | gratuit dans le quota Spark, puis **plan Blaze payant** | désactivé par défaut ; alternative 0 € : déposer les photos dans le dépôt |
| Notifications **dans l'application** (cloche, rappels J-7/J-3/jour J) | **0 €** | calculées dans l'app, aucune configuration |
| Notifications **push** (application fermée) | FCM gratuit, **envoi programmé = Cloud Functions** (plan Blaze, quelques centimes à quelques € / mois) ou petit serveur | nécessite en plus la clé VAPID et l'accord du membre |
| Export Excel | **0 €** | fichier `.xls` (tableur HTML) généré dans le navigateur, ouvert par Excel/LibreOffice/Sheets |

**Sécurité du booster** : le tirage et le quota sont vérifiés côté serveur (transaction Firestore + journal
`boosters/{uid}_{jour}` + règles). Une seconde ouverture le même jour est refusée, même sur un autre appareil.
Limite honnête : le tirage lui-même est calculé dans le navigateur (aucune Cloud Function) — un utilisateur qui inspecte
son propre code peut connaître les probabilités, ce qui n'a aucune valeur marchande. Pour un tirage totalement aveugle,
il faudrait une Cloud Function (plan Blaze).

---

## 7. Ajouter une carte (sans toucher au code)

Admin → **Cartes** → remplir : Nom, Surnom/totem, Fonction, Catégorie, **Anecdote (obligatoire)**, Parcours
(une étape par ligne : `2019 : Animatrice`), Année d'arrivée au DEJJ, Citation éventuelle, Rareté, Collection,
Ordre, Photo, Cadrage (`50% 22%`), Zoom, Source, Publiée, Tirable dans les boosters.

La carte se construit automatiquement dans l'ordre imposé : **anecdote → parcours → ancienneté**.
Le bouton « Aperçu » ouvre le rendu final avant publication.

---

## 8. Fichiers livrés

```
index.html              · structure (logo officiel, navigation, PWA)
styles.css              · design complet + cartes TCG + responsive
app.js                  · application (routing, Firebase, admin, mode démo)
seed.js                 · contenu de départ (La Saga, animateurs, souvenirs, mots, quiz)
firestore.rules         · règles de sécurité (à publier dans la console)
sw.js                   · service worker (hors ligne, notifications)
manifest.webmanifest    · installation sur téléphone
firebase-config.js      · INCHANGÉ (ne pas modifier)
logo-flame.png          · logo officiel (flamme bleue)
logo-tagline.png        · logo officiel + « Un mouvement pour tous »
icon-192/512/maskable   · icônes d'installation
crest-emblem.jpg        · écusson décoratif de la collection (aucune personne)
edgar-guedj.jpg         · photo d'origine déjà présente dans le dépôt
```

---

## 9. Points de vigilance

- Si Hebcal est injoignable (réseau, hors ligne), l'application affiche **« horaires indisponibles »** et propose de
  réessayer : elle n'affiche jamais une heure approximative.
- Les probabilités du booster sont **proportionnelles** : si l'admin saisit 60/28/9/3, le total est normalisé automatiquement.
- Une carte retirée des boosters (`Tirable dans les boosters` décoché) reste visible dans La Saga mais ne sort plus des paquets.
- Les cartes « Souvenirs » (objets génériques : gourde, bus du départ…) sont fictives mais ne représentent **aucune personne** ;
  libre à toi de les supprimer (Admin → Cartes → Supprimer) si tu ne veux que des fiches réelles.


---

## 10. Aperçus (captures de l'application)

Dans le dossier `apercus/` livré à côté du projet :

- `carte-legendaire.png` — carte Edgar Guedj ouverte en grand (anecdote → parcours → ancienneté) ;
- `la-saga.png` — collection historique sur ordinateur ;
- `accueil.png` — page d'accueil complète ;
- `booster.png` — résumé d'ouverture de booster ;
- `mobile-album.png` — album sur téléphone (390 px).

Ces captures ont été prises **en mode démo** (`?demo=1`), donc sans aucune donnée réelle de membre.


## Correctifs appliqués à l'archive V5 (préparation)
- Ajout des quatre photos originales fournies, copiées sans recadrage ni retouche :
  - animateur-boucles.jpg
  - animatrice-crepes.jpg
  - animateur-casquette.jpg
  - animatrice-lunettes.jpg
- Ajout de logo-tagline.png à partir du logo-flame.png fourni et de la signature « Un mouvement pour tous ».
- Correction de l'ouverture du booster : le journal, la date du dernier booster et les cartes de la collection sont maintenant écrits dans une seule transaction Firestore (au lieu de lancer un batch séparé depuis la transaction).
- Renforcement des règles des noms de participants et séparation des règles de création/mise à jour des compteurs.
- firebase-config.js est conservé strictement à l'identique.

Avant publication : tester avec un compte membre et un compte animateur/responsable, vérifier les inscriptions et un booster, puis publier les nouvelles règles Firestore.


## Évolutions V6 préparées
- Ajout d'une rubrique « Infos & dons » : tranches d'âge REDEF/Pionniers/JAC, séjour ski annoncé du 21 au 28 février 2027 et lien vers la page de dons officielle.
- Ajout d'un accès vers la liste officielle des événements DEJJ.
- Album : vue complète réservée au rôle administrateur ; les membres voient leur collection personnelle de cartes obtenues.
- Suppression de l'affichage des initiales dans les cartes ; une mention neutre « Photo à ajouter » apparaît si la fiche n'a pas encore de photo.
- Palette plus sobre, contrastes simplifiés, suppression des rotations décoratives des blocs et boutons.
- Les portraits historiques de La Saga ne sont pas tous fournis par les pages publiques consultées. Ne pas attribuer une photo de groupe à une personne. Compléter les portraits manquants après validation des images et de leur droit de réutilisation.


## Correctifs V7

- L’agenda de l’application est limité aux événements dont le lieu ou la délégation indique Marseille. Les séjours nationaux et formations (Maayan, BAFA, etc.) ne sont pas affichés dans l’agenda local.
- Les membres conservent la limite d’un booster quotidien. Le compte administrateur peut ouvrir autant de boosters qu’il le souhaite.
- Pour activer cette dernière règle, il faut également publier le fichier `firestore.rules` dans Firebase (Firestore Database → Règles → Publier).
- Aucune image générée par IA n’est ajoutée. Les cartes sans photo d’archive identifiée restent signalées « Photo à ajouter » jusqu’à réception/intégration d’une vraie photo.
