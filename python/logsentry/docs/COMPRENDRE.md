# Fonctionnement de LogSentry

LogSentry analyse un fichier CSV de connexions et signale certaines séquences suspectes. Les résultats sont affichés dans le terminal et peuvent être exportés en HTML ou en JSON.

## Organisation du code

- `__main__.py` : lecture des arguments et lancement de l'analyse.
- `core.py` : validation du CSV et détection des séquences suspectes.
- `report.py` : génération des rapports.
- `template.html` : mise en page du rapport HTML.

## Lecture des données

La fonction `read_events()` transforme chaque ligne du CSV en objet `Event`, qui contient :

- la date et l'heure ;
- l'adresse IP ;
- le nom d'utilisateur ;
- le résultat de la connexion : `success` ou `failure`.

Les données sont validées avant l'analyse. Les dates sont converties en UTC, puis les événements sont traités dans l'ordre chronologique.

## Détection

Par défaut, le seuil est fixé à 5 échecs sur une fenêtre de 5 minutes.

Deux règles sont appliquées :

1. **Rafale d'échecs** : une même IP atteint le seuil, sur un ou plusieurs comptes. Le rapport conserve la fenêtre contenant le plus d'échecs pour cette IP.
2. **Succès après plusieurs échecs** : une connexion réussit après le seuil d'échecs pour le même couple IP/utilisateur, dans la fenêtre configurée et depuis son dernier succès.

Les échecs sont stockés dans des files `deque`. À chaque événement, les entrées trop anciennes sont retirées. Les deux bornes de la fenêtre sont incluses.

Le dictionnaire `by_ip` regroupe les échecs par adresse IP. `by_user` les regroupe par couple IP/utilisateur.

Un succès vide la file du couple concerné, sans effacer les échecs globaux de l'IP.

## Lancer la démo

```bash
python -m logsentry --demo
```

Modifier les paramètres :

```bash
python -m logsentry --demo --threshold 3 --window 10
```

Créer un rapport HTML :

```bash
python -m logsentry --demo --html reports/demo.html
```

Si le rapport existe déjà, choisir un autre nom de fichier.

## Tests

```bash
python -m unittest discover -s tests -v
```

Les tests vérifient les règles de détection, les limites de temps, la validation du CSV et la génération des rapports.

## Limites

Les alertes reposent sur des règles simples : elles ne prouvent pas qu'une intrusion a eu lieu. Les tentatives lentes ou réparties sur plusieurs IP peuvent ne pas être détectées.

L'analyse porte sur un fichier chargé en mémoire. Elle ne surveille pas les connexions en temps réel.