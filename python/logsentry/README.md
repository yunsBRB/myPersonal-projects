# LogSentry

A local CSV login-log analyser. Detects bursts of failed attempts and successful logins following repeated failures. Exports terminal, HTML and JSON reports.

Python 3.10+ · Standard library only · [MIT](LICENSE)

## Run

From this folder:

```sh
python -m logsentry --demo
python -m logsentry --demo --html reports/demo.html --json reports/demo.json
python -m logsentry logins.csv --threshold 5 --window 5
```

Exports do not overwrite existing files. Use `--help` for all options.

## Input

UTF-8 CSV with `timestamp`, `ip`, `username` and `status` columns. Timestamps need a timezone; status is `success` or `failure`. IPv4 and IPv6 are supported. Invalid rows stop the analysis.

Default detection: 5 failures within 5 minutes. Raw SSH, Apache or Windows logs must be converted first.

## Tests

```sh
python -m unittest discover -s tests -v
```

Alerts identify patterns for review, not proof of intrusion. Files are loaded into memory; this is not a live monitoring service.
