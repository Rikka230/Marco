# MARCO PATCH v0.4.9 — Composition Tracklist Lowering

## Cible
Page Composition uniquement, ajustement de position de la tracklist.

## Base de travail
Patch conçu pour être appliqué après le patch v0.4.8 validé visuellement.

## Modifications appliquées
- Descente supplémentaire de la tracklist Composition.
- Réduction maîtrisée de la hauteur du viewport pour éviter de tomber dans le mini-player/bas de page.
- Conservation du vrai scroll vertical.
- Conservation du blocage du scroll horizontal.
- Conservation du fondu haut/bas et de la scrollbar verticale stylée.
- Cache-bust CSS de `composition.html` passé en `v=0.4.9`.
- Badge de version passé en `MARCO v0.4.9`.

## Fichiers modifiés
- `composition.html`
- `style.css`
- `PATCH_VERSION.md`
- `README.md`

## Non modifié volontairement
- `index.html`
- `assets/img/marco-home.png`
- Shader/personnage Marco
- Assets PNG
