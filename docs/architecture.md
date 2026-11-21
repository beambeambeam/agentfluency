# Architecture and demo handoff

## Product direction

AI fluency is a distinct hiring competency alongside domain knowledge, technical ability, and communication. An interviewer sets a work sample and its AI environment. A candidate completes the work, checks the assistant's output against the available evidence, and submits a deliverable. The platform is designed for work across roles, including business analysis, customer support, marketing, and engineering.

The hackathon demo uses a business analyst scenario. Orders remain at 1,000 while revenue falls from $100,000 to $80,000. The default scripted assistant initially suggests that order volume fell. Asking it to verify the result exposes the difference between order volume and average order value. The evaluator can read the candidate's recommendation and see whether it cites the supplied data.

## Request and data flow

| Area | Where to start | Behavior |
| --- | --- | --- |
| Authentication | [Better Auth configuration](../packages/auth/src/index.ts) and [session middleware](../apps/web/src/middleware/auth.ts) | Email and password sign-in uses a PostgreSQL-backed session. New accounts get the candidate role. Better Auth treats the role as server-owned. The local demo procedure assigns interviewer access in the database. |
| Dashboard | [Protected route](../apps/web/src/routes/_auth/route.tsx), [dashboard](../apps/web/src/routes/_auth/dashboard.tsx), and [interview server functions](../apps/web/src/features/interview/server.ts) | The session determines which workspace renders. The save action checks the interviewer role. The submission action checks the candidate role and takes the candidate ID from the session. |
| Assessment | [Configuration schema](../apps/web/src/features/interview/config.ts), [demo scenario](../apps/web/src/features/interview/demo-config.ts), and [database access](../packages/db/src/demo-assessment.ts) | The demo starts from a fixture and uses one shared saved assessment. Edits replace its JSON configuration. An assessment contains ordered steps, a brief, workspace name, files with slash-delimited paths, harness and model selections, candidate selection permissions, and sandbox mode. |
| Candidate workbench | [Candidate workspace](../apps/web/src/features/interview/candidate.tsx), [file explorer](../apps/web/src/features/interview/file-explorer.tsx), and [source preview](../apps/web/src/features/interview/source-preview.tsx) | The fullscreen layout combines a collapsible explorer, tabbed read-only file previews, the task panel, and the assistant. The interface uses shadcn controls. The workbench is monochrome with color reserved for file icons and syntax. A scratchpad appears when the assessor enables it. |
| Assistant | [Composer](../apps/web/src/features/assistant-chat/index.tsx) and [stream server function](../apps/web/src/features/assistant-chat/chat.ts) | The composer sends each turn's selected harness, model, and optional file ID. The server checks the candidate role, reloads the assessment, and enforces the configured locks. It resolves allowed attachments from stored file contents and streams replies as server-sent events through TanStack AI. |
| Submissions | [Assessment tables](../packages/db/src/schema/assessment.ts) and [interviewer workspace](../apps/web/src/features/interview/interviewer.tsx) | PostgreSQL stores the latest recommendation per candidate and its submission time. The interviewer can read submitted recommendations in the dashboard. |

The shared `packages/api` workspace still provides the starter oRPC health check and private endpoint. Interview reads and writes currently use TanStack Start server functions. The S3 package and local SeaweedFS environment are available for future assets. Demo files are stored as text in assessment configuration.

## Runtime boundaries

- **Harnesses** are local prompt and interaction presets. The catalog displays Codex, Claude Code, Cursor Agent, Grok Build, and Gemini CLI. Stored preset IDs retain compatibility with earlier demo configuration. Vendor agents and their tool runtimes are future integrations.
- **Model execution** uses the OpenAI adapter for configured OpenAI models. Local development uses a labeled scripted adapter when no OpenAI key is set. The other model choices are catalog entries available in the scripted demo. Production requires an OpenAI key and a supported OpenAI model.
- **Sandbox** selects a read-only workspace or a workspace with a browser scratchpad. The scratchpad and chat transcript live in the open page. Candidate invitations, per-session containers or VMs, execution tools, transcript persistence, and evidence replay are future work.
- **Assessment review** shows human-readable recommendations. Automated grading, rubric evaluation, and hiring decisions are outside the demo.
- **PostgreSQL** stores users, sessions, assessment configuration, and recommendations. The shared demo is intended for controlled testing. Multiple organizations, assignment boundaries, and concurrent interviewer editing need their own data model before a general rollout.

## Deployment status

The [GitHub Actions workflow](../.github/workflows/ci.yml) verifies pull requests and deploys successful builds from `main` to Cloudflare Workers. CI currently handles application deployment. The demo schema was applied locally with Drizzle. Before merging a change that uses the new schema on an existing hosted database, apply the schema with the repository owner's rollout plan and verify the Worker can read it. Hosted migration automation and remote demo account provisioning are pending local demo sign-off.

The [demo walkthrough](demo.md) covers setup, disposable accounts, and acceptance checks. Keep environment values and account passwords in local configuration or deployment secrets.
