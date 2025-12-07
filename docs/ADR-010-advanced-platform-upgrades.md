# ADR-010: Advanced Platform Upgrades (Trends, Risk Models, Automation, Collaboration)

## Status
Proposed – December 4, 2025

## Context
Anti-detect.com already ships the scanner, generator, challenge arena, and educational content described in `PROJECT_SUMMARY.md` and `docs/`. Customer interviews highlighted gaps around longitudinal analytics, customizable scoring, automation hooks, team workflows, and tamper-proof reporting. Addressing these gaps must preserve current Lighthouse, security, and testing targets.

Key drivers:
- Enterprise customers want to monitor fingerprint drift over weeks, not single scans.
- Risk teams need configurable trust-score weights for vertical-specific policies.
- Large customers ask for batch scans, scheduling, and webhook ingestion into SIEM/SOAR pipelines.
- Collaboration features (accounts, comments, API key rotation) are prerequisites for paid tiers.
- Legal & compliance teams demand verifiable, signed reports coupled with contextual remediation guidance.

Existing technical assets:
- Cloudflare Workers API (`apps/api`) with Hono, Turnstile middleware, and D1/KV/R2 resources.
- Next.js 15 frontend (`apps/web`) with modular routes under `app/`.
- Shared logic/workspaces in `packages/{core,consistency,types,ui}`.
- Turbo + pnpm workflows, Playwright/Vitest coverage, and docs describing deployments.

## Decision
Implement a phased multi-subsystem upgrade:
1. **Trend Store & Drift Analytics** – Extend D1 schema and API to persist historical sessions, compute diffs, and expose charts in the report UI.
2. **Risk Model Profiles** – Refactor `packages/consistency` to accept pluggable weight sets, persist per-organization presets, and expose management UI & endpoints.
3. **Automation & Webhooks** – Introduce a task queue (Durable Object + KV) supporting batch scans, schedules, and signed webhook callbacks.
4. **Accounts & Collaboration** – Add org/user/auth tables, RBAC middleware, API key lifecycle management, report sharing, and inline annotations.
5. **Tamper-Proof Exports** – Build signed JSON/PDF exports stored in R2 with verification endpoints.
6. **Contextual Guidance & SEO Loop** – Map failure codes to curated docs so recommendations render inline and feed SEO.
7. **Observability & Deployment Enhancements** – Instrument OpenTelemetry, improve caching, and document new infra requirements.

## Alternatives Considered
- **Separate microservices**: rejected; monorepo + Workers already optimized for low-latency, and Cloudflare Durable Objects satisfy queueing needs without adding VPC complexity.
- **Off-the-shelf BI tooling**: rejected due to data sensitivity and latency; bespoke charts can run client-side backed by small JSON payloads.
- **Third-party auth (Auth0, Clerk)**: deferred; Cloudflare Access + Workers JWT keeps latency low and avoids regional data residency concerns.

## Consequences
- Requires new migrations, schema versioning, and data backfill job.
- New UI routes (e.g., `/settings/models`, `/automation`) and shared components.
- Additional integration and e2e tests per subsystem.
- Updated deployment scripts for Durable Objects, KV namespaces, and R2 buckets.
- Documentation updates across `DEPLOYMENT.md`, `SECURITY.md`, `PERFORMANCE.md`, and new specialized guides.

## Milestones & Quality Gates
- Each stage ends with `pnpm lint`, `pnpm test`, targeted package tests, and Playwright smoke runs.
- Accessibility, Lighthouse, and performance budgets stay ≥ existing baselines.
- Feature toggles guard beta components until GA.
