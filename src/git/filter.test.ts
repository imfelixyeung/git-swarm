import { describe, expect, test } from "bun:test";
import type { RemoteWithRefs, SimpleGit, StatusResult } from "simple-git";
import type { GitRepository } from "./discover";
import { parseQueryString, repoMatchesFilter } from "./filter";

type StatusOverrides = Partial<
    Pick<StatusResult, "ahead" | "behind" | "current" | "tracking">
>;

const makeStatus = (overrides: StatusOverrides = {}): StatusResult =>
    ({
        current: "main",
        tracking: "origin/main",
        ahead: 0,
        behind: 0,
        isClean: () => true,
        ...overrides,
    }) as StatusResult;

const makeRepo = (
    statusOverrides: StatusOverrides = {},
    remotes: RemoteWithRefs[] = [],
): GitRepository => {
    const git = {
        status: async () => makeStatus(statusOverrides),
        getRemotes: async () => remotes,
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

describe("parseQueryString", () => {
    test("parses ahead and behind filters", () => {
        expect(
            parseQueryString(
                "ahead=true&behind=true&upstream-branch.eq=origin/main",
            ),
        ).toEqual({
            ahead: true,
            behind: true,
            "upstream-branch.eq": ["origin/main"],
        });
    });

    test("parses numeric ahead and behind comparisons", () => {
        expect(
            parseQueryString(
                "ahead.gte=2&ahead.gt=1&ahead.lt=10&ahead.lte=5&behind.gte=3",
            ),
        ).toEqual({
            "ahead.gte": 2,
            "ahead.gt": 1,
            "ahead.lt": 10,
            "ahead.lte": 5,
            "behind.gte": 3,
        });
    });

    test("rejects non-numeric comparison values", () => {
        expect(() => parseQueryString("ahead.gte=foo")).toThrow(
            "Invalid filter query",
        );
    });

    test("parses string filter operators", () => {
        expect(
            parseQueryString(
                "branch.eq=feat/x&branch.neq=max&branch.includes=feat&branch.not-includes=wip&branch.starts-with=feat/&branch.ends-with=-hotfix&remote.owner.eq=imfelixyeung&remote.name.neq=origin",
            ),
        ).toEqual({
            "branch.eq": ["feat/x"],
            "branch.neq": ["max"],
            "branch.includes": ["feat"],
            "branch.not-includes": ["wip"],
            "branch.starts-with": ["feat/"],
            "branch.ends-with": ["-hotfix"],
            "remote.owner.eq": ["imfelixyeung"],
            "remote.name.neq": ["origin"],
        });
    });

    test("rejects bare string equality and .not operators", () => {
        expect(() => parseQueryString("branch=main")).toThrow(
            'unknown filter: "branch"',
        );
        expect(() => parseQueryString("branch.not=main")).toThrow(
            'unknown filter: "branch.not"',
        );
    });

    test("rejects unknown string filter operators", () => {
        expect(() => parseQueryString("branch.foo=bar")).toThrow(
            'unknown filter: "branch.foo"',
        );
    });
});

describe("repoMatchesFilter", () => {
    describe("ahead", () => {
        test("matches a repo with ahead commits", async () => {
            const repo = makeRepo({ ahead: 3 });
            expect(
                await repoMatchesFilter(repo, parseQueryString("ahead=true")),
            ).toBe(true);
        });

        test("rejects a repo with no ahead commits", async () => {
            const repo = makeRepo({ ahead: 0 });
            expect(
                await repoMatchesFilter(repo, parseQueryString("ahead=true")),
            ).toBe(false);
        });

        test("ahead=false matches a repo that is not ahead", async () => {
            const repo = makeRepo({ ahead: 0 });
            expect(
                await repoMatchesFilter(repo, parseQueryString("ahead=false")),
            ).toBe(true);
        });

        test(".eq and .neq comparisons", async () => {
            const repo = makeRepo({ ahead: 5 });
            expect(
                await repoMatchesFilter(repo, parseQueryString("ahead.eq=5")),
            ).toBe(true);
            expect(
                await repoMatchesFilter(repo, parseQueryString("ahead.eq=4")),
            ).toBe(false);
            expect(
                await repoMatchesFilter(repo, parseQueryString("ahead.neq=4")),
            ).toBe(true);
            expect(
                await repoMatchesFilter(repo, parseQueryString("ahead.neq=5")),
            ).toBe(false);
        });

        test(".gte, .gt, .lt, .lte comparisons", async () => {
            const repo = makeRepo({ ahead: 5 });
            expect(
                await repoMatchesFilter(repo, parseQueryString("ahead.gte=5")),
            ).toBe(true);
            expect(
                await repoMatchesFilter(repo, parseQueryString("ahead.gt=5")),
            ).toBe(false);
            expect(
                await repoMatchesFilter(repo, parseQueryString("ahead.lt=6")),
            ).toBe(true);
            expect(
                await repoMatchesFilter(repo, parseQueryString("ahead.lte=5")),
            ).toBe(true);
            expect(
                await repoMatchesFilter(repo, parseQueryString("ahead.lte=4")),
            ).toBe(false);
        });
    });

    describe("behind", () => {
        test("matches a repo with behind commits", async () => {
            const repo = makeRepo({ behind: 2 });
            expect(
                await repoMatchesFilter(repo, parseQueryString("behind=true")),
            ).toBe(true);
        });

        test(".gte, .gt, .lt, .lte comparisons", async () => {
            const repo = makeRepo({ behind: 3 });
            expect(
                await repoMatchesFilter(repo, parseQueryString("behind.gt=2")),
            ).toBe(true);
            expect(
                await repoMatchesFilter(repo, parseQueryString("behind.lt=3")),
            ).toBe(false);
            expect(
                await repoMatchesFilter(repo, parseQueryString("behind.gte=3")),
            ).toBe(true);
        });
    });

    describe("branch", () => {
        test("matches strict equality", async () => {
            const repo = makeRepo({ current: "main" });
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("branch.eq=main"),
                ),
            ).toBe(true);
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("branch.eq=dev"),
                ),
            ).toBe(false);
        });

        test("branch.neq uses strict not equality", async () => {
            const repo = makeRepo({ current: "main" });
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("branch.neq=dev"),
                ),
            ).toBe(true);
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("branch.neq=main"),
                ),
            ).toBe(false);
        });

        test("string comparison operators", async () => {
            const repo = makeRepo({ current: "develop" });
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("branch.gte=abc"),
                ),
            ).toBe(true);
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("branch.gt=develop"),
                ),
            ).toBe(false);
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("branch.lt=develop"),
                ),
            ).toBe(false);
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("branch.lte=develop"),
                ),
            ).toBe(true);
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("branch.gte=zoo"),
                ),
            ).toBe(false);
        });

        test("includes and not-includes", async () => {
            const repo = makeRepo({ current: "feature/parser" });
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("branch.includes=feature/"),
                ),
            ).toBe(true);
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("branch.not-includes=feature/"),
                ),
            ).toBe(false);
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("branch.includes=bugfix"),
                ),
            ).toBe(false);
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("branch.not-includes=bugfix"),
                ),
            ).toBe(true);
        });

        test("starts-with and ends-with", async () => {
            const repo = makeRepo({ current: "feature/parser" });
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("branch.starts-with=feature/"),
                ),
            ).toBe(true);
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("branch.ends-with=parser"),
                ),
            ).toBe(true);
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("branch.starts-with=release"),
                ),
            ).toBe(false);
        });
    });

    describe("upstream-branch", () => {
        test("matches the upstream tracking branch", async () => {
            const repo = makeRepo({ tracking: "origin/main" });
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("upstream-branch.eq=origin/main"),
                ),
            ).toBe(true);
        });

        test("rejects a non-matching upstream", async () => {
            const repo = makeRepo({ tracking: "origin/develop" });
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("upstream-branch.eq=origin/main"),
                ),
            ).toBe(false);
        });
    });

    describe("remote", () => {
        const repo = makeRepo({}, [
            makeRemote(
                "origin",
                "https://github.com/imfelixyeung/git-swarm.git",
            ),
            makeRemote(
                "upstream",
                "https://gitlab.com/imfelixyeung/upstream.git",
            ),
        ]);

        test("matches strict equality on owner", async () => {
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("remote.owner.eq=imfelixyeung"),
                ),
            ).toBe(true);
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("remote.owner.eq=nope"),
                ),
            ).toBe(false);
        });

        test("remote.owner.neq requires no matching remote", async () => {
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("remote.owner.neq=nope"),
                ),
            ).toBe(true);
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("remote.owner.neq=imfelixyeung"),
                ),
            ).toBe(false);
        });

        test("matches includes on host", async () => {
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("remote.host.includes=github"),
                ),
            ).toBe(true);
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("remote.host.includes=bitbucket"),
                ),
            ).toBe(false);
        });

        test("matches starts-with on provider", async () => {
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("remote.provider.starts-with=git"),
                ),
            ).toBe(true);
            expect(
                await repoMatchesFilter(
                    repo,
                    parseQueryString("remote.provider.starts-with=bit"),
                ),
            ).toBe(false);
        });
    });

    test("no filters matches everything", async () => {
        const repo = makeRepo();
        expect(await repoMatchesFilter(repo, parseQueryString(""))).toBe(true);
    });
});
