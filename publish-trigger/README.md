# Déclencheur "Publier" (Cloudflare Worker)

Petit Worker gratuit qui relie le bouton **Publier** du back-office au workflow
GitHub Actions de redéploiement. Il vérifie que l'appelant est un admin Firebase
connecté, puis émet un `repository_dispatch` de type `publish`.

## Déploiement

```bash
cd publish-trigger
npm i -g wrangler              # ou npx wrangler ...
wrangler login                 # compte Cloudflare (gratuit)
wrangler secret put GITHUB_TOKEN      # PAT fine-grained : repo Marco, Contents = Read/write
wrangler secret put GITHUB_REPO       # ex. "ton-user/marco"
wrangler secret put FIREBASE_API_KEY  # Web API key du projet marco-site
wrangler deploy
```

`wrangler deploy` affiche l'URL du Worker (ex. `https://marco-publish-trigger.xxx.workers.dev`).
Mets cette URL dans l'admin : `admin/.env.local` → `VITE_PUBLISH_ENDPOINT=...`, puis rebuild l'admin.

## Sécurité
- Restreins `Access-Control-Allow-Origin` (dans `worker.js`) à l'URL exacte du back-office.
- Le PAT GitHub n'a que la permission Contents (read/write) sur le repo Marco.
