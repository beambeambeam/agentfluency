# Architecture and demo handoff

## Product direction

AI fluency is a distinct hiring competency alongside domain knowledge, technical ability, and communication. An interviewer sets a work sample and its AI environment. A candidate completes the work, checks the assistant's output against the available evidence, and submits a deliverable. The platform is designed for work across roles, including business analysis, customer support, marketing, and engineering.

## Planned two-role prototype

Build and verify Customer Support end to end, from assignment through interviewer review, before starting Software Engineering.

Both job roles will reuse the demo's assessment configuration, candidate workbench, assistant, and submission flow. The interviewer will assign a role-specific scenario and send an invite. The candidate will complete a short AI-literacy section, then enter a timed simulation. A reviewer report will show the submitted work, the assistant's contribution, and how the candidate verified its output. The interviewer will assess skill using that evidence. Integrity signals will appear separately for human review and will have no effect on the skill score.

### 1. Customer Support

The candidate will handle a missing-payout ticket in a workspace with a source viewer, reply editor, and AI assistant. The exercise will use synthetic case records, give the assistant one policy lookup scoped to the task, and simulate all case actions. The candidate will check the applicable policy and the payout event log, draft a reply, and decide whether to escalate the case.

The interviewer will see the sources the candidate used, their edits to the draft, the final customer reply, and the disposition of the ticket, including the escalation decision.

### 2. Software Engineering

The candidate will work in a browser code editor with one starter repository containing an export bug that drops valid zero values. They will preview the assistant's proposed diff, edit the patch, and use **Run tests** to check the fix. An isolated runner will execute the tests against the exact saved revision so the reviewer can identify which changes each result covers.

The interviewer will see the proposed patch, the candidate's edits, the test results for the saved revision, and the final diff.

### Completion and roadmap

The prototype is complete when an interviewer can assign either job role, a candidate can finish the assigned scenario, and the interviewer can inspect how the candidate verified the AI output in each scenario. For Support, the interviewer should be able to trace the reply and escalation decision to the policy and event log. For Engineering, they should be able to trace the final fix to the candidate's edits and the results for the tested revision.

Data Analysis is the next planned workspace after this prototype. Finance and other roles are future candidates.

## Current demo

Interviewers save private drafts and generate shareable links with locally rendered QR codes. Each invitation holds a snapshot of the current configuration. A candidate who signs in or creates an account from the link returns to that invitation. Authenticated entry starts a three-minute, unscored warmup. PostgreSQL records its start once per candidate and invitation. The server checks the elapsed time before returning the workspace, answering assistant requests, or accepting a recommendation. Shared links can be used by multiple candidates, each with their own start time and submission.

The hackathon demo uses a business analyst scenario. Orders remain at 1,000 while revenue falls from $100,000 to $80,000. The default scripted assistant initially suggests that order volume fell. Asking it to verify the result exposes the difference between order volume and average order value. The evaluator can read the candidate's recommendation and see whether it cites the supplied data.

## Request and data flow

| Area | Where to start | Behavior |
| --- | --- | --- |
| Authentication | [Better Auth configuration](../packages/auth/src/index.ts) and [session middleware](../apps/web/src/middleware/auth.ts) | Email and password sign-in uses a PostgreSQL-backed session. New accounts get the candidate role. Better Auth treats the role as server-owned. The local demo procedure assigns interviewer access in the database. |
| Dashboard | [Protected route](../apps/web/src/routes/_auth/route.tsx), [dashboard](../apps/web/src/routes/_auth/dashboard.tsx), and [interview server functions](../apps/web/src/features/interview/server.ts) | The session determines which workspace renders. The save action checks the interviewer role. The submission action checks the candidate role and takes the candidate ID from the session. |
| Assessment | [Configuration schema](../apps/web/src/features/interview/config.ts), [demo scenario](../apps/web/src/features/interview/demo-config.ts), and [invitation data](../packages/db/src/assessment-invites.ts) | Each interviewer's draft starts from the previous shared demo configuration or the fixture. Generating an invitation saves the draft and creates its snapshot in one transaction. It holds the ordered steps, brief, workspace name, files, harness and model selections, candidate selection permissions, and sandbox mode. |
| Candidate workbench | [Candidate workspace](../apps/web/src/features/interview/candidate.tsx), [file explorer](../apps/web/src/features/interview/file-explorer.tsx), and [source preview](../apps/web/src/features/interview/source-preview.tsx) | The fullscreen layout combines a collapsible explorer, tabbed read-only file previews, the task panel, and the assistant. The interface uses shadcn controls. The workbench is monochrome with color reserved for file icons and syntax. A scratchpad appears when the assessor enables it. |
| Assistant | [Composer](../apps/web/src/features/assistant-chat/index.tsx) and [stream server function](../apps/web/src/features/assistant-chat/chat.ts) | The composer sends each turn's selected harness, model, and optional file ID. The server checks the candidate role, reloads the assessment, and enforces the configured locks. It resolves allowed attachments from stored file contents and streams replies as server-sent events through TanStack AI. |
| Submissions | [Assessment tables](../packages/db/src/schema/assessment.ts) and [interviewer workspace](../apps/web/src/features/interview/interviewer.tsx) | New recommendations belong to a candidate and invitation. The issuing interviewer can review submissions for their own invitations. Historical submissions from the original shared demo remain visible to interviewers under the legacy demo label. |

The shared `packages/api` workspace still provides the starter oRPC health check and private endpoint. Interview reads and writes currently use TanStack Start server functions. The S3 package and local SeaweedFS environment are available for future assets. Demo files are stored as text in assessment configuration.

The landing and sign-in artwork uses the MIT-licensed [DitherCN shader runtime](https://github.com/opencoredev/dithercn) vendored in `apps/web/src/lib/dither` with an ES2022 compatibility adjustment. The candidate workbench keeps tab order and the editor split in page state. Narrow layouts stack the assistant below the editor.

## Runtime boundaries

- **Harnesses** are local prompt and interaction presets. The catalog displays Codex, Claude Code, Cursor Agent, Grok Build, and Gemini CLI. Stored preset IDs retain compatibility with earlier demo configuration. Vendor agents and their tool runtimes are future integrations.
- **Model execution** uses the OpenAI adapter for configured OpenAI models. Local development uses a labeled scripted adapter when no OpenAI key is set. The other model choices are catalog entries available in the scripted demo. Production requires an OpenAI key and a supported OpenAI model.
- **Sandbox** selects a read-only workspace or a workspace with a browser scratchpad. The scratchpad and chat transcript live in the open page. Per-session containers or VMs, execution tools, transcript persistence, and evidence replay are future work.
- **Assessment review** shows human-readable recommendations. Automated grading, rubric evaluation, and hiring decisions are outside the demo.
- **PostgreSQL** stores users, sessions, assessment drafts, invitation snapshots, candidate attempts, and recommendations. Invitations are bearer links and require a signed-in candidate account. Organization management and named-recipient invitations are outside the demo.

## Deployment status

The [GitHub Actions workflow](../.github/workflows/ci.yml) verifies migrations against disposable PostgreSQL and deploys successful builds from `main` to Cloudflare Workers. The production job applies committed Drizzle migrations to the database in the `DATABASE_URL` secret before publishing the Worker. The initial migration supports both empty databases and databases with the original Better Auth tables. It adds the interview tables and defaults existing users to the candidate role. Demo accounts are provisioned separately.

The [demo walkthrough](demo.md) covers setup, disposable accounts, and acceptance checks. Keep environment values and account passwords in local configuration or deployment secrets.
