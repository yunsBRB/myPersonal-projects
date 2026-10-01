"""Rapports autonomes : aucune ressource externe, aucun JavaScript."""

from html import escape
from pathlib import Path
from string import Template


LABELS = {
    "failure_burst": "Rafale d'échecs",
    "success_after_failures": "Connexion après plusieurs échecs",
}


def terminal_report(result: dict) -> str:
    summary = result["summary"]
    lines = [
        "LOGSENTRY | Analyse des connexions",
        "=" * 46,
        f"Tentatives : {summary['total']} | IP uniques : {summary['unique_ips']}",
        f"Réussites : {summary['success']} | Échecs : {summary['failure']}",
        f"Alertes : {summary['alert_count']}",
    ]
    for alert in result["alerts"]:
        level = "ÉLEVÉ" if alert["severity"] == "high" else "ATTENTION"
        lines.append(
            f"[{level}] {alert['ip']} : {LABELS[alert['kind']]} "
            f"({alert['failed_attempts']} échecs ; {', '.join(alert['users'])})"
        )
    if not result["alerts"]:
        lines.append("Aucune alerte selon les règles configurées.")
    return "\n".join(lines)


def html_report(result: dict, source_name: str) -> str:
    """Échappe les données du CSV avant de les insérer dans le HTML."""
    summary = result["summary"]
    cards = []
    for alert in result["alerts"]:
        high = alert["severity"] == "high"
        cards.append(
            f'<article class="alert {"high" if high else "warning"}">'
            f'<div class="alert-top"><span class="badge">'
            f'{"ÉLEVÉ" if high else "ATTENTION"}</span>'
            f'<code>{escape(alert["ip"])}</code></div>'
            f'<h3>{LABELS[alert["kind"]]}</h3>'
            f'<p>{alert["failed_attempts"]} échecs · '
            f'{escape(", ".join(alert["users"]))}</p>'
            f'<small>{escape(alert["started_at"])} → '
            f'{escape(alert["ended_at"])}</small></article>'
        )
    rows = []
    max_failures = max((item["failure"] for item in result["ip_stats"]), default=0)
    for item in result["ip_stats"]:
        width = round(item["failure"] / max_failures * 100) if max_failures else 0
        rows.append(
            f'<tr><td><code>{escape(item["ip"])}</code></td>'
            f'<td><div class="failure-cell"><span>{item["failure"]}</span>'
            f'<div class="track" aria-hidden="true"><i style="width:{width}%"></i>'
            f'</div></div></td><td>{item["success"]}</td></tr>'
        )
    rate = round(summary["failure"] / summary["total"] * 100) if summary["total"] else 0
    template = Template(Path(__file__).with_name("template.html").read_text(encoding="utf-8"))
    return template.substitute(
        source=escape(source_name), total=summary["total"], success=summary["success"],
        failure=summary["failure"], unique_ips=summary["unique_ips"],
        alert_count=summary["alert_count"], rate=rate,
        start=escape(summary["started_at"] or "Aucune donnée"),
        end=escape(summary["ended_at"] or "Aucune donnée"),
        threshold=result["settings"]["threshold"],
        window=result["settings"]["window_minutes"],
        alerts="".join(cards) or '<p class="empty">Aucune alerte selon les règles configurées.</p>',
        rows="".join(rows) or '<tr><td colspan="3">Aucune connexion dans le fichier.</td></tr>',
    )
