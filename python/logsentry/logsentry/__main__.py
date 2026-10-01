"""Point d'entrée : python -m logsentry --demo."""

import argparse
import json
import sys
from pathlib import Path

from . import __version__
from .core import analyze, read_events
from .report import html_report, terminal_report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Analyse un CSV de connexions et signale des séquences suspectes."
    )
    parser.add_argument("file", nargs="?", type=Path, help="CSV à analyser")
    parser.add_argument("--demo", action="store_true", help="utiliser les données fictives incluses")
    parser.add_argument("--threshold", type=int, default=5, help="seuil d'échecs (défaut : 5, minimum : 2)")
    parser.add_argument("--window", type=int, default=5, help="fenêtre en minutes (1 à 1440, défaut : 5)")
    parser.add_argument("--html", type=Path, metavar="PATH", help="créer un rapport HTML")
    parser.add_argument("--json", type=Path, metavar="PATH", help="créer un rapport JSON")
    parser.add_argument("--fail-on-alert", action="store_true", help="retourner le code 1 si une alerte existe")
    parser.add_argument("--version", action="version", version=f"LogSentry {__version__}")
    args = parser.parse_args(argv)
    if bool(args.file) == args.demo:
        parser.error("Choisis un fichier CSV OU --demo.")
    source = Path(__file__).parent / "data" / "demo.csv" if args.demo else args.file
    try:
        destinations = [path for path in (args.html, args.json) if path is not None]
        if len({path.resolve() for path in destinations}) != len(destinations):
            raise ValueError("Les rapports HTML et JSON doivent avoir des chemins différents.")
        for destination in destinations:
            if destination.resolve() == source.resolve():
                raise ValueError("Un rapport ne peut pas remplacer le fichier source.")
            if destination.exists() or destination.is_symlink():
                raise ValueError(f"{destination} existe déjà. Choisis un nouveau nom de rapport.")

        result = analyze(read_events(source), args.threshold, args.window)
        exports = []
        if args.html is not None:
            exports.append((args.html, html_report(result, source.name)))
        if args.json is not None:
            exports.append((args.json, json.dumps(result, ensure_ascii=False, indent=2) + "\n"))
        for destination, content in exports:
            destination.parent.mkdir(parents=True, exist_ok=True)
            # Le mode x refuse également un fichier créé après la vérification.
            with destination.open("x", encoding="utf-8", newline="\n") as output:
                output.write(content)
        print(terminal_report(result))
        for destination, _ in exports:
            print(f"Rapport créé : {destination}")
        return 1 if args.fail_on_alert and result["alerts"] else 0
    except (OSError, ValueError, UnicodeError) as error:
        print(f"Erreur : {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
