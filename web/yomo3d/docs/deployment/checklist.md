# Conditions minimales avant un déploiement Internet

La version actuelle est destinée au développement local uniquement. Aucun déploiement n'a été effectué.

- [ ] Remplacer SQLite par PostgreSQL avec migrations versionnées (Alembic) et sauvegardes vérifiées.
- [ ] Remplacer le disque local par stockage S3 privé, chiffrement, URLs signées et purge des versions/sauvegardes.
- [ ] HTTPS systématique, reverse proxy avec taille maximale de requête et timeouts définis.
- [ ] Redis/Celery ou queue PostgreSQL avec leases, watchdog, idempotence, retries bornés, quotas GPU.
- [ ] Ajouter rate limiting distribué sur login/signup, vérification d'e-mail et réinitialisation de mot de passe.
- [ ] Antivirus/sandbox pour FFmpeg et décodeurs, contraintes CPU/RAM/stockage, monitoring et audit des dépendances.
- [ ] Validation d'autorisations complète sur les ressources dérivées, partages signés et révocables.
- [ ] Gestion de la suppression RGPD (données, médias, dérivés, snapshots), durée de conservation et accord sur droits à l'image.
- [ ] Politique cookies et confidentialité, mentions légales, CGU, contrats de sous-traitance.
- [ ] Vérifier la licence de chaque binaire, image, source 3D et musique avant commercialisation.
- [ ] Construire un jeu de données de référence consenti ; mesurer qualité, GPU et coût d'un projet typique.
- [ ] Vérifier la reprise après panne sur une base de test et l'absence de divulgation inter-comptes.
