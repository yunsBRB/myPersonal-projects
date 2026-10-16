# Vérifications v0.1

Environnement de contrôle : Python 3.13, FastAPI 0.128.2, FFmpeg présent, Chromium installé, pas de CUDA/Nerfstudio/COLMAP, pas de Docker, registre npm inaccessible.

## Réellement vérifié

- `PYTHONPATH=. python -m pytest -q` : **8 tests réussis** (sessions, auth, CSRF, séparation des comptes, upload image et vidéo, déduplication, rejet des fichiers invalides, suppression, création de jobs, prétraitement, attente du GPU, blocage de relance sans GPU).
- `python -m compileall -q yomo` : import/syntaxe Python valides.
- Page d'accueil : code HTTP 200 via Uvicorn en local.
- Captures des templates générées à partir des réponses HTML de l'application puis rendues hors réseau par Chromium/Playwright (ce ne sont pas des scènes 3D).
- Mise en page mobile à 390 px : largeur du document égale à celle du viewport, pas de défilement horizontal.

## Non vérifié / non implémenté

- Reconstitution 3D via COLMAP / Nerfstudio / Splatfacto : outils et GPU absents. L'adaptateur est expérimental.
- Viewer splat, liens publics, annotations, vidéo issue d'une scène : **non implémentés**.
- Création d'un vrai dépôt GitHub `yunsBRB/yomo3d` : **non effectuée** (connecteur sans création de repository).
- `docker compose up`: Docker absent.
- Compilation Next.js, tests TypeScript/Prisma : aucun composant Next/Prisma n'est livré dans cette première tranche.
- Tests de charge, de concurrence multi-workers et audit de sécurité externe : non réalisés.
