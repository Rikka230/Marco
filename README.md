# Marco Charlas-Hou — Site clean prototype

Projet statique propre pour le site artistique PJAX de Marco Charlas-Hou.

## Etat

Cette version est une base propre et complete, structuree pour la suite :

- home cover artistique ;
- pages internes : Music, Projects, Gallery, Contact ;
- pages prevues : About, Press Kit ;
- PJAX vanilla ;
- transitions en glissement ;
- visualizer en points ;
- contact form front-only ;
- arborescence assets rangee par univers ;
- schema de donnees JSON preparatoire ;
- fichiers Firebase placeholder ;
- dossier admin prototype.

## Lancer en local

```bash
cd marco_clean_project
py -m http.server 5173
```

Puis ouvrir :

```text
http://localhost:5173
```

## Arborescence

```text
assets/
  css/
  js/
  img/
    home/
    music/
    projects/
    gallery/
    contact/
    press/
    placeholders/
    source/
  audio/
  video/
  docs/
data/
admin/
```

## Pages

- `index.html`
- `music.html`
- `projects.html`
- `gallery.html`
- `contact.html`
- `about.html`
- `press-kit.html`

## Backend futur

Collections Firestore envisagees :

- `site_settings`
- `site_content`
- `music_tracks`
- `projects`
- `gallery_items`
- `press_assets`
- `contact_requests`

Storage envisage :

- `/site/home/`
- `/site/music/`
- `/site/projects/`
- `/site/gallery/`
- `/site/contact/`
- `/press/`
- `/audio/`
- `/video/`
- `/docs/`

## Note

Les images viennent du portfolio fourni dans la conversation et servent de base visuelle temporaire. Les vrais detourages PNG propres seront a injecter plus tard.
