# Contribuer à YOMO 3D

Les contributions externes sont soumises à autorisation du titulaire du dépôt. Ouvrir une issue décrivant le besoin, la reproduction et le comportement attendu avant une PR conséquente.

Pour le code Python : conserver des fonctions courtes, ne pas ajouter de secrets ni de médias personnels au dépôt, écrire un test reproduisant le bug et vérifier `pytest -q`. Chaque API doit maintenir l'isolation par propriétaire et le contrôle CSRF. Toute fonctionnalité GPU non testée doit rester identifiée comme expérimentale.
