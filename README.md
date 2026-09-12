# git-swarm

Manage multiple Git repositories with ease.

## Installation

```bash
bun install --global @imfelixyeung/git-swarm
```

Once installed, `git-swarm` is available as a Git subcommand:

```bash
git swarm [global options] <command> [options]
```

## Usage

Navigate to a parent directory containing multiple Git repositories, then run any command. `git-swarm` automatically discovers all repos nested below the current directory.

```bash
# List all discovered repos
git swarm list

# Check the status of every repo
git swarm status

# Pull from remotes across all repos
git swarm pull

# Checkout a branch everywhere
git swarm checkout feature/my-branch
```

## Commands

<!-- prettier-ignore -->
| Command | Description |
|---|---|
| `list` | List all discovered Git repositories |
| `status` | Show working tree status for all repos |
| `pull [remote] [branch]` | Pull from remotes across all repos |
| `fetch [--prune]` | Fetch from remotes across all repos |
| `checkout <branch>` | Switch to a branch across all repos |
| `diff [--cached] [--stat]` | Show file changes across all repos |
| `log [rev] [--after <date>] [--before <date>] [--exact-date] [--author] [-r]` | Show commit logs across all repos |
| `grep <pattern>` | Run `git grep` across all repos |
| `find-branch <branch>` | Search all repos for a branch by name |
| `remote` | List remotes for each repo |
| `exec <command...>` | Run an arbitrary shell command in every repo |
| `doctor` | Run diagnostics |

## Global Options

<!-- prettier-ignore -->
| Option | Description |
|---|---|
| `--where <expression>` | Filter repos using a JEXL expression |
| `--parallel <count>` | Run operations in parallel (default: 1) |
| `--no-progress` | Disable the progress bar (defaults to enabled only when stdout is a TTY) |

### Filtering with `--where`

Use `--where` to selectively target repos with a [JEXL](https://www.npmjs.com/package/jexl) expression evaluated against each repo's context:

```bash
# Only repos on the main branch
git swarm --where 'branch == "main"' status

# Only dirty repos with a GitHub remote
git swarm --where 'clean == false && remote.provider == "github"' status

# Only repos owned by a specific user
git swarm --where 'remote.owner == "imfelixyeung"' pull

# Only repos that are ahead of their upstream by at least 2 commits
git swarm --where 'ahead >= 2' push

# Only repos on a feature branch, not touching main
git swarm --where '"feature/" in branch && branch != "main"' status

# Only repos that have a branch named feature/cool
git swarm --where '"feature/cool" in branches' status

# Only repos with a tracking branch for origin/main
git swarm --where '"remotes/origin/main" in branches' status

# Only repos whose remote is hosted under github.com/imfelixyeung
git swarm --where 'remote.host == "github.com" && remote.owner == "imfelixyeung"' pull
```

Available context fields:

<!-- prettier-ignore -->
| Field | Description |
|---|---|
| `name` | Repository directory name |
| `path` | Repository path relative to the swarm root |
| `branch` | Current branch name, or `null` when detached |
| `branches` | Names of all branches, including remote-tracking branches |
| `localBranches` | Names of all local branches |
| `detached` | Whether HEAD is detached |
| `clean` | Whether the working tree is clean |
| `stagedFiles` | Number of staged files |
| `modifiedFiles` | Number of modified files |
| `untrackedFiles` | Number of untracked files |
| `ahead` | Commits ahead of the upstream |
| `behind` | Commits behind the upstream |
| `hasUpstream` | Whether an upstream is configured |
| `remote.provider` | Remote host provider (`github`, `gitlab`, `bitbucket`, `other`, or `null`) |
| `remote.host` | Remote host |
| `remote.owner` | Repository owner |
| `remote.repo` | Repository name |

The `remote.*` fields describe the `origin` remote when present, otherwise the first remote. Fields that require `git status` (branch, divergence, worktree counts, ...), the branch lists, and the `remote.*` fields are only fetched when the expression references them.

Use JEXL operators: `==`, `!=`, `<`, `<=`, `>`, `>=`, `&&`, `||`, `!`, and `in` for substring checks on strings (for example `'"issue" in branch'`) or membership checks on arrays (for example `'"feature/cool" in branches'`).

### Parallel Execution

```bash
# Run fetch across 4 repos at a time
git swarm --parallel 4 fetch

# Run arbitrary commands in parallel
git swarm --parallel 8 exec "git reset --hard origin/main"
```

## Examples

```bash
# Find which repos have a specific branch
git swarm find-branch release/v2

# Search for a pattern across all repos
git swarm grep "TODO"

# Run a command in every repo
git swarm exec "git clean -fd"

# Fetch and prune stale remote-tracking branches
git swarm fetch --prune

# Only pull repos that are behind their upstream
git swarm --where 'branch == "main" && clean' pull
```

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Develop (build with watch mode)
bun run dev

# Typecheck
bun run typecheck

# Lint and format
bun run biome

# CI checks
bun run ci

# Test
bun test
```
