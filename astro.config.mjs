import { defineConfig } from 'astro/config';

// Migration Marco : sortie 100% statique (compatible Firebase Hosting).
// publicDir = ./public (par defaut) ; ./public/assets pointe vers le dossier assets/
// historique (jonction) pour servir images/audio aux memes URLs absolues (/assets/...).
export default defineConfig({
  server: { port: 4321 },
  // Le routing par fichiers (src/pages/) remplace la table Routes + goTo() du PJAX.
});
