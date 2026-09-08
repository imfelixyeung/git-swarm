import { describe, expect, mock, test } from "bun:test";
import type {
    BranchSummary,
    RemoteWithRefs,
    SimpleGit,
    StatusResult,
} from "simple-git";
import type { GitRepository } from "./discover";
import { compileQuery, repoMatchesFilter } from "./filter";

type StatusOverrides = Partial<
    Pick<
        StatusResult,
        | "ahead"
        | "behind"
        | "current"
        | "tracking"
        | "detached"
        | "staged"
        | "modified"
        | "not_added"
        | "isClean"
    >
>;

const makeStatus = (overrides: StatusOverrides = {}): StatusResult =>
    ({
        current: "main",
        tracking: "origin/main",
        ahead: 0,
        behind: 0,
        detached: false,
        staged: [],
        modified: [],
        not_added: [],
        isClean: () => true,
        ...overrides,
    }) as StatusResult;

type BranchList = {
    local: string[];
    all: string[];
};

const defaultBranches: BranchList = {
    local: ["main", "dev"],
    all: ["main", "dev", "remotes/origin/main"],
};

const makeBranchSummary = (names: string[]): BranchSummary =>
    ({
        current: names[0] ?? "",
        detached: false,
        all: names,
        branches: Object.fromEntries(names.map((name) => [name, { name }])),
    }) as BranchSummary;

const makeRepo = (
    statusOverrides: StatusOverrides = {},
    remotes: RemoteWithRefs[] = [],
    branches: BranchList = defaultBranches,
): GitRepository => {
    const git = {
        status: mock(async () => makeStatus(statusOverrides)),
        branch: mock(async () => makeBranchSummary(branches.all)),
        branchLocal: mock(async () => makeBranchSummary(branches.local)),
        getRemotes: mock(async () => remotes),
    } as unknown as SimpleGit;
    return {
        path: { absolute: "/tmp/foo", relative: "foo" },
        git,
    };
};

const makeRemote = (name: string, fetch: string): RemoteWithRefs => ({
    name,
    refs: { fetch, push: fetch },
});

const gitHubRemote = makeRemote(
    "origin",
    "https://github.com/imfelixyeung/git-swarm.git",
);

const matches = (repo: GitRepository, expression: string) =>
    repoMatchesFilter(repo, compileQuery(expression));

describe("compileQuery", () => {
    test("compiles a valid expression", () => {
        const query = compileQuery('branch == "main" && clean');
        expect(query.expression).not.toBeNull();
    });

    test("returns a null expression for empty input", () => {
        expect(compileQuery("").expression).toBeNull();
        expect(compileQuery("   ").expression).toBeNull();
    });

    test("throws on invalid syntax", () => {
        expect(() => compileQuery('branch == "main" &&')).toThrow();
        expect(() => compileQuery("clean &&")).toThrow();
    });
});

describe("repoMatchesFilter", () => {
    test("no expression matches everything without running git", async () => {
        const repo = makeRepo();
        expect(await repoMatchesFilter(repo, compileQuery(""))).toBe(true);
        expect(repo.git.status).toHaveBeenCalledTimes(0);
        expect(repo.git.getRemotes).toHaveBeenCalledTimes(0);
    });

    describe("ahead", () => {
        test("matches a repo with ahead commits", async () => {
            const repo = makeRepo({ ahead: 3 });
            expect(await matches(repo, "ahead > 0")).toBe(true);
        });

        test("rejects a repo with no ahead commits", async () => {
            const repo = makeRepo({ ahead: 0 });
            expect(await matches(repo, "ahead > 0")).toBe(false);
            expect(await matches(repo, "ahead")).toBe(false);
        });

        test(".eq and .neq comparisons", async () => {
            const repo = makeRepo({ ahead: 5 });
            expect(await matches(repo, "ahead == 5")).toBe(true);
            expect(await matches(repo, "ahead == 4")).toBe(false);
            expect(await matches(repo, "ahead != 4")).toBe(true);
            expect(await matches(repo, "ahead != 5")).toBe(false);
        });

        test(".gte, .gt, .lt, .lte comparisons", async () => {
            const repo = makeRepo({ ahead: 5 });
            expect(await matches(repo, "ahead >= 5")).toBe(true);
            expect(await matches(repo, "ahead > 5")).toBe(false);
            expect(await matches(repo, "ahead < 6")).toBe(true);
            expect(await matches(repo, "ahead <= 5")).toBe(true);
            expect(await matches(repo, "ahead <= 4")).toBe(false);
        });
    });

    describe("behind", () => {
        test("matches a repo with behind commits", async () => {
            const repo = makeRepo({ behind: 2 });
            expect(await matches(repo, "behind > 0")).toBe(true);
        });

        test("numeric comparisons", async () => {
            const repo = makeRepo({ behind: 3 });
            expect(await matches(repo, "behind > 2")).toBe(true);
            expect(await matches(repo, "behind < 3")).toBe(false);
            expect(await matches(repo, "behind >= 3")).toBe(true);
            expect(await matches(repo, "behind == 3")).toBe(true);
        });
    });

    describe("working tree", () => {
        test("matches clean repos", async () => {
            const repo = makeRepo();
            expect(await matches(repo, "clean")).toBe(true);
            expect(await matches(repo, "!clean")).toBe(false);
        });

        test("matches dirty repos by file counts", async () => {
            const repo = makeRepo({
                isClean: () => false,
                staged: ["a.txt"],
                modified: ["b.txt", "c.txt"],
                not_added: ["d.txt"],
            });
            expect(await matches(repo, "clean == false")).toBe(true);
            expect(await matches(repo, "stagedFiles == 1")).toBe(true);
            expect(await matches(repo, "modifiedFiles >= 2")).toBe(true);
            expect(await matches(repo, "untrackedFiles > 0")).toBe(true);
            expect(await matches(repo, "modifiedFiles == 3")).toBe(false);
        });
    });

    describe("branch", () => {
        test("matches strict equality", async () => {
            const repo = makeRepo({ current: "main" });
            expect(await matches(repo, 'branch == "main"')).toBe(true);
            expect(await matches(repo, 'branch == "dev"')).toBe(false);
        });

        test("strict not equality", async () => {
            const repo = makeRepo({ current: "main" });
            expect(await matches(repo, 'branch != "dev"')).toBe(true);
            expect(await matches(repo, 'branch != "main"')).toBe(false);
        });

        test("lexicographic comparisons", async () => {
            const repo = makeRepo({ current: "develop" });
            expect(await matches(repo, 'branch >= "abc"')).toBe(true);
            expect(await matches(repo, 'branch > "develop"')).toBe(false);
            expect(await matches(repo, 'branch < "develop"')).toBe(false);
            expect(await matches(repo, 'branch <= "develop"')).toBe(true);
            expect(await matches(repo, 'branch >= "zoo"')).toBe(false);
        });

        test("includes substring with the in operator", async () => {
            const repo = makeRepo({ current: "feature/parser" });
            expect(await matches(repo, '"feature/" in branch')).toBe(true);
            expect(await matches(repo, '"bugfix" in branch')).toBe(false);
            expect(await matches(repo, '!("bugfix" in branch)')).toBe(true);
        });

        test("matches a detached HEAD", async () => {
            const repo = makeRepo({
                current: "",
                tracking: "",
                detached: true,
            });
            expect(await matches(repo, "detached")).toBe(true);
            expect(await matches(repo, "branch == null")).toBe(true);
        });
    });

    describe("branches", () => {
        test("matches a repo containing a branch", async () => {
            const repo = makeRepo({}, [], {
                local: ["main", "release/v2", "feature/x"],
                all: ["main", "release/v2", "feature/x", "remotes/origin/main"],
            });
            expect(await matches(repo, '"release/v2" in branches')).toBe(true);
            expect(await matches(repo, '"bugfix" in branches')).toBe(false);
            expect(await matches(repo, '!("bugfix" in branches)')).toBe(true);
        });

        test("includes remote-tracking branches", async () => {
            const repo = makeRepo();
            expect(await matches(repo, '"main" in branches')).toBe(true);
            expect(
                await matches(repo, '"remotes/origin/main" in branches'),
            ).toBe(true);
        });

        test("indexes into the branch list", async () => {
            const repo = makeRepo();
            expect(await matches(repo, 'branches[0] == "main"')).toBe(true);
            expect(await matches(repo, 'branches[1] == "dev"')).toBe(true);
            expect(await matches(repo, 'branches[3] == "dev"')).toBe(false);
        });

        test("exposes an empty list for repos without branches", async () => {
            const repo = makeRepo({}, [], { local: [], all: [] });
            expect(await matches(repo, '"main" in branches')).toBe(false);
            expect(await matches(repo, '!("main" in branches)')).toBe(true);
        });
    });

    describe("localBranches", () => {
        test("matches a repo containing a local branch", async () => {
            const repo = makeRepo({}, [], {
                local: ["main", "release/v2"],
                all: ["main", "release/v2", "remotes/origin/main"],
            });
            expect(await matches(repo, '"release/v2" in localBranches')).toBe(
                true,
            );
            expect(await matches(repo, '"bugfix" in localBranches')).toBe(
                false,
            );
            expect(await matches(repo, '!("bugfix" in localBranches)')).toBe(
                true,
            );
        });

        test("excludes remote-tracking branches", async () => {
            const repo = makeRepo();
            expect(
                await matches(repo, '"remotes/origin/main" in localBranches'),
            ).toBe(false);
        });

        test("indexes into the local branch list", async () => {
            const repo = makeRepo();
            expect(await matches(repo, 'localBranches[0] == "main"')).toBe(
                true,
            );
            expect(await matches(repo, 'localBranches[1] == "dev"')).toBe(true);
        });

        test("exposes an empty list for repos without local branches", async () => {
            const repo = makeRepo({}, [], {
                local: [],
                all: ["remotes/origin/main"],
            });
            expect(await matches(repo, '"main" in localBranches')).toBe(false);
            expect(await matches(repo, '!("main" in localBranches)')).toBe(
                true,
            );
        });
    });

    describe("upstream", () => {
        test("reports repos with an upstream", async () => {
            const repo = makeRepo({ tracking: "origin/main" });
            expect(await matches(repo, "hasUpstream")).toBe(true);
            expect(await matches(repo, 'branch == "main" && hasUpstream')).toBe(
                true,
            );
        });

        test("combines branch and divergence", async () => {
            const repo = makeRepo({ tracking: "origin/main" });
            expect(await matches(repo, 'branch == "main" && behind > 0')).toBe(
                false,
            );
        });

        test("reports repos without an upstream", async () => {
            const repo = makeRepo({ tracking: "" });
            expect(await matches(repo, "hasUpstream == false")).toBe(true);
        });
    });

    describe("name and path", () => {
        test("exposes the repo directory name and relative path", async () => {
            const repo = makeRepo();
            expect(await matches(repo, 'name == "foo" && path == "foo"')).toBe(
                true,
            );
            expect(await matches(repo, 'name == "bar"')).toBe(false);
        });
    });

    describe("remote", () => {
        const gitHubRemote = makeRemote(
            "origin",
            "https://github.com/imfelixyeung/git-swarm.git",
        );
        const gitLabRemote = makeRemote(
            "upstream",
            "https://gitlab.com/imfelixyeung/upstream.git",
        );

        test("matches strict equality on owner", async () => {
            const repo = makeRepo({}, [gitHubRemote, gitLabRemote]);
            expect(await matches(repo, 'remote.owner == "imfelixyeung"')).toBe(
                true,
            );
            expect(await matches(repo, 'remote.owner == "nope"')).toBe(false);
        });

        test("uses the origin remote when present", async () => {
            const repo = makeRepo({}, [gitHubRemote, gitLabRemote]);
            expect(await matches(repo, 'remote.host == "github.com"')).toBe(
                true,
            );
            expect(await matches(repo, 'remote.repo == "git-swarm"')).toBe(
                true,
            );
            expect(await matches(repo, 'remote.provider == "github"')).toBe(
                true,
            );
        });

        test("matches unknown providers as other", async () => {
            const repo = makeRepo({}, [
                makeRemote("origin", "https://example.com/acme/thing.git"),
            ]);
            expect(await matches(repo, 'remote.provider == "other"')).toBe(
                true,
            );
            expect(await matches(repo, 'remote.provider == "github"')).toBe(
                false,
            );
        });

        test("exposes null remote fields when there is no remote", async () => {
            const repo = makeRepo({});
            expect(await matches(repo, "remote.owner == null")).toBe(true);
            expect(await matches(repo, 'remote.owner == "imfelixyeung"')).toBe(
                false,
            );
        });
    });

    describe("compound expressions", () => {
        test("matches the documented examples", async () => {
            const repo = makeRepo({ ahead: 0, behind: 2 }, [gitHubRemote]);
            expect(
                await matches(repo, 'branch == "main" && clean && behind > 0'),
            ).toBe(true);
            expect(await matches(repo, 'remote.provider == "github"')).toBe(
                true,
            );
            expect(
                await matches(repo, 'branch == "main" && clean && ahead > 0'),
            ).toBe(false);
        });
    });

    describe("lazy git calls", () => {
        test("references only git status when it does not touch remotes", async () => {
            const repo = makeRepo({ ahead: 2 });
            expect(await matches(repo, "clean && ahead > 1")).toBe(true);
            expect(repo.git.status).toHaveBeenCalledTimes(1);
            expect(repo.git.getRemotes).toHaveBeenCalledTimes(0);
        });

        test("references only remotes for remote expressions", async () => {
            const repo = makeRepo({}, [gitHubRemote]);
            expect(await matches(repo, 'remote.host == "github.com"')).toBe(
                true,
            );
            expect(repo.git.status).toHaveBeenCalledTimes(0);
            expect(repo.git.getRemotes).toHaveBeenCalledTimes(1);
        });

        test("fetches all branches only when referenced", async () => {
            const repo = makeRepo();
            expect(
                await matches(repo, '"remotes/origin/main" in branches'),
            ).toBe(true);
            expect(repo.git.branch).toHaveBeenCalledTimes(1);
            expect(repo.git.branchLocal).toHaveBeenCalledTimes(0);
            expect(repo.git.status).toHaveBeenCalledTimes(0);
            expect(repo.git.getRemotes).toHaveBeenCalledTimes(0);
        });

        test("fetches local branches only when referenced", async () => {
            const repo = makeRepo();
            expect(await matches(repo, '"dev" in localBranches')).toBe(true);
            expect(repo.git.branchLocal).toHaveBeenCalledTimes(1);
            expect(repo.git.branch).toHaveBeenCalledTimes(0);
            expect(repo.git.status).toHaveBeenCalledTimes(0);
            expect(repo.git.getRemotes).toHaveBeenCalledTimes(0);
        });
    });

    describe("error handling", () => {
        test("returns false when git status fails", async () => {
            const repo = makeRepo();
            repo.git.status = (async () => {
                throw new Error("boom");
            }) as unknown as SimpleGit["status"];
            expect(await matches(repo, "clean")).toBe(false);
        });

        test("returns false when reading remotes fails", async () => {
            const repo = makeRepo();
            repo.git.getRemotes = (async () => {
                throw new Error("boom");
            }) as unknown as SimpleGit["getRemotes"];
            expect(await matches(repo, 'remote.host == "github.com"')).toBe(
                false,
            );
        });

        test("returns false when reading all branches fails", async () => {
            const repo = makeRepo();
            repo.git.branch = (async () => {
                throw new Error("boom");
            }) as unknown as SimpleGit["branch"];
            expect(await matches(repo, '"main" in branches')).toBe(false);
        });

        test("returns false when reading local branches fails", async () => {
            const repo = makeRepo();
            repo.git.branchLocal = (async () => {
                throw new Error("boom");
            }) as unknown as SimpleGit["branchLocal"];
            expect(await matches(repo, '"main" in localBranches')).toBe(false);
        });
    });
});
