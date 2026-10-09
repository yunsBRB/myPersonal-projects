# Odoo Lead Scoring

Explainable lead qualification inside Odoo CRM. Five business signals produce a score from 0 to 100 and a suggested priority. Applying that priority is explicit; Odoo's predicted win probability stays unchanged.

**Stack:** Odoo 20 · Python 3.12 · JavaScript/Owl · XML · PostgreSQL 17.

## Run locally

```sh
cp .env.example .env
# Set a local database password in .env.
docker compose build
docker compose run --rm odoo --addons-path=/opt/odoo/addons,/mnt/extra-addons --data-dir=/var/lib/odoo --db_host=db --db_user=odoo -d crm_lead_qualification -i crm_lead_qualification --without-demo=all --stop-after-init
docker compose up -d
```

Open http://localhost:8069, sign in to the new development database with `admin` / `admin`, and change that password. Open a CRM opportunity, then **Qualification**.

| Signal | Points |
| --- | ---: |
| Target sector | 25 |
| Company size of 10–250 | 20 |
| Demo requested | 30 |
| Verified business email | 10 |
| Meaningful contact within seven days | 15 |

Priority thresholds are 25, 50 and 75. Signals are entered by the salesperson; the score is recalculated when read, so old contact dates do not remain eligible indefinitely.

The addon inherits CRM access rules and needs no external API key. This is a deterministic qualification tool, not a predictive model. [Development and tests](docs/development.md).
