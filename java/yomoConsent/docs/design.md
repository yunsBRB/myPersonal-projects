# Design

One Spring Boot application: controller → service → JPA repository. Flyway manages the schema. A subscription is unique for an email fingerprint and purpose; it has consent events. A campaign references a purpose and stays a draft.

## Lifecycle

`PENDING → CONFIRMED → WITHDRAWN`, with direct withdrawal from PENDING also allowed.

Registration records the purpose, notice version, source and server timestamp. It creates separate random confirmation and withdrawal tokens. Only their hashes are stored. Confirmation expires after 24 hours and is single-use. Withdrawal is idempotent and invalidates outstanding confirmation.

Campaign previews count only CONFIRMED subscriptions for the exact same purpose. Eligibility is calculated again for every preview. Addresses are normalised to lower case under a documented application policy; some mail systems may distinguish local-part case.

## Data handling

Email addresses are encrypted using AES-256-GCM with a fresh random nonce. A keyed HMAC supports duplicate detection without storing the plaintext email. API list responses omit addresses and token hashes. Consent changes and their events share a database transaction; optimistic locking detects concurrent updates.

This is an authenticated local simulation. Tokens are shown once so the operator can exercise the lifecycle. This is not proof that a recipient received a message or confirmed consent independently. The next implementation step is controlled delivery to the recipient and public token-based confirmation/withdrawal pages.

The prototype does not claim complete GDPR compliance. Retention schedules, erasure, export, key rotation, the actual consent wording and the deployment's legal basis still need implementation and review. No production customer data is included.

## Odoo boundary

There is no live Odoo adapter yet. A future adapter should use JSON-2 and explicitly map `mailing.contact` data, list membership and suppression. A global blacklist must not be confused with purpose-specific consent. Inspect the target database's `/doc` contract and installed Email Marketing modules before mapping fields.

Reference: [Odoo JSON-2 API](https://www.odoo.com/documentation/19.0/developer/reference/external_api.html).
