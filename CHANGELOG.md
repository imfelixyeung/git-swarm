# @imfelixyeung/git-swarm

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
