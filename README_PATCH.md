# Patch pages cover Marco Charlas-Hou

Ce patch remplace uniquement les fichiers HTML/CSS/JS. Il ne contient aucune image afin de préserver les assets actuels du projet.

Fichiers inclus :
- index.html
- music.html
- projects.html
- gallery.html
- contact.html
- style.css
- script.js

Objectif : réagencer toutes les pages dans la même logique que la home validée : cover plein écran, grand titre typographique, PNG devant le titre, blocs éditoriaux, visualizer en points et PJAX en glissement horizontal.

Lancement :
```bash
python -m http.server 5173
```
Puis ouvrir : http://localhost:5173

Important : le portrait cherche d'abord `assets/img/noa-day-portrait-cutout.png`, puis fallback sur `assets/img/noa-portrait-cutout.png`.
