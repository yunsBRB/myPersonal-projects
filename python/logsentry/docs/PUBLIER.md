# Travailler sur LogSentry

Le projet est regroupé dans `personal-projects/python/logsentry`. Depuis la racine du dépôt :

```sh
cd python/logsentry
python -m logsentry --demo
python -m unittest discover -s tests -v
```

Les changements se publient dans le dépôt `personal-projects`. Les données personnelles et rapports générés restent exclus par le `.gitignore` du projet. Ne pas créer de dépôt Git imbriqué dans ce dossier.
