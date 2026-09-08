---
"@imfelixyeung/git-swarm": minor
---

Migrate `--where` filtering from a URL query-string syntax to JEXL expressions evaluated against a rich per-repo context (`branch`, `branches`, `localBranches`, `clean`, `ahead`, `behind`, `remote.*`, and more)