# Back-office Marco — mise en service

Back-office React (dossier `admin/`) pour gérer **en direct** les données du site :
demandes de booking entrantes (temps réel), contenu éditable (Violon, Composition,
Booking) et médias. Le site public reste 100 % statique : il lit Firestore **au build**
et se redéploie au clic sur **Publier**.

```
admin-marco.web.app  (React + Firebase Auth)  ──écrit──> Firestore
   • Demandes booking (temps réel)                          │
   • Contenu en brouillon ── bouton "Publier" ──> Worker ──> GitHub Actions
   • Médias ──> Storage                                     │  build (lit Firestore)
                                                            ▼  + deploy
marco-site-2f9aa.web.app  (Astro statique, rapide, SEO ok)
```

Tout le **code** est prêt et build sans erreur. Restent des actions **console** que toi
seul peux faire (compte, secrets). Le site fonctionne déjà sans rien activer : tant que
Firestore est vide, il affiche exactement le contenu actuel (fallback).

---

## A. Activer Firebase (console, ~10 min)

Projet : **marco-site** (https://console.firebase.google.com/project/marco-site).

1. **Firestore** → *Créer une base* → mode production → région `eur3` (Europe).
2. **Authentication** → *Commencer* → activer **E-mail/Mot de passe**.
3. **Authentication > Users** → *Ajouter un utilisateur* → ton email + mot de passe.
   C'est ton compte de connexion au back-office.
4. **Storage** → *Commencer* (mode production).
5. **Hosting** → *Ajouter un autre site* → id `marco-admin` (donne `marco-admin.web.app`).
6. **Paramètres du projet > Général > Tes applications** : si pas d'app Web, *Ajouter
   une app Web*. Note la config (`apiKey`, `appId`, …).
7. **Paramètres > Comptes de service** → *Générer une nouvelle clé privée* → télécharge
   le JSON (= service account). **Ne le committe jamais.**

## B. Déployer les règles de sécurité

```bash
firebase deploy --only firestore:rules,storage
```
(Règles déjà écrites : `firestore.rules`, `storage.rules` — bookings en création
publique validée, contenu/médias réservés à l'admin connecté.)

## C. Configurer le back-office et le déployer

1. `cd admin` puis crée `admin/.env.local` à partir de `admin/.env.example` :
   ```
   VITE_USE_EMULATOR=false
   VITE_FIREBASE_API_KEY=...        # depuis A.6
   VITE_FIREBASE_AUTH_DOMAIN=marco-site.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=marco-site
   VITE_FIREBASE_STORAGE_BUCKET=marco-site.appspot.com
   VITE_FIREBASE_APP_ID=...
   VITE_PUBLISH_ENDPOINT=           # rempli à l'étape E
   ```
2. `npm install` puis `npm run build`.
3. Lier la cible Hosting admin puis déployer :
   ```bash
   firebase target:apply hosting admin marco-admin
   firebase target:apply hosting site marco-site-2f9aa
   firebase deploy --only hosting:admin
   ```
   > Pour utiliser des cibles, transforme le bloc `"hosting"` de `firebase.json` en
   > tableau avec `"target": "site"` (site public) et un 2ᵉ objet
   > `{ "target": "admin", "public": "admin/dist", "rewrites": [{ "source": "**", "destination": "/index.html" }] }`.
   > Snippet prêt à coller en fin de ce fichier.

Connecte-toi sur `marco-admin.web.app` avec le compte créé en A.3.

## D. Brancher le formulaire public + lecture du contenu au build

Dans `.env` (racine, copié de `.env.example`) :
```
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_PROJECT_ID=marco-site
PUBLIC_FIREBASE_APP_ID=...
```
→ le formulaire de contact écrit alors dans `bookings` (visible en temps réel dans l'admin).

Pour que le **build** lise le contenu publié, le pipeline a besoin du service account
(étape E). En local sans secret, le build reste sur le contenu par défaut — c'est voulu.

## E. Pipeline "Publier" (rebuild auto au clic)

1. **GitHub** → repo Marco → *Settings > Secrets and variables > Actions* :
   - `FIREBASE_SERVICE_ACCOUNT` = contenu du JSON (A.7), sur une ligne.
   - `PUBLIC_FIREBASE_API_KEY`, `PUBLIC_FIREBASE_AUTH_DOMAIN`, `PUBLIC_FIREBASE_PROJECT_ID`, `PUBLIC_FIREBASE_APP_ID`.
   Le workflow `.github/workflows/deploy-site.yml` est déjà prêt.
2. **Cloudflare Worker** (déclencheur du bouton) : voir `publish-trigger/README.md`.
   Récupère l'URL du Worker → mets-la dans `admin/.env.local` (`VITE_PUBLISH_ENDPOINT`)
   → rebuild + redéploie l'admin (étape C.2-3).

Sans cette étape, le bouton Publier affiche la commande manuelle
`npm run build && firebase deploy --only hosting:site` — qui marche aussi.

---

## Développement local (optionnel)

- **Admin seule (UI)** : `cd admin && npm run dev` → http://localhost:4322
- **Avec données locales** : installer un JDK (Temurin) puis
  `firebase emulators:start --only auth,firestore,storage` et garder
  `VITE_USE_EMULATOR=true`. Crée un user de test dans l'UI émulateur (port 4000).
- **Site public** : `npm run dev` (port 4321) — utilise le contenu par défaut tant
  qu'aucun service account local n'est fourni.

## Sécurité (rappels)
- Le JSON service account et les `.env*` ne doivent jamais être commités (déjà gitignorés).
- Le compte admin est unique ; pour durcir, remplace `isAdmin()` dans `firestore.rules`
  par un test sur ton email exact.
- L'admin envoie `<meta robots noindex>` et n'est accessible que connecté.

## Snippet firebase.json (hosting 2 sites)
```json
"hosting": [
  {
    "target": "site",
    "public": "dist",
    "cleanUrls": true,
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  },
  {
    "target": "admin",
    "public": "admin/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
]
```
