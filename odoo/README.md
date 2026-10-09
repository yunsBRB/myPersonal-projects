# Odoo Projects

Independent Odoo 20 add-ons, each with its own Docker Compose environment and tests.

- [YomoProtect](yomoprotect) — independent reviews of supplier payment requests. Its Odoo technical module name remains `trustgate` for database compatibility.
- [Lead Scoring](lead-scoring) — deterministic CRM lead qualification with explainable business rules.

Run development and test commands from each project folder. The monorepo-root [Odoo workflow](../.github/workflows/odoo.yml) covers both add-ons. Neither module is an online banking connector or predictive AI service.
