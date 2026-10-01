import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from logsentry.core import Event, analyze, read_events


BASE = datetime(2026, 9, 8, 8, tzinfo=timezone.utc)


def event(seconds=0, status="failure", ip="203.0.113.42", username="admin"):
    return Event(BASE + timedelta(seconds=seconds), ip, username, status)


class DetectionTests(unittest.TestCase):
    def test_exact_threshold_triggers_one_burst(self):
        result = analyze([event(i * 30) for i in range(5)])
        self.assertEqual(result["alerts"][0]["failed_attempts"], 5)
        self.assertEqual(result["summary"]["alert_count"], 1)

    def test_below_threshold_does_not_trigger(self):
        self.assertEqual(analyze([event(i) for i in range(4)])["alerts"], [])

    def test_time_window_includes_exact_boundary(self):
        result = analyze([event(0), event(300)], threshold=2)
        self.assertEqual(result["summary"]["alert_count"], 1)

    def test_events_outside_window_do_not_accumulate(self):
        self.assertEqual(analyze([event(0), event(301)], threshold=2)["alerts"], [])

    def test_sliding_window_crosses_clock_boundaries(self):
        result = analyze([event(299), event(301)], threshold=2, window_minutes=1)
        self.assertEqual(len(result["alerts"]), 1)

    def test_keeps_strongest_window_and_its_users(self):
        events = [event(0), event(1)] + [event(600 + i, username="root") for i in range(4)]
        alert = analyze(events, threshold=2)["alerts"][0]
        self.assertEqual(alert["failed_attempts"], 4)
        self.assertEqual(alert["users"], ["root"])

    def test_ip_addresses_are_independent(self):
        result = analyze([event(0), event(1, ip="192.0.2.1")], threshold=2)
        self.assertEqual(result["alerts"], [])

    def test_success_after_failures_creates_high_alert(self):
        result = analyze([event(i) for i in range(5)] + [event(5, "success")])
        self.assertEqual([a["kind"] for a in result["alerts"]],
                         ["success_after_failures", "failure_burst"])
        self.assertEqual(result["summary"]["success"], 1)

    def test_success_of_another_user_is_not_high_alert(self):
        result = analyze([event(i) for i in range(5)] + [event(5, "success", username="alice")])
        self.assertEqual([a["kind"] for a in result["alerts"]], ["failure_burst"])

    def test_success_from_another_ip_is_not_high_alert(self):
        result = analyze([event(i) for i in range(5)] + [event(5, "success", ip="192.0.2.1")])
        self.assertEqual([a["kind"] for a in result["alerts"]], ["failure_burst"])

    def test_late_success_is_not_high_alert(self):
        result = analyze([event(i) for i in range(5)] + [event(600, "success")])
        self.assertEqual([a["kind"] for a in result["alerts"]], ["failure_burst"])

    def test_success_resets_user_failures(self):
        events = [event(0), event(1), event(2, "success"), event(3), event(4, "success")]
        high = [a for a in analyze(events, threshold=2)["alerts"] if a["severity"] == "high"]
        self.assertEqual(len(high), 1)

    def test_input_order_does_not_change_result_for_distinct_times(self):
        events = [event(i) for i in range(5)] + [event(5, "success")]
        self.assertEqual(analyze(events), analyze(list(reversed(events))))

    def test_ties_preserve_csv_order(self):
        first = [event(), event(), event(status="success")]
        last = [event(status="success"), event(), event()]
        self.assertEqual(analyze(first, threshold=2)["summary"]["alert_count"], 2)
        self.assertEqual(analyze(last, threshold=2)["summary"]["alert_count"], 1)

    def test_empty_input(self):
        result = analyze([])
        self.assertEqual(result["summary"]["total"], 0)
        self.assertIsNone(result["summary"]["started_at"])
        self.assertEqual(result["alerts"], [])

    def test_invalid_configuration(self):
        for settings in ({"threshold": 1}, {"threshold": 2.5}, {"window_minutes": 0},
                         {"window_minutes": 1441}, {"threshold": True}):
            with self.subTest(settings=settings), self.assertRaises(ValueError):
                analyze([], **settings)


class CSVTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "events.csv"

    def read(self, content):
        self.path.write_text(content, encoding="utf-8")
        return read_events(self.path)

    def test_bom_timezone_and_ipv6_normalization(self):
        events = self.read("\ufefftimestamp,ip,username,status\n"
                           "2026-09-08T10:00:00+02:00,2001:db8:0:0::1,alice,success\n")
        self.assertEqual(events[0].timestamp, BASE)
        self.assertEqual(events[0].ip, "2001:db8::1")

    def test_quoted_username_and_extra_column(self):
        events = self.read('timestamp,ip,username,status,app\n'
                           '2026-09-08T08:00:00Z,192.0.2.1,"Doe, Jane",success,web\n')
        self.assertEqual(events[0].username, "Doe, Jane")

    def test_header_only_is_valid(self):
        self.assertEqual(self.read("timestamp,ip,username,status\n"), [])

    def test_missing_or_duplicate_headers(self):
        for content in ("", "ip,status\n", "timestamp,ip,username,status,status\n"):
            with self.subTest(content=content), self.assertRaises(ValueError):
                self.read(content)

    def test_invalid_rows_include_line_number(self):
        rows = [
            "2026-09-08T08:00:00,192.0.2.1,admin,failure",
            "bad-date,192.0.2.1,admin,failure",
            "2026-09-08T08:00:00Z,999.0.0.1,admin,failure",
            "2026-09-08T08:00:00Z,192.0.2.1,admin,FAILED",
            "2026-09-08T08:00:00Z,192.0.2.1,,failure",
            "2026-09-08T08:00:00Z,192.0.2.1,admin",
            "2026-09-08T08:00:00Z,192.0.2.1,admin,failure,extra",
            "2026-09-08T08:00:00Z,192.0.2.1,admin\x1b[31m,failure",
        ]
        for row in rows:
            with self.subTest(row=row), self.assertRaisesRegex(ValueError, "Ligne 2"):
                self.read("timestamp,ip,username,status\n" + row + "\n")

    def test_malformed_csv_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "CSV invalide"):
            self.read('timestamp,ip,username,status\n"unfinished')


if __name__ == "__main__":
    unittest.main()
