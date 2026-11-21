## Linting and formatting

- After changing code, run `bun run lint --fix`, then `bun run format` from the repository root.
- Before finishing, run `bun run lint --deny-warnings --format=agent`. Resolve all reported errors and warnings.

## Web feature layout

- Put feature-specific UI and logic in `apps/web/src/features/`. Keep shared UI in `src/components/` and route wiring in `src/routes/`.
- Start with one kebab-case file, such as `sign-in.tsx`. When it needs child files or tests, move the entry to `sign-in/index.tsx`.
- Put a feature's tests in its `__tests__/index.tsx` when they use JSX, or `__tests__/index.ts` otherwise. Define cases with `test()` from `vite-plus/test`.
- Import a feature through its entry, such as `@/features/sign-in`.

## Agent skills

### Engineering workflow

Start with [grill-with-docs](.agents/skills/grill-with-docs/SKILL.md) to resolve design questions, then use [to-spec](.agents/skills/to-spec/SKILL.md) to publish the spec and [to-tickets](.agents/skills/to-tickets/SKILL.md) to split it into tickets. Use [implement](.agents/skills/implement/SKILL.md) to build a ticket, [code-review](.agents/skills/code-review/SKILL.md) to review changes, and [retro](.agents/skills/retro/SKILL.md) to capture session improvements.

When a workflow calls another skill, read that skill's `SKILL.md` under `.agents/skills/` and follow it.

### Issue tracker

Track specs and tickets in GitHub Issues for `beambeambeam/agentfluency`. See [issue-tracker.md](docs/agents/issue-tracker.md).

### Triage labels

Use the default triage labels. See [triage-labels.md](docs/agents/triage-labels.md).

### Domain docs

Use a single context with a root glossary and ADRs under `docs/adr/`. See [domain.md](docs/agents/domain.md).
