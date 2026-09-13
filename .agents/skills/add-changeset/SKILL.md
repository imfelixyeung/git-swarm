---
name: add-changeset
description: Add or prepare a changeset to the project.
---

## What I do

1. Inspect the current changes (e.g. `git diff` and recent commits) and prepare a concise summary.
2. Write the summary following the [Conventional Commits](https://www.conventionalcommits.org) style, e.g. `feat:`, `fix:`, or `perf:`.
3. Determine the bump kind:
   - `patch` for bug fixes / backwards-compatible changes
   - `minor` for new features / backwards-compatible additions
   - `major` for breaking changes
   If you are unsure which kind to pick, ask the user.
4. Run:
   `bun run changeset add --[kind]='@imfelixyeung/git-swarm' -m='[message]'`
   - `[kind]` is `patch`, `minor`, or `major`
   - `[message]` is the summary you prepared above
   - The package name MUST be `@imfelixyeung/git-swarm`

Example: `bun run changeset add --patch='@imfelixyeung/git-swarm' -m='fix: handle missing remote config'`

## When to use me

Use this when preparing to add a changeset to the project.
