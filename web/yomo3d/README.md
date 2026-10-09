# YOMO 3D

**Des lieux réels, une nouvelle manière de les découvrir.**

YOMO 3D prépare des photos et des vidéos de lieux pour une reconstruction 3D fidèle. La plateforme cible d'abord les hébergements (**YomoBNB**) et les restaurants (**YomoResto**). Les calculs 3D sont isolés de l'application web.

> **Statut : fondation v0.1.** L'authentification, les projets, l'import sécurisé, le stockage privé et le prétraitement sont implémentés et testés. La reconstruction GPU dispose d'un adaptateur expérimental **non validé sur GPU réel**. Le viewer, les partages publics et l'export vidéo depuis une scène reconstruite ne sont **pas implémentés**. Il n'y a ni faux modèle, ni faux rendu.

## Interface actuelle

Le code source des templates est disponible dans ce dossier. Les quatre captures d'écran réelles de la version locale restent dans l'archive d'origine et ne sont pas encore publiées sur GitHub. Aucune capture ne représente une reconstruction 3D.

## Ce qui fonctionne

- Compte utilisateur, connexion et déconnexion ; mots de passe Argon2 ; sessions en base et cookies HttpOnly.
- Isolation des projets, rôles implicites de propriétaire, contrôle CSRF sur toutes les écritures authentifiées.
- Création et suppression de projets BNB / RESTO ; nettoyage des médias associés.
- Upload multi-fichiers avec progression, contrôle de la taille, inspection réelle des octets JPEG/PNG/WebP et des vidéos MP4/MOV/WebM via FFprobe, déduplication SHA-256.
- Téléchargement protégé par vérification du propriétaire ; médias stockés hors de l'arborescence publique.
- File de tâches persistée, worker séparé, extraction FFmpeg, normalisation des images, erreurs et statuts explicites.
- Sans GPU : `waiting_gpu`, jamais `completed`. Si moins de huit vues : `needs_media`.

## Ce qui ne fonctionne pas encore

- Reconstruction COLMAP/Splatfacto **non testée ici** : commandes intégrées dans `yomo/worker.py`, dépendantes d'un environnement CUDA correctement installé. Le pipeline devra être fiabilisé avec de vrais jeux de captures avant de déclarer la reconstruction opérationnelle.
- Visualisation de splats, visite publique, annotation, réalisation/export MP4 à partir d'une scène 3D : **planifiés**.
- Facturation, partage externe, stockage S3, PostgreSQL, orchestration Redis/Celery : **planifiés**.
- Vérification du flou, de la redondance et de la couverture visuelle : **pas encore implémentée**. Le seuil de huit vues est une condition minimale, pas une preuve de qualité.

## Lancer localement

Pré-requis : Python 3.11+ et FFmpeg/FFprobe dans le `PATH`.

```bash
python -m venv .venv
source .venv/bin/activate     # Windows : .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env         # Windows : copy .env.example .env
uvicorn yomo.app:app --reload
```

Ouvrir http://127.0.0.1:8000 puis créer un compte et un projet.

Dans un **second terminal**, après avoir activé le même environnement Python :

```bash
python -m yomo.worker --once  # traite une seule tâche
python -m yomo.worker         # écoute en boucle
```

Sans worker démarré, les jobs restent légitimement `queued`. Sans outils GPU, ils finissent en `waiting_gpu` (ou `needs_media`). Les fichiers sont sous `./data/private`, exclus de Git.

### Tests

```bash
pip install -r requirements-dev.txt
python -m pytest -q
python -m compileall -q yomo
```

Les tests utilisent une base SQLite et un stockage privés temporaires. Un test fabrique une vraie vidéo MP4 avec FFmpeg et vérifie l'extraction.

### Docker (configuration fournie, non testée ici)

```bash
docker compose up --build
```

La configuration compose emploie une seule instance web, un seul worker et un volume privé. Ce n'est pas une architecture de production multinœud.

## Architecture

```text
Browser (HTML/CSS/JS)
         |
         v
FastAPI web + REST   --->  SQLite (projets / comptes / sessions / jobs)
         |                     |
         v                     v
Private local media storage   Worker indépendant
                                |-- Pillow / FFmpeg (testés)
                                |-- COLMAP / Nerfstudio / Splatfacto (expérimental)
                                `-- PLY (pas encore visualisé)
```

La décision de démarrer par FastAPI et des templates légers, plutôt que Next.js et Prisma, réduit les dépendances et permet un parcours complet testé localement. Une migration vers Next.js et PostgreSQL reste possible en conservant les routes REST. Avant le multi-utilisateur en production, remplacer la file SQLite locale par une orchestration transactionnelle PostgreSQL/Redis avec leases et suivi des coûts.

Voir [architecture et schéma de données](docs/architecture/overview.md) et [pipeline de reconstruction](docs/reconstruction/pipeline.md).

## Configuration

| Variable | Fonction | Valeur de développement |
| --- | --- | --- |
| `YOMO_ENV` | `production` active les cookies `Secure` et HSTS | `development` |
| `YOMO_DATABASE_URL` | Connexion SQLAlchemy | `sqlite:///./data/yomo.db` |
| `YOMO_STORAGE_DIR` | Racine des médias privés | `./data/private` |
| `YOMO_MAX_IMAGE_MB` | Limite par photo | `20` |
| `YOMO_MAX_VIDEO_MB` | Limite par vidéo | `250` |
| `YOMO_ENABLE_GPU` | Autorise l'adaptateur GPU expérimental | `false` |
| `YOMO_GPU_TIMEOUT_SECONDS` | Délai maximal d'entraînement | `14400` |

**Ne pas déployer tel quel sur Internet.** En production il manque notamment une protection anti-brute-force distribuée, quotas et budgets GPU, stockage S3, PostgreSQL et migrations réelles, scans média renforcés, règles réseau, gestion du consentement et purge de rétention. Voir [checklist déploiement](docs/deployment/checklist.md).

## Roadmap

1. **Fondation** — comptes, projets, stockage, traitements indépendants. (Implémenté localement)
2. **Qualité des captures** — indicateurs de flou, recouvrement, données insuffisantes, meilleure sélection des frames. (À faire)
3. **Reconstruction réelle** — image Docker GPU, tests COLMAP/Splatfacto sur scènes de référence, métriques qualité/coût. (Adaptateur expérimental)
4. **Visite** — intégrer SuperSplat Viewer en lecture seule, PLY/SOG optimisé, accès autorisé, liens de partage à durée limitée. (À faire)
5. **Vidéo** — trajectoires de caméra, rendu déterministe et vérification du MP4 1080p. (À faire)
6. **Commercial** — devis manuels, offres BNB/Resto, hébergement premium, puis Stripe si la demande est validée. (À faire)

Détails dans [roadmap](docs/business/roadmap.md), [validation](docs/VALIDATION.md) et [contributions](CONTRIBUTING.md).

## Licence et droits

Ce dépôt est actuellement **propriétaire (tous droits réservés)** : consulter [LICENSE](LICENSE). Les outils tiers (COLMAP, Nerfstudio, SuperSplat Viewer) ont leurs propres licences. Les exemples photographiques ne sont pas incorporés ; les comptes et médias utilisés dans les captures sont fictifs. Pour tout média importé, l'utilisateur doit disposer des autorisations de captation et de diffusion nécessaires.
