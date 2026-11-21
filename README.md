# agentfluency

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Start, Self, ORPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - UI primitives live in the web app
- **oRPC** - End-to-end type-safe APIs with OpenAPI integration
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Vite+** - Unified Vite toolchain, workspace task runner, linting, and formatting

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Local Docker services

Run both services in one Compose project:

```bash
bun run infra:start
```

Expand `agentfluency` in Docker Desktop's Containers view to see Postgres and SeaweedFS. Both services bind to loopback and store data in named volumes. If port `5432` is already in use, run `POSTGRES_PORT=5433 bun run infra:start` and use port `5433` in `DATABASE_URL`.

### Local S3

The S3 endpoint is `http://127.0.0.1:8333`. SeaweedFS creates the private `agentfluency-assets` bucket on startup. Compose reads the disposable defaults from [`packages/docker/.env.example`](packages/docker/.env.example). To override them, copy the template to `packages/docker/.env` and edit that ignored file.

Use `bun run storage:start` and `bun run storage:stop` to manage SeaweedFS on its own.

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/web/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
bun run db:push
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the fullstack application.

## UI Customization

Edit design tokens and global styles in `apps/web/src/index.css`. Import primitives from `@/components/ui` and run the shadcn CLI from `apps/web` to add components.

## Environment Configuration

Each app owns its environment schema in `.env.schema`. Varlock generates `src/env.ts` during installation; run `bun run env:generate` after changing a schema. Commit schemas, and keep secrets in ignored env files or your deployment platform.

Import the generated `ENV` accessor in application code. Shared database and auth packages receive configuration or initialized clients from the application. See [Varlock's monorepo guide](https://varlock.dev/guides/monorepos/).

Bun's automatic env loading is disabled in `bunfig.toml`; the framework integration or server bootstrap loads Varlock. Node deployments must include Varlock and its dependencies alongside the app schema.

Run standalone Node/Bun tools that use Varlock from the owning app directory so they load that app's schema and env files. `env:generate` only generates TypeScript files; it does not initialize environment values in a subsequent command.

## Git Hooks and Formatting

Vite+ runs its bundled Oxlint and Oxfmt using the Ultracite presets in `vite.config.ts`.

- Optional native Vite+ hooks: `bun run hooks:setup`
- Docs: [Vite+ commit hooks](https://viteplus.dev/guide/commit-hooks)
- Run checks: `bun run check`

## Testing

Run `bun run test` from the repository root. Use `bun run test watch` while editing. Vite+ provides Vitest. Import `test` and `expect` explicitly from `vite-plus/test`. Use `test()` for each case, including inside `describe()`.

Keep web feature tests in `__tests__/index.ts` or `__tests__/index.tsx` inside the feature folder. Elsewhere, use `*.test.ts` or `*.test.tsx`. Tests run in Node by default. Add `// @vitest-environment jsdom` at the top of React tests that need the DOM. With explicit Vitest imports, register React Testing Library's `cleanup` with `afterEach`.

## Project Structure

```
agentfluency/
├── apps/
│   └── web/         # Fullstack application (React + TanStack Start)
├── packages/
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run check`: Run Vite+ format/lint checks and workspace TypeScript checks
- `bun fix`: Format files and apply safe lint fixes
- `bun run lint`: Run Vite+ lint checks
- `bun run format`: Run Vite+ formatting
- `bun run staged`: Run Vite+ checks against staged files
- `bun run hooks:setup`: Install Vite+ native Git hooks with `vp config`

## Better Auth Schema Generation

After changing auth plugins or schema options, run `bun run auth:generate` from the project root. The script runs the Better Auth CLI through `varlock run` from the owning app directory, loading the auth instance from `src/services.ts`. Review the schema changes, then use your ORM's migration workflow to apply them.
