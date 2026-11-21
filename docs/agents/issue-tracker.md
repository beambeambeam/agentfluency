# Issue tracker

Track specs and tickets in GitHub Issues for `beambeambeam/agentfluency`. Use `gh -R beambeambeam/agentfluency` to target this repository.

## Issues

- Publish a spec or ticket with `gh issue create --title "<title>" --body-file <file>`.
- Read a ticket with `gh issue view <number> --json number,title,body,labels,comments`.
- List issues with `gh issue list`. Use `--state` and `--label` to filter the results.
- Link a ticket to its spec with `gh issue create --parent <spec-number> ...` or `gh issue edit <spec-number> --add-sub-issue <ticket-number>`.
- Record blockers using native GitHub dependencies. Create blockers first, then use `gh issue create --blocked-by <number>,<number> ...` or `gh issue edit <ticket-number> --add-blocked-by <blocker-number>`. A ticket is unblocked when every blocker is closed.
- Apply or remove labels with `gh issue edit <number> --add-label "<label>"` or `--remove-label "<label>"`. Resolve triage roles using [triage-labels.md](triage-labels.md).
- Explain a closure with `gh issue comment <number> --body-file <file>`, then close the issue with `gh issue close <number>`.

## Pull requests as a triage surface

**PRs as a request surface: no.**

When set to `yes`, apply the same triage labels using `gh pr edit`. Read the PR and its diff before triage. For a bare number, check whether it points to an issue or a pull request.
