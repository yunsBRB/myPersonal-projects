import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from logsentry.core import analyze
from logsentry.report import html_report
from test_core import event


ROOT = Path(__file__).resolve().parents[1]


class CLITests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)

    def run_cli(self, *arguments):
        return subprocess.run(
            [sys.executable, "-m", "logsentry", *map(str, arguments)],
            cwd=ROOT, capture_output=True, encoding="utf-8",
            env={**os.environ, "PYTHONIOENCODING": "utf-8"},
        )

    def test_demo_exports_expected_results(self):
        html = self.directory / "nested" / "report.html"
        data = self.directory / "report.json"
        process = self.run_cli("--demo", "--html", html, "--json", data)
        self.assertEqual(process.returncode, 0, process.stderr)
        report = json.loads(data.read_text(encoding="utf-8"))
        self.assertEqual(report["summary"]["total"], 24)
        self.assertEqual(report["summary"]["failure"], 16)
        self.assertEqual(report["summary"]["unique_ips"], 6)
        self.assertEqual(report["summary"]["alert_count"], 3)
        self.assertIn("203.0.113.42", html.read_text(encoding="utf-8"))

    def test_fail_on_alert_exit_code(self):
        self.assertEqual(self.run_cli("--demo", "--fail-on-alert").returncode, 1)
        self.assertEqual(self.run_cli("--demo", "--threshold", 100, "--fail-on-alert").returncode, 0)

    def test_invalid_options_and_missing_files(self):
        for args in ([], ["--demo", "--threshold", "1"], ["--demo", "--window", "0"],
                     ["--demo", "example.csv"], [str(self.directory / "missing.csv")]):
            with self.subTest(args=args):
                process = self.run_cli(*args)
                self.assertEqual(process.returncode, 2)
                self.assertNotIn("Traceback", process.stderr)

    def test_existing_output_is_preserved(self):
        destination = self.directory / "old.html"
        destination.write_text("keep me", encoding="utf-8")
        process = self.run_cli("--demo", "--html", destination)
        self.assertEqual(process.returncode, 2)
        self.assertEqual(destination.read_text(encoding="utf-8"), "keep me")

    def test_outputs_must_be_distinct(self):
        destination = self.directory / "same.txt"
        process = self.run_cli("--demo", "--html", destination, "--json", destination)
        self.assertEqual(process.returncode, 2)
        self.assertFalse(destination.exists())

    def test_invalid_input_does_not_create_report(self):
        source = self.directory / "bad.csv"
        source.write_text("bad header\n", encoding="utf-8")
        destination = self.directory / "report.html"
        process = self.run_cli(source, "--html", destination)
        self.assertEqual(process.returncode, 2)
        self.assertFalse(destination.exists())

    def test_source_cannot_be_overwritten(self):
        source = self.directory / "source.csv"
        original = "timestamp,ip,username,status\n"
        source.write_text(original, encoding="utf-8")
        process = self.run_cli(source, "--html", source)
        self.assertEqual(process.returncode, 2)
        self.assertEqual(source.read_text(encoding="utf-8"), original)

    def test_invalid_encoding_is_readable_error(self):
        source = self.directory / "invalid.csv"
        source.write_bytes(b"\xff\xfeinvalid")
        process = self.run_cli(source)
        self.assertEqual(process.returncode, 2)
        self.assertNotIn("Traceback", process.stderr)


class ReportTests(unittest.TestCase):
    def test_html_escapes_username_and_source(self):
        malicious = '<script>alert("test")</script>'
        result = analyze([event(0, username=malicious), event(1, username=malicious)], threshold=2)
        html = html_report(result, '<img src=x onerror="alert(1)">')
        self.assertNotIn("<script>", html)
        self.assertNotIn("<img", html)
        self.assertIn("&lt;script&gt;", html)
        self.assertIn("&lt;img", html)

    def test_empty_report_has_no_division_by_zero_or_missing_placeholder(self):
        html = html_report(analyze([]), "empty.csv")
        self.assertIn("Aucune connexion", html)
        self.assertNotIn("$total", html)


if __name__ == "__main__":
    unittest.main()
