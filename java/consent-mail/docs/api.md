# API and configuration

Base URL: `http://localhost:8082`. Requests and responses use JSON.
The browser uses a login session. Scripts may use HTTP Basic with the same accounts.
CSRF protection remains enabled: obtain `/api/session`, retain its cookie and send its `csrfToken` value in the `csrfHeader` header on every POST.
`scripts/demo.py` shows the complete flow using the Python standard library.

| Method | Path | Role | Behaviour |
| --- | --- | --- | --- |
| GET | `/api/session` | Authenticated | Current username and CSRF token. |
| POST | `/api/subscriptions` | OPERATOR / ADMIN | Create a pending subscription and return demo tokens once. |
| GET | `/api/subscriptions?page=0` | OPERATOR / ADMIN | List consent summaries, without email addresses. |
| POST | `/api/consents/confirm` | OPERATOR / ADMIN | Consume a confirmation token. |
| POST | `/api/consents/withdraw` | OPERATOR / ADMIN | Withdraw consent using its separate token. |
| POST | `/api/campaigns` | OPERATOR / ADMIN | Create a campaign draft. |
| GET | `/api/campaigns/{id}/audience` | OPERATOR / ADMIN | Count currently confirmed contacts for the same purpose. |
| GET | `/api/consent-events?page=0` | ADMIN | Read consent events. |

Validation errors return HTTP 400, role failures 403, missing resources 404 and invalid state transitions 409.
List pages contain at most 50 records. Page numbers start at zero.
Authentication is limited to three configured accounts in this first version.

## PostgreSQL

Copy `.env.example` to `.env`, replace the placeholders, then start the database:

```sh
docker compose up -d db
```

Set the same variables in your IDE run configuration or shell, then run `mvn spring-boot:run` without the demo profile.
Docker Compose reads `.env`; Spring Boot does **not** load it automatically.
Use `DATABASE_URL=jdbc:postgresql://localhost:5433/app`.
Flyway creates the schema and Hibernate validates it. The database volume persists between restarts.

Required variables: `DATABASE_PASSWORD`, `OPERATOR_PASSWORD`, `REVIEWER_PASSWORD`, `ADMIN_PASSWORD`, `CONTACT_ENCRYPTION_KEY`.

## Local boundary

The server binds to `127.0.0.1`. Do not expose the demo profile publicly.
For a deployed system, configure TLS, persistent user management, access reviews and operational monitoring first.

Generate the contact encryption key with `openssl rand -base64 32`. Keep it outside Git and retain it securely with the database: losing it makes stored email addresses unreadable. Key rotation is not implemented. The public demo key must never protect real contacts.
