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

## Tester les animations

Ouvre `http://127.0.0.1:3000/test.html`, puis clique sur **Simuler un trophée**.
La simulation déclenche la LED et la barre sans modifier la progression RetroAchievements.

## Mode de comptage

Dans `.env`, utilise `MODE=hardcore` ou `MODE=softcore`.

## Personnalisation

Les couleurs se trouvent dans le bloc `:root` de `public/index.html`.

## Sécurité

Ne publie jamais le fichier `.env`. Il contient ta clé API.
