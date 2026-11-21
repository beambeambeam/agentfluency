# Interview demo

## Set up the app

1. Run `bun install --frozen-lockfile` and `bun run infra:start` from the repository root. An existing local PostgreSQL instance also works.
2. Configure `BETTER_AUTH_URL=http://localhost:3001`, a `BETTER_AUTH_SECRET` of at least 32 characters, the local `DATABASE_URL`, and a server-only `OPENAI_API_KEY` in the ignored `apps/web/.env`. The OpenAI project must have billing and access to Responses and Containers. Production reads the key from the GitHub Actions `production` environment.
3. Run `bun run db:migrate`, then `bun run dev:web`.

## Run a timed interview

1. Sign up with two different addresses. Promote the interviewer account on the demo database using the SQL below, then sign out and back in. Share the invite only with the candidate assigned to it.
2. As the interviewer, open **Interview studio**. Enter the candidate's address, choose **Start now** or schedule a date, and select 30 or 60 minutes. Edit the ordered steps, select a supported OpenAI model, set permissions, and choose the review metrics. Under **Workspace and files**, use **Add file** to write your own text, or **Upload files** or **Upload folder** to import UTF-8 text. Select any file to edit its path and contents. A relative path such as `data/sales.csv` creates the folder in the candidate's explorer.
3. Select **Create session link**. Copy the link or show the QR code. Open it in a separate browser profile and sign in as the invited candidate. **Start interview** opens the timed workspace. The scheduled end is enforced on the server.
4. Open `data/sales.csv` and ask Codex to verify why revenue declined using the workspace file. Enable sandboxed Python in the setup if you want the model to inspect the archive through the session's OpenAI container. The expected check is 1,000 orders in both months, with average order value falling from $100 to $80.
5. Use **Hide problem** and **View problem** to switch between the task and the editor. Advance through the configured steps and submit. On the interviewer account, open **Sessions → Review** for the submission, timing, and selected activity.

```sql
UPDATE "user"
SET role = 'interviewer'
WHERE email = 'interviewer@agentfluency.test';
```

The candidate screen has no app navigation and requests browser fullscreen on start. The browser still allows the candidate to exit fullscreen or switch tabs. The report records the chosen evidence and leaves the assessment to the interviewer.
