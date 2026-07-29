# Overlay RetroAchievements pour OBS

Affiche automatiquement le dernier jeu lancé, le nombre de succès obtenus et le total.

## Installation

1. Installe Node.js 18 ou plus récent.
2. Ouvre un terminal dans ce dossier.
3. Lance `npm install`.
4. Duplique `.env.example` et renomme la copie en `.env`.
5. Remplis ton pseudo et ta Web API Key RetroAchievements.
6. Lance `npm start`.
7. Dans OBS, ajoute une Source navigateur :
   - URL : `http://127.0.0.1:3000`
   - largeur : `900`
   - hauteur : `110`
   - FPS : `30`

## LED pour OBS

Une seconde source navigateur affiche une LED verte scintillante qui clignote en jaune lors de l'obtention d'un trophée :

- URL : `http://127.0.0.1:3000/led.html`
- largeur : `100`
- hauteur : `100`
- FPS : `60`

## Rencontres Pokémon Émeraude pour OBS

La troisième source navigateur lit la zone courante directement dans la RAM de
**Pokémon Version Émeraude (France)** avec le cœur **mGBA**, puis affiche les
Pokémon sauvages, leurs niveaux et leurs taux d’apparition :

- les noms des Pokémon sont affichés en `22 px` et mis en avant par rapport au
  nom du lieu afin de rester lisibles ;
- chaque Pokémon rencontré est accompagné de son sprite fixe ; les sprites,
  Poké Balls et cannes mesurent `32 × 32 px`, tandis que les niveaux, taux et
  titres de méthodes sont affichés en `16 px` ;
- la hauteur recommandée couvre le cas maximal des données actuelles : le
  Parc Safari — sud-est, avec 19 Pokémon répartis en 3 sections ;
- URL : `http://127.0.0.1:3000/emerald.html`
- largeur : `480`
- hauteur : `1000`
- FPS : `30`

Dans RetroArch, active **Paramètres > Réseau > Commandes réseau**. Le port par
défaut est `55355`. Si RetroArch tourne sur un autre ordinateur, renseigne
`RETROARCH_HOST` et `RETROARCH_PORT` dans `.env`.

La ROM française originale attendue possède le CRC32 `A3FDCCB1`. Une ROM
modifiée peut utiliser des cartes ou des tables de rencontres différentes.

## Équipe Pokémon Émeraude pour OBS

Cette source lit en direct les six emplacements de l’équipe sur une seule ligne
et affiche les sprites GBA, les noms ou surnoms, les états, les objets tenus et
les PV :

- les sprites des Pokémon sont affichés en `60 × 60 px` ;
- le nom est aligné à gauche au-dessus du sprite et son niveau apparaît juste à
  côté, avec des noms et des PV plus lisibles ;
- les cartes sont compactes et s’adaptent à leur contenu, avec un espacement
  identique au-dessus du nom et sous la barre de PV ;
- URL : `http://127.0.0.1:3000/team.html`
- largeur : `1516`
- hauteur : `148`
- FPS : `60`

L’emoji `📦` signale qu’un Pokémon tient un objet. Aucun statut n’est affiché
quand il est en bonne santé ; seules les altérations d’état et le K.O. ont une
icône.
Les icônes alternent leurs deux frames à 15 images/s pendant 5 secondes, puis
restent fixes pendant 25 secondes.

## Tester les animations

Ouvre `http://127.0.0.1:3000/test.html`, puis clique sur **Simuler un trophée**.
La simulation déclenche la LED et la barre sans modifier la progression RetroAchievements.
Cette page contient aussi les aperçus complets des rencontres et de l’équipe.
L’aperçu de l’équipe est régénéré aléatoirement à chaque actualisation.

## Mode de comptage

Dans `.env`, utilise `MODE=hardcore` ou `MODE=softcore`.

## Personnalisation

Les couleurs se trouvent dans le bloc `:root` de `public/index.html`.

## Sécurité

Ne publie jamais le fichier `.env`. Il contient ta clé API.
