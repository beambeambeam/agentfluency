# AgentFluency

**A hiring assessment for working with AI.** Candidates complete a timed work sample, check the assistant's claims against source files, and submit a recommendation. Interviewers use the submitted work and selected session evidence to judge how the candidate arrived at their answer.

[Try the app](https://agentfluency.thisisbeam.fyi/) · [Run the demo locally](docs/demo.md) · [Explore the architecture](docs/architecture.md)

<img src="docs/assets/agentfluency-cover.webp" alt="AgentFluency artwork featuring the project mascot and the text ‘An IQ too high?’" width="620">

## What it does

Traditional interviews give hiring teams limited visibility into how candidates handle an AI-generated answer on the job. AgentFluency makes verification part of the work sample.

| Stage | What happens |
| --- | --- |
| **Configure** | The interviewer sets the task, adds source files, orders the steps, and chooses the model, permissions, and evidence to collect. |
| **Invite** | A link or QR code opens a session assigned to the candidate's email. The session keeps a snapshot of its assessment settings. |
| **Complete** | The candidate works in a timed browser workspace with a file viewer and an AI assistant. The interviewer can also enable a scratchpad and sandboxed Python. |
| **Review** | The interviewer opens a report with the submission, timing, and selected activity. The report can include the chat transcript when recording is enabled. |

AgentFluency was built for the **Sea × OpenAI Regional Codex Hackathon Thailand** under **AI-Native Products & Operations**. The current demo uses a business analysis task. Customer Support and Software Engineering scenarios are [planned](docs/architecture.md#planned-two-role-prototype).

## Demo scenario

The candidate investigates why revenue fell from **$100,000 in April** to **$80,000 in May**. The sales file shows **1,000 orders in each month** and a drop in average order value from **$100 to $80**. The candidate uses the assistant, verifies the numbers against `data/sales.csv`, and submits a recommendation. The interviewer opens **Sessions → Review** to inspect the result.

## Run locally

### Prerequisites

- Bun **1.4.4**, as pinned in [`package.json`](package.json). CI uses Node.js **26** for the Vite+ toolchain.
- Docker with Compose, or an existing PostgreSQL instance.
- A server-side OpenAI API key from a project with billing and access to Responses and Containers for the timed interview demo.

### 1. Install dependencies and start PostgreSQL

```sh
git clone https://github.com/beambeambeam/agentfluency.git
cd agentfluency
bun install --frozen-lockfile
bun run infra:start
```

The [Compose stack](packages/docker/docker-compose.yml) starts PostgreSQL and SeaweedFS on loopback. With an existing PostgreSQL instance, skip `infra:start` and use that instance's connection URL below.

### 2. Configure the app

Create `apps/web/.env` with these values. The database URL uses the disposable credentials from the local Compose setup.

```dotenv
BETTER_AUTH_URL=http://localhost:3001
BETTER_AUTH_SECRET=replace-with-a-random-secret-at-least-32-characters
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/agentfluency
OPENAI_API_KEY=replace-with-your-server-side-api-key
```

See the [environment schema](apps/web/.env.schema) for validation rules. Keep local values in the ignored env file. If PostgreSQL uses a different port, update `DATABASE_URL` to match.

### 3. Apply migrations and run the app

```sh
bun run db:migrate
bun run dev:web
```

Open [localhost:3001](http://localhost:3001). Follow the [demo walkthrough](docs/demo.md) to set up an interviewer account, send a candidate invitation, and review a submission.

## Development

| Command | Purpose |
| --- | --- |
| `bun run check` | Check formatting, lint, and TypeScript across the workspace. |
| `bun run test run` | Run the test suite once. Use `bun run test watch` while editing. |
| `bun run build` | Build the workspace. |
| `bun run hooks:setup` | Enable Vite+ checks for staged files before committing. |
| `bun run env:generate` | Regenerate Varlock types after editing an environment schema. |
| `bun run auth:generate` | Regenerate the Better Auth schema after changing auth options or plugins. |

Use `bun run db:generate --name <change>` from `packages/db` after changing the schema and commit the generated SQL and snapshot. The production workflow runs migrations before deploying the Worker, so keep migrations compatible with the currently deployed build.

### Repository map

| Path | Owns |
| --- | --- |
| [`apps/web`](apps/web) | React and TanStack Start app, with the interview studio, candidate workspace, report, and OpenAI assistant integration. |
| [`packages/db`](packages/db) | PostgreSQL queries, Drizzle schemas, and migrations. |
| [`packages/auth`](packages/auth) | Shared Better Auth setup. |
| [`packages/api`](packages/api) and [`packages/config`](packages/config) | Shared oRPC endpoints and workspace configuration. |
| [`packages/docker`](packages/docker) and [`packages/s3`](packages/s3) | Local infrastructure and shared S3 client. |

SeaweedFS exposes a local S3 endpoint at `http://127.0.0.1:8333` and provisions the private `agentfluency-assets` bucket. See the [local storage configuration](packages/docker/.env.example). Use `bun run storage:start` and `bun run storage:stop` to manage SeaweedFS separately.

## Deployment

[GitHub Actions](.github/workflows/ci.yml) verifies migrations, formatting, lint, types, the Worker build, and tests. On a verified push to `main`, the production job migrates PostgreSQL and deploys the app to Cloudflare Workers.

Use the GitHub Actions `production` environment for the Cloudflare credentials and Worker secrets referenced in the [workflow](.github/workflows/ci.yml). Set `OPENAI_API_KEY` there to run live interviews. PostgreSQL must be reachable from both GitHub Actions and the Worker. See the [Worker configuration](apps/web/cloudflare.config.ts) for the production domain and authentication origin.
