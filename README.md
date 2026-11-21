# AgentFluency

AgentFluency helps interviewers assess how candidates use AI to complete realistic work across roles. The demo follows a business analyst investigating a revenue decline and lets the interviewer review the candidate's recommendation.

Read the [architecture and demo handoff](docs/architecture.md) for the product boundaries and code map. Follow the [demo walkthrough](docs/demo.md) to try both roles locally.

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

Install dependencies using the Bun version in [package.json](package.json). CI uses Node.js 26 for the Vite+ tooling.

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

### Shared S3 package

Add `"@agentfluency/s3": "workspace:*"` to the consuming package and create one client per bucket in server code. Pass configuration from the consuming app. On AWS, use the SDK's default credential provider chain. For SeaweedFS, pass `endpoint: "http://127.0.0.1:8333"`, `forcePathStyle: true`, and explicit local credentials matching the Docker config.

```ts
import { createS3Storage } from "@agentfluency/s3";

const storage = createS3Storage({
  bucket: "my-assets-bucket",
  region: "us-east-1",
});
const key = "uploads/file.txt";

await storage.putObject({
  Key: key,
  Body: "Hello World!",
  ContentType: "text/plain",
});
const url = await storage.getDownloadUrl(key, { expiresIn: 60 });
```

Download URLs expire after five minutes by default. Anyone with the URL can use it until it expires, so authorize the download before signing and keep signed URLs out of logs.

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Set `DATABASE_URL` in `apps/web/.env` and provide the Better Auth origin and secret as described in the [demo walkthrough](docs/demo.md).

3. Apply the schema to your database:

```bash
bun run db:migrate
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

- Run `bun run hooks:setup` after installing dependencies to enable the Vite+ pre-commit hook. It runs `bun run staged` against staged files.
- Docs: [Vite+ commit hooks](https://viteplus.dev/guide/commit-hooks)
- Run checks: `bun run check`

The [GitHub Actions CI workflow](.github/workflows/ci.yml) checks database migrations, formatting, lint, types, the Worker build, and tests on pull requests, merge queues, and pushes to `main`. Verification needs no production secrets.

## Production Deployment

Successful pushes to `main` deploy the verified build to [agentfluency.thisisbeam.fyi](https://agentfluency.thisisbeam.fyi) with `cf deploy`. The [Worker configuration](apps/web/cloudflare.config.ts) sets the custom domain and Better Auth origin.

The GitHub Actions `production` environment allows deployments from `main`. `cf deploy` uses the `CLOUDFLARE_ACCOUNT_ID` variable and `CLOUDFLARE_API_TOKEN` secret. The deploy step passes `BETTER_AUTH_SECRET`, `DATABASE_URL`, `AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_REGION` as Worker runtime secrets.

Set the optional `OPENAI_API_KEY` secret in that environment to enable the dashboard assistant on the next deploy.

Use a PostgreSQL endpoint reachable from both GitHub Actions and Cloudflare Workers. The production job applies committed Drizzle migrations using `DATABASE_URL` before publishing the Worker. A migration failure stops the deployment. Pull requests test the migrations against a disposable PostgreSQL instance.

After editing the database schema, run `bun run db:generate --name <change>` from `packages/db` and commit the generated SQL and snapshot. Keep schema changes compatible with the currently deployed Worker because migrations run before the new Worker is published.

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
- `bun run db:generate`: Generate Drizzle migration SQL and snapshots
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run check`: Run Vite+ format/lint checks and workspace TypeScript checks
- `bun fix`: Format files and apply safe lint fixes
- `bun run lint`: Run Vite+ lint checks
- `bun run format`: Run Vite+ formatting
- `bun run staged`: Run Vite+ checks against staged files
- `bun run hooks:setup`: Enable the Vite+ Git hook dispatcher

## Better Auth Schema Generation

After changing auth plugins or schema options, run `bun run auth:generate` from the project root. The script runs the Better Auth CLI through `varlock run` from the owning app directory, loading the auth instance from `src/auth.config.ts`. Review the schema changes, then use your ORM's migration workflow to apply them.
