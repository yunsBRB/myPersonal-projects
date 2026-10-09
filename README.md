# Personal Projects

A collection of self-contained personal applications and technical prototypes.

## Business and SaaS projects

| Project | Folder | Scope | Status |
| --- | --- | --- | --- |
| **YOMO 3D** | [web/yomo3d](web/yomo3d) | Media ingestion and foundations for 3D property tours | Foundation v0.1; GPU reconstruction not validated |
| **YomoProtect** | [odoo/yomoprotect](odoo/yomoprotect) | Payment-request risk reviews in Odoo | Local prototype; technical addon ID: `trustgate` |
| **Odoo Lead Scoring** | [odoo/lead-scoring](odoo/lead-scoring) | Explainable qualification for CRM leads | Local prototype |
| **Consent Mail** | [java/consent-mail](java/consent-mail) | Consent management and mailing audience previews | Local prototype |

## Other projects

| Project | Folder | Scope |
| --- | --- | --- |
| LogSentry | [python/logsentry](python/logsentry) | CSV login-log analysis and HTML / JSON reports |
| NutriScan | [web/nutriscan](web/nutriscan) | Food-scanning prototype; login simulated |
| Super Mario | [web/super-mario](web/super-mario) | JavaScript browser game |
| Orbit Animation | [web/orbit-animation](web/orbit-animation) | HTML orbital animation |

## How to use

Each project has its own README and dependencies. Execute commands from the project folder, not the monorepo root. `odoo/` contains Odoo add-ons; `java/` contains a standalone Spring application; `python/` holds Python tools; `web/` contains web applications.

The original repositories [yomo3D](https://github.com/yunsBRB/yomo3D), [trustgate](https://github.com/yunsBRB/trustgate), [odoo-lead-scoring](https://github.com/yunsBRB/odoo-lead-scoring), and [consent-mail](https://github.com/yunsBRB/consent-mail) keep their own histories. Sources were copied; no repository has been deleted or archived.

**YomoProtect** is the product label here. The original repository is still named `trustgate`, and its Odoo technical module name stays `trustgate` for compatibility. Root CI workflows execute selected projects; workflows nested inside projects do not run automatically on GitHub.
