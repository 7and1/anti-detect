# Repository Guidelines

## Project Structure & Module Organization
The monorepo is wired via `pnpm-workspace.yaml`. Runtime apps sit in `apps/`: `apps/web` (Next.js + Cloudflare Pages) keeps UI code under `src`, assets in `public`, and Playwright specs in `e2e`; `apps/api` is a Hono Worker with handlers in `src`, D1 migrations in `migrations`, and schema in `schema.sql`. Shared logic lives in `packages/{core,ui,consistency,types}`, and long-form specs and plans are stored in `docs/`.

## Build, Test, and Development Commands
- `pnpm install` – install workspace deps (Node ≥20, pnpm ≥9).
- `pnpm dev --filter @anti-detect/web` / `pnpm dev --filter @anti-detect/api` – run the web app (Next dev w/ Turbo) or the API worker (Wrangler dev).
- `pnpm build` – Turbo build graph; use `pnpm deploy:web` or `pnpm deploy:api` for targeted Cloudflare deployments.
- `pnpm lint`, `pnpm typecheck`, `pnpm format` – enforce ESLint, TS, and Prettier (Tailwind plugin) rules.
- `pnpm test`, `pnpm test:e2e`, `pnpm --filter @anti-detect/web lighthouse` – run Vitest suites, Playwright specs (`apps/web/e2e`), and LHCI perf budgets.
- `pnpm db:migrate` / `pnpm db:seed` – apply D1 migrations via Wrangler; use `...:local` when pointing at local bindings.

## Coding Style & Naming Conventions
Code is TypeScript-first with 2-space indentation, single quotes, and required semicolons as enforced by Prettier. React components use PascalCase filenames under `apps/web/src/components`, hooks under `hooks`, and route folders under `app`. Hono handlers in `apps/api/src/routes` export default `app` instances. Prefer workspace imports (`@anti-detect/core`, `@/components/...`) over relative paths. Run `pnpm lint:fix` before pushing; Tailwind utility ordering is handled by `prettier-plugin-tailwindcss`.

## Testing Guidelines
Vitest drives unit/integration tests across packages and the API (`packages/core/src/__tests__`, `apps/api/src/__tests__`). Maintain ≥80% lines/functions and ≥75% branches, mirroring `docs/TESTING-STRATEGY.md`. UI integration and smoke paths live in `apps/web/e2e` with Playwright; tag flows per journey (`scanner.spec.ts`) and execute via `pnpm --filter @anti-detect/web test:e2e`. Capture performance regressions with `pnpm --filter @anti-detect/web lighthouse` before release branches.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`fix:`, `test:`, `chore:`) as seen in `git log`; commitlint + Husky run on `prepare`. Commits should remain scoped to one package/app whenever possible and mention tickets in the subject or body. PRs must include: summary of change, affected packages, test evidence (`pnpm test` + `pnpm test:e2e` output or screenshots), and deployment considerations (Wrangler env updates, new secrets). Link docs in `docs/` or ADR references when altering architecture.
