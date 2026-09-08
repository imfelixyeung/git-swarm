# @imfelixyeung/git-swarm

## 0.3.0

### Minor Changes

- [#39](https://github.com/imfelixyeung/git-swarm/pull/39) [`fb97ed2`](https://github.com/imfelixyeung/git-swarm/commit/fb97ed22271e76cbe3b5f6dcef0f5a1f9102105f) Thanks [@imfelixyeung](https://github.com/imfelixyeung)! - Migrate `--where` filtering from a URL query-string syntax to JEXL expressions evaluated against a rich per-repo context (`branch`, `branches`, `localBranches`, `clean`, `ahead`, `behind`, `remote.*`, and more)

## 0.2.0

### Minor Changes

- [#36](https://github.com/imfelixyeung/git-swarm/pull/36) [`c349870`](https://github.com/imfelixyeung/git-swarm/commit/c3498700ea3aa697b1d16ba1ef626eda2517ae23) Thanks [@imfelixyeung](https://github.com/imfelixyeung)! - Add `--all` option to the `log` command to show commits on all branches

### Patch Changes

- [#38](https://github.com/imfelixyeung/git-swarm/pull/38) [`ac06e12`](https://github.com/imfelixyeung/git-swarm/commit/ac06e12c8faed1cbd2b051404c5324a3a2f75e85) Thanks [@imfelixyeung](https://github.com/imfelixyeung)! - feat: colourise command output consistently

  - Colorise `fetch` and `pull` summaries (additions green, deletions red, "already up-to-date" gray)
  - Colorise `status` divergence, `checkout` result, `log` hash, and `grep` file:line prefix

- [#34](https://github.com/imfelixyeung/git-swarm/pull/34) [`a7a6438`](https://github.com/imfelixyeung/git-swarm/commit/a7a6438fb035b43054506e1d0ddc5a921efd2401) Thanks [@imfelixyeung](https://github.com/imfelixyeung)! - Improve build configuration with minification and source maps

- [#33](https://github.com/imfelixyeung/git-swarm/pull/33) [`5a70630`](https://github.com/imfelixyeung/git-swarm/commit/5a7063021e8b67315a3842864b7d7c268422ccac) Thanks [@imfelixyeung](https://github.com/imfelixyeung)! - feat(doctor): add doctor command for repository diagnostics

- [#37](https://github.com/imfelixyeung/git-swarm/pull/37) [`e48c962`](https://github.com/imfelixyeung/git-swarm/commit/e48c9621f574b5e3321910c879de74d5f3aa4939) Thanks [@imfelixyeung](https://github.com/imfelixyeung)! - feat: add progress bar for visualising swarm progress

## 0.1.2

### Patch Changes

- [#32](https://github.com/imfelixyeung/git-swarm/pull/32) [`706a618`](https://github.com/imfelixyeung/git-swarm/commit/706a6182598fef8e62a5a6ddba2169211ec4003e) Thanks [@imfelixyeung](https://github.com/imfelixyeung)! - refactor: use pluralize-esm to improve code readability

- [#25](https://github.com/imfelixyeung/git-swarm/pull/25) [`e707599`](https://github.com/imfelixyeung/git-swarm/commit/e7075999b7b12d90cd494e5767519812175add9d) Thanks [@imfelixyeung](https://github.com/imfelixyeung)! - Add log command to show commit logs across all repos

- [#30](https://github.com/imfelixyeung/git-swarm/pull/30) [`33ee961`](https://github.com/imfelixyeung/git-swarm/commit/33ee961128e99a4761e0dfa6eb8614680a4ca720) Thanks [@imfelixyeung](https://github.com/imfelixyeung)! - Validate configured repository paths and exit non-zero with a hint to run `git-swarm config refresh` when a path is missing, not a directory, or not a git repository

- [#31](https://github.com/imfelixyeung/git-swarm/pull/31) [`3a342ef`](https://github.com/imfelixyeung/git-swarm/commit/3a342efffb21ad3156d896f90d0c3c935f275313) Thanks [@imfelixyeung](https://github.com/imfelixyeung)! - fix: add options validation and error handling

- [#28](https://github.com/imfelixyeung/git-swarm/pull/28) [`0a4c0f6`](https://github.com/imfelixyeung/git-swarm/commit/0a4c0f60f2ad9f0f43d6b7594ca4717c7dc5be14) Thanks [@imfelixyeung](https://github.com/imfelixyeung)! - Optimise repo discovery by skipping git subprocesses when filters are absent and applying the `--parallel` option to filtering

- [#27](https://github.com/imfelixyeung/git-swarm/pull/27) [`6f9341c`](https://github.com/imfelixyeung/git-swarm/commit/6f9341c4544090c0a15cc660b5ef92fce49d8259) Thanks [@imfelixyeung](https://github.com/imfelixyeung)! - Strip dependencies from published package.json since the CLI is fully bundled

- [#29](https://github.com/imfelixyeung/git-swarm/pull/29) [`d309a56`](https://github.com/imfelixyeung/git-swarm/commit/d309a5645a09e2d4fa6e45abcf731a50c51b465f) Thanks [@imfelixyeung](https://github.com/imfelixyeung)! - Report per-repository failures to stderr, exit non-zero when any repo fails during pull/fetch/checkout/diff, and drop the unused label parameter from forEachRepo

## 0.1.1

### Patch Changes

- [#19](https://github.com/imfelixyeung/git-swarm/pull/19) [`ffc76de`](https://github.com/imfelixyeung/git-swarm/commit/ffc76de5b9db7cedb7873c9be41668cf5af95051) Thanks [@imfelixyeung](https://github.com/imfelixyeung)! - Automatically add json schema to yaml config file

- [#21](https://github.com/imfelixyeung/git-swarm/pull/21) [`6a49cc2`](https://github.com/imfelixyeung/git-swarm/commit/6a49cc20ed52278a8f3cbbbc03c4013413dd2aca) Thanks [@imfelixyeung](https://github.com/imfelixyeung)! - Fix yaml schema generation to exclude default json schema version

## 0.1.0

### Minor Changes

- [#17](https://github.com/imfelixyeung/git-swarm/pull/17) [`8c6ca22`](https://github.com/imfelixyeung/git-swarm/commit/8c6ca22a648c2b48b36b9077e62df418917aeb72) Thanks [@imfelixyeung](https://github.com/imfelixyeung)! - Add changesets for automatic releases
