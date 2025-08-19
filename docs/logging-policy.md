# Logging Policy

Rivor uses a structured logger (`apps/web/src/lib/logger.ts`) to record audit events while protecting sensitive data. The logger automatically redacts common secrets and hashes email addresses before emitting entries.

## Audit Forwarding

When the `AUDIT_LOG_URL` environment variable is set, the logger forwards each entry to the configured endpoint. The remote store is responsible for enforcing retention policies and centralized analysis. Forwarding only occurs on the server to avoid exposing credentials in the browser.

## Debug Statements

Local development uses `console` output for readability, but production builds strip remaining `console.*` calls. This is enforced via `next.config.mjs` (`compiler.removeConsole`) so no stray debug statements appear in production bundles.

## Usage

Replace any direct `console.log` calls with `logger.info` or `logger.error` and provide context objects instead of raw sensitive values. The logger redacts or hashes fields such as tokens and email addresses automatically.
