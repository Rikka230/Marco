# MARCO PATCH v0.4.5 — Actual Composition Fixes

Base utilisée : ZIP actuel fourni par Tony après v0.4.4.

But réel du patch :
- Corriger la liste diagonale Composition réellement visible sur la capture, pas seulement le drawer global.
- Supprimer le clipping des cartes / ombres de `Cinematic Strings`, `Red Cut`, `Glass Motif`, etc.
- Ajouter un shader rouge masqué sur Marco pour l’intégrer à l’univers Composition sans le repeindre entièrement en rouge.
- Remplacer `assets/img/marco-comp.png` par une version upscalée x2 avec alpha lissé pour atténuer l’effet escalier du cahier.
- Conserver la Home intacte côté layout et ne pas toucher `marco-home.png`.
- Garder un badge de version visible : `MARCO v0.4.5`.

Fichiers modifiés par le patch :
- `style.css`
- `composition.html`
- `assets/img/marco-comp.png`
- `contact.html`, `filmographie.html`, `gallery.html`, `music.html`, `parcours.html`, `projects.html` uniquement pour le cache-bust CSS `v=0.4.5`
- `PATCH_VERSION.md`

Fichier volontairement non modifié :
- `index.html`
- `assets/img/marco-home.png`
