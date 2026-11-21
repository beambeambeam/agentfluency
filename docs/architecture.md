# Architecture and demo handoff

AgentFluency assesses AI fluency with a timed work sample. Interviewers define the problem, workspace, sequential steps, AI permissions, and evidence. Candidates use the workspace and submit a deliverable for human review.

## Interview flow

- **Interviewer.** Better Auth guards the interview studio. The ordered form is the workflow source of truth. React Flow previews only forward edges. PostgreSQL stores an immutable snapshot per session and keeps the latest configuration as the interviewer's draft.
- **Invitation.** The link or locally rendered QR code carries a signed, unguessable capability. The server verifies the signature, candidate role, and assigned email. Starting binds the session to the authenticated account. The schedule is interpreted in the interviewer's local timezone and stored as UTC. A late start uses the remaining time in the original window.
- **Workspace.** The invite route omits app navigation and requests fullscreen on Start. A candidate can show or hide the problem, read files in the IDE, use a scratchpad when enabled, and advance through the ordered steps. Local editor and chat state live in the open tab.
- **Runtime.** A PostgreSQL row lock serializes container provisioning. The application creates a network-disabled OpenAI container, uploads the UTF-8 workspace as a tar archive with its folder paths, and assigns the container ID to the session. The OpenAI Responses adapter streams through TanStack AI. The configured model is enforced server-side. If the interviewer enables sandboxed Python, the code interpreter receives the existing container ID. The app attempts immediate cleanup after submission and uses the provider's inactivity expiry for abandoned containers.
- **Review.** The interviewer can open a report for sessions they own after submission or expiry. It includes the submitted text and timing plus selected steps, files, prompt count, or transcript. Prompt and response text is stored only when recording is enabled. Counts of assistant requests also enforce a per-session limit.

## Deployment

GitHub Actions verifies migrations against disposable PostgreSQL. The production job applies committed migrations with the `DATABASE_URL` secret before publishing the Cloudflare Worker. Configure the server-only `OPENAI_API_KEY` in the GitHub Actions `production` environment. The same key authorizes the API model and container for the demo. See the [interview walkthrough](demo.md) for the manual smoke test.

The database retains earlier assessment and attempt records. New sessions use the timed, email-bound invite flow. The landing and sign-in art uses the MIT-licensed [DitherCN runtime](https://github.com/opencoredev/dithercn). Shared branding uses the SVG assets in `apps/web/public/statics/logo` and Chillax with a local font fallback.
