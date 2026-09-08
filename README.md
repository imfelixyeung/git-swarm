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
| `log [rev] [--after <date>] [--before <date>] [--exact-date] [--author]` | Show commit logs across all repos |
| `grep <pattern>` | Run `git grep` across all repos |
| `find-branch <branch>` | Search all repos for a branch by name |
| `remote` | List remotes for each repo |
| `exec <command...>` | Run an arbitrary shell command in every repo |
| `doctor` | Run diagnostics |

## Global Options

<!-- prettier-ignore -->
| Option | Description |
|---|---|
| `--where <query>` | Filter repos using a URL query-string syntax |
| `--parallel <count>` | Run operations in parallel (default: 1) |
| `--no-progress` | Disable the progress bar (defaults to enabled only when stdout is a TTY) |

### Filtering with `--where`

Use `--where` to selectively target repos based on branch, clean/dirty state, or remote attributes:

```bash
# Only repos on the main branch
git swarm --where "branch.eq=main" status

# Only dirty repos with a GitHub remote
git swarm --where "clean=false&remote.provider.eq=github" status

# Only repos owned by a specific user
git swarm --where "remote.owner.eq=imfelixyeung" pull

# Only repos that are ahead of their upstream by at least 2 commits
git swarm --where "ahead.gte=2" push

# Only repos on a feature branch, not touching main
git swarm --where "branch.starts-with=feature/&branch.neq=main" status

# Only repos whose remote url is under github.com/imfelixyeung
git swarm --where "remote.host.eq=github.com&remote.owner.includes=imfelix" pull
```

Available filter keys:

<!-- prettier-ignore -->
| Key | Description |
|---|---|
| `branch.*` | Current branch name |
| `clean` | Whether the working tree is clean (`true`/`false`) |
| `ahead` | Whether the branch is ahead of its upstream (`true`/`false`) |
| `behind` | Whether the branch is behind its upstream (`true`/`false`) |
| `ahead.eq` / `ahead.neq` | Compare commits ahead of upstream |
| `ahead.gte` / `ahead.gt` / `ahead.lt` / `ahead.lte` | Compare commits ahead of upstream |
| `behind.eq` / `behind.neq` | Compare commits behind upstream |
| `behind.gte` / `behind.gt` / `behind.lt` / `behind.lte` | Compare commits behind upstream |
| `upstream-branch.*` | Upstream tracking branch (e.g. `origin/main`) |
| `remote.provider.*` | Remote provider (`github`, `gitlab`, `bitbucket`) |
| `remote.owner.*` | Repository owner |
| `remote.name.*` | Repository name |
| `remote.host.*` | Remote host |
| `remote.ref.*` | Full remote URL |

String filters (`branch*`, `upstream-branch*`, `remote.*`) use operators:

<!-- prettier-ignore -->
| Operator | Description |
|---|---|
| `.eq` | Strict equality (any value matches if present) |
| `.neq` | Strict not equality |
| `.gte` / `.gt` / `.lt` / `.lte` | Lexicographic comparison against other strings |
| `.includes` | Contains the given substring |
| `.not-includes` | Does not contain the given substring |
| `.starts-with` | Starts with the given prefix |
| `.ends-with` | Ends with the given suffix |

For example, `branch.eq=main`, `remote.owner.neq=imfelixyeung`, or `branch.starts-with=feature/`.

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
git swarm --where "branch.eq=main&clean=true" pull
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
