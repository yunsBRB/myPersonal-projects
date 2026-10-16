# Reconstruction 3D — protocole et limites

## Capture attendue

Filmer lentement une trajectoire stable avec lumière homogène, parois riches en texture et recouvrement élevé entre prises ; éviter surfaces réfléchissantes, mouvement des personnes et changement du mobilier. Pour des photos, commencer avec 20 à 40 vues nettes **ou davantage selon la géométrie** ; ce n'est pas une garantie de reconstruction. Une unique photo ne suffit généralement pas à estimer la géométrie complète d'un intérieur.

## Pipeline réalisé localement

1. Upload via API, limite de taille et validation des octets par Pillow ou FFprobe.
2. Conservation du média d'origine dans un répertoire privé sous un nom aléatoire.
3. Job stocké en base, récupéré par un worker séparé.
4. Photos : normalisation de l'orientation et taille maximale 1600 × 1600 ; vidéo : FFmpeg extrait une image par seconde (limite 300).
5. Si moins de huit images, `needs_media`. **Ce compteur ne mesure ni qualité ni recouvrement.**
6. Si le GPU n'est pas activé, `waiting_gpu` ; aucune scène 3D ni vidéo n'est annoncée.

## Pipeline GPU expérimental, à valider

Préparer une machine Linux NVIDIA/CUDA avec COLMAP + FFmpeg + Nerfstudio. La commande `YOMO_ENABLE_GPU=true python -m yomo.worker` active les étapes :

```bash
ns-process-data images --data /captured-frames --output-dir /processed
ns-train splatfacto --output-dir /training --data /processed --vis tensorboard
ns-export gaussian-splat --load-config /training/.../config.yml --output-dir /export
```

Le code localise le `config.yml` de l'entraînement et vérifie qu'un PLY non vide est généré. **Ces commandes ne sont pas validées avec un GPU dans cet environnement** : des ajustements de compatibilité Nerfstudio, de qualité/VRAM et de paramètres caméra seront probablement nécessaires. Aucune garantie de reconstruction n'est implicite.

Les appels `subprocess` ne passent pas par un shell. Le worker doit tourner dans une sandbox/container sans réseau sortant non nécessaire et avec volume de travail limité, sous une identité sans privilèges. Les logs d'erreurs sont tronqués pour l'API.

## Scènes, rendu et vidéo : prochaines étapes

- **Visualisation :** SuperSplat Viewer auto-hébergé, contrôle d'accès au splat privé, puis export optimisé (PLY → SOG) avec vérification des versions. Ne pas exposer les fichiers 3D bruts publiquement par défaut.
- **Partage :** jeton par scène à durée de vie limitée, possibilité de révocation et politique explicite d'indexation.
- **MP4 :** trajectoire de caméra déterministe exportée frame par frame à 1920×1080 depuis le viewer ou un moteur de rendu compatible, assemblage FFmpeg, validation par FFprobe (codec, dimensions, durée). Un export est « réussi » seulement après création et contrôle du vrai fichier.
- **Évaluation :** au moins trois scènes consenties et documentées : petit logement, restaurant riche en texture et cas d'échec (surface brillante/recouvrement insuffisant). Mesurer taux de poses alignées, durée GPU, VRAM maximale, taille de PLY, artefacts visibles et stabilité sur mobile. Pas de score de photoréalisme inventé.

Références de commandes : https://docs.nerf.studio/quickstart/custom_dataset.html, https://docs.nerf.studio/nerfology/methods/splat.html et https://developer.playcanvas.com/user-manual/supersplat/viewer/.
