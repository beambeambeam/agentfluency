# Architecture and demo handoff

AgentFluency assesses AI fluency with a timed work sample. Interviewers define the problem, workspace, sequential steps, AI permissions, and evidence. Candidates use the workspace and submit a deliverable for human review.

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

## Interview flow

- **Interviewer.** Better Auth guards the interview studio. The ordered form is the workflow source of truth. React Flow previews only forward edges. PostgreSQL stores an immutable snapshot per session and keeps the latest configuration as the interviewer's draft.
- **Invitation.** The link or locally rendered QR code carries a signed, unguessable capability. The server verifies the signature, candidate role, and assigned email. Starting binds the session to the authenticated account. The schedule is interpreted in the interviewer's local timezone and stored as UTC. A late start uses the remaining time in the original window.
- **Workspace.** The invite route omits app navigation and requests fullscreen on Start. A candidate can show or hide the problem, read files in the IDE, use a scratchpad when enabled, and advance through the ordered steps. Local editor and chat state live in the open tab.
- **Runtime.** A PostgreSQL row lock serializes container provisioning. The application creates a network-disabled OpenAI container, uploads the UTF-8 workspace as a tar archive with its folder paths, and assigns the container ID to the session. The OpenAI Responses adapter streams through TanStack AI. The configured model is enforced server-side. If the interviewer enables sandboxed Python, the code interpreter receives the existing container ID. The active interview page periodically refreshes that container within OpenAI's default idle lifetime. The app attempts immediate cleanup after submission.
- **Review.** The interviewer can open a report for sessions they own after submission or expiry. It includes the submitted text and timing plus selected steps, files, prompt count, or transcript. Prompt and response text is stored only when recording is enabled. Counts of assistant requests also enforce a per-session limit.

## Deployment

GitHub Actions verifies migrations against disposable PostgreSQL. The production job applies committed migrations with the `DATABASE_URL` secret before publishing the Cloudflare Worker. Configure the server-only `OPENAI_API_KEY` in the GitHub Actions `production` environment. The same key authorizes the API model and container for the demo. See the [interview walkthrough](demo.md) for the manual smoke test.

The database retains earlier assessment and attempt records. Interviewers can issue new timed, email-bound invitations for candidates who received an earlier shared link. The landing and sign-in art uses the MIT-licensed [DitherCN runtime](https://github.com/opencoredev/dithercn). Shared branding uses the SVG assets in `apps/web/public/statics/logo` and Chillax with a local font fallback.
