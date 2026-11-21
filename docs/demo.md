# Local interview demo

## Start the application

1. Run `bun install` and `bun run infra:start` from the repository root. An existing local PostgreSQL server also works.
2. Set `BETTER_AUTH_URL=http://localhost:3001`, a generated `BETTER_AUTH_SECRET` of at least 32 characters, and a local `DATABASE_URL` in `apps/web/.env`. The [Docker Compose file](../packages/docker/docker-compose.yml) defines the disposable local database name, port, and credentials. The [database env schema](../packages/db/.env.schema) imports the web database settings. Use an ignored `packages/db/.env` override if required by your local setup.
3. Run `bun run db:migrate` against that local database. Run `bun run dev:web` and open [the sign-in page](http://localhost:3001/login).

An OpenAI key is optional for this walkthrough. Leave it unset to get repeatable, labeled scripted replies. Set `OPENAI_API_KEY` in the web env and restart to exercise a live OpenAI model.

## Create two local accounts

Use **Sign Up** to create two accounts, such as `interviewer@agentfluency.test` and `candidate@agentfluency.test`. Choose disposable passwords. Both start as candidates. Run the following only on the local demo database, using the email registered for the interviewer:

```sql
UPDATE "user"
SET role = 'interviewer'
WHERE email = 'interviewer@agentfluency.test';
```

Sign out, then sign back in with the interviewer account to confirm that the dashboard opens the assessment builder. Use a private browser window for the candidate if you want both roles open at once.

## Walk through the demo

1. Sign in as the interviewer. Change a step title, a workspace file, or a harness setting. Click **Save assessment**.
2. Sign in as the candidate. Confirm the saved change is present. Expand the data folder, open `data/sales.csv`, and click **Attach to chat**. The file should open with line numbers and colored tokens. A model or harness locked by the interviewer should display a lock.
3. With the default Codex preset and scripted mode, ask **Why did revenue decline?**. Ask the assistant to check the order counts. The first answer proposes lower volume. The follow-up should report 1,000 orders in both months and a drop in average order value from $100 to $80.
4. Open a second file and drag its tab to a new position. A focused tab can also move with **Alt+Shift+Left/Right**. Drag or use the arrow keys on the divider between the editor and assistant. Double-click the divider to reset it.
5. Navigate to the final step and submit a recommendation. Refresh the interviewer dashboard and confirm the recommendation appears under **Submissions**.

For a pre-PR check, run `bun run check` and `bun run test run`. Also verify that a signed-out dashboard visit redirects to sign-in and that the candidate cannot save assessment settings.
