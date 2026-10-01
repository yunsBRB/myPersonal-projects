"""Lecture du CSV et détection : uniquement la bibliothèque standard."""

import csv
from collections import Counter, defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from ipaddress import ip_address
from pathlib import Path


@dataclass(frozen=True)
class Event:
    timestamp: datetime
    ip: str
    username: str
    status: str


def read_events(path: Path) -> list[Event]:
    """Valide tout le fichier. Une ligne invalide interrompt l'analyse."""
    events = []
    required = {"timestamp", "ip", "username", "status"}
    with path.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream, strict=True)
        try:
            headers = reader.fieldnames
            if not headers or not required.issubset(headers):
                raise ValueError("Colonnes requises : timestamp,ip,username,status")
            if len(headers) != len(set(headers)):
                raise ValueError("Le fichier contient des colonnes en double.")
            for row in reader:
                try:
                    if None in row or any(value is None for value in row.values()):
                        raise ValueError("nombre de champs incorrect")
                    values = {key: row[key].strip() for key in required}
                    if not all(values.values()):
                        raise ValueError("un champ obligatoire est vide")
                    timestamp = datetime.fromisoformat(
                        values["timestamp"].replace("Z", "+00:00")
                    )
                    if timestamp.tzinfo is None or timestamp.utcoffset() is None:
                        raise ValueError("l'horodatage doit inclure Z ou un décalage horaire")
                    address = str(ip_address(values["ip"]))
                    if values["status"] not in {"success", "failure"}:
                        raise ValueError("status doit être success ou failure")
                    if any(ord(char) < 32 or ord(char) == 127 for char in values["username"]):
                        raise ValueError("username contient un caractère de contrôle")
                    events.append(Event(
                        timestamp.astimezone(timezone.utc), address,
                        values["username"], values["status"],
                    ))
                except ValueError as error:
                    raise ValueError(f"Ligne {reader.line_num} : {error}") from error
        except csv.Error as error:
            raise ValueError(f"CSV invalide vers la ligne {reader.line_num} : {error}") from error
    return events


def _date(value: datetime) -> str:
    return value.isoformat().replace("+00:00", "Z")


def _trim(queue: deque, cutoff: datetime) -> None:
    # On conserve la borne exacte : une fenêtre de 5 minutes inclut ses extrémités.
    while queue and queue[0].timestamp < cutoff:
        queue.popleft()


def analyze(events: list[Event], threshold: int = 5, window_minutes: int = 5) -> dict:
    """Repère les rafales d'échecs et certains succès qui les suivent.

    Une seule alerte de rafale par IP : sa fenêtre avec le plus d'échecs.
    Un succès suspect nécessite le seuil d'échecs du MÊME utilisateur et de
    la MÊME IP dans la fenêtre précédente, depuis son dernier succès.
    """
    if type(threshold) is not int or threshold < 2:
        raise ValueError("Le seuil doit être un entier supérieur ou égal à 2.")
    if type(window_minutes) is not int or not 1 <= window_minutes <= 1440:
        raise ValueError("La fenêtre doit être un entier entre 1 et 1440 minutes.")

    ordered = sorted(events, key=lambda event: event.timestamp)
    window = timedelta(minutes=window_minutes)
    by_ip = defaultdict(deque)
    by_user = defaultdict(deque)
    peaks = {}
    alerts = []
    totals = defaultdict(Counter)

    for event in ordered:
        totals[event.ip][event.status] += 1
        ip_queue = by_ip[event.ip]
        user_queue = by_user[(event.ip, event.username)]
        cutoff = event.timestamp - window
        _trim(ip_queue, cutoff)
        _trim(user_queue, cutoff)

        if event.status == "failure":
            ip_queue.append(event)
            user_queue.append(event)
            previous_count = peaks.get(event.ip, {}).get("failed_attempts", 0)
            if len(ip_queue) >= threshold and len(ip_queue) > previous_count:
                peaks[event.ip] = {
                    "kind": "failure_burst", "severity": "warning",
                    "ip": event.ip,
                    "users": sorted({item.username for item in ip_queue}),
                    "failed_attempts": len(ip_queue),
                    "started_at": _date(ip_queue[0].timestamp),
                    "ended_at": _date(event.timestamp),
                }
        else:
            if len(user_queue) >= threshold:
                alerts.append({
                    "kind": "success_after_failures", "severity": "high",
                    "ip": event.ip, "users": [event.username],
                    "failed_attempts": len(user_queue),
                    "started_at": _date(user_queue[0].timestamp),
                    "ended_at": _date(event.timestamp),
                })
            # Un succès termine la série de ce couple IP/utilisateur.
            user_queue.clear()

    alerts.extend(peaks.values())
    alerts.sort(key=lambda alert: (
        0 if alert["severity"] == "high" else 1,
        datetime.fromisoformat(alert["ended_at"].replace("Z", "+00:00")), alert["ip"],
    ))
    failed = sum(event.status == "failure" for event in ordered)
    ip_stats = [
        {"ip": address, "failure": counts["failure"], "success": counts["success"]}
        for address, counts in totals.items()
    ]
    ip_stats.sort(key=lambda item: (-item["failure"], item["ip"]))
    return {
        "schema_version": 1,
        "settings": {"threshold": threshold, "window_minutes": window_minutes},
        "summary": {
            "total": len(ordered), "success": len(ordered) - failed,
            "failure": failed, "unique_ips": len(totals), "alert_count": len(alerts),
            "started_at": _date(ordered[0].timestamp) if ordered else None,
            "ended_at": _date(ordered[-1].timestamp) if ordered else None,
        },
        "alerts": alerts,
        "ip_stats": ip_stats,
    }
