# Marco — Patch v0.4.9 Tracklist plus basse

Patch minimal pour descendre encore la tracklist de la page Composition, sans toucher aux PNG, au shader ou à la Home.

## Application locale sans push

```bash
cd "/d/Users/owner/Documents/AUTO-ENTREPRISE/Perso/Ying/1_Marco_git"
py "/d/Téléchargement/Marco_PATCH_v0.4.9_tracklist_lower/apply_patch.py"
```

## Test localhost

```bash
cd "/d/Users/owner/Documents/AUTO-ENTREPRISE/Perso/Ying/1_Marco_git" && py -m http.server 5173
```

Puis ouvrir :

```txt
http://localhost:5173/composition.html?v=test
```

## Push après validation visuelle

```bash
cd "/d/Users/owner/Documents/AUTO-ENTREPRISE/Perso/Ying/1_Marco_git"
bash "/d/Téléchargement/Marco_PATCH_v0.4.9_tracklist_lower/push_local_to_remote.sh"
```
