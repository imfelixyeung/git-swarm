import { describe, expect, test } from "bun:test";
import type { RemoteWithRefs } from "simple-git";
import { parseGitRemoteRefs, parseGitUrl } from "./remote";

describe("parseGitUrl", () => {
    test("parses an https url", () => {
        expect(
            parseGitUrl("origin", "fetch", "https://github.com/owner/repo.git"),
        ).toEqual({
            ref: "origin",
            direction: "fetch",
            provider: "github",
            protocol: "https",
            host: "github.com",
            owner: "owner",
            name: "repo",
            fullName: "owner/repo",
            href: "https://github.com/owner/repo",
        });
    });

    test("parses an scp-like ssh url", () => {
        expect(
            parseGitUrl("origin", "push", "git@github.com:owner/repo.git"),
        ).toEqual(
            expect.objectContaining({
                ref: "origin",
                direction: "push",
                protocol: "ssh",
                provider: "github",
                host: "github.com",
                owner: "owner",
                name: "repo",
                fullName: "owner/repo",
                href: "https://github.com/owner/repo",
            }),
        );
    });

    test("parses an ssh url", () => {
        expect(
            parseGitUrl(
                "origin",
                "fetch",
                "ssh://git@github.com/owner/repo.git",
            ),
        ).toEqual(
            expect.objectContaining({
                protocol: "ssh",
                host: "github.com",
                fullName: "owner/repo",
            }),
        );
    });

    test("parses an http url", () => {
        expect(
            parseGitUrl("origin", "fetch", "http://github.com/owner/repo.git"),
        ).toEqual(
            expect.objectContaining({
                protocol: "http",
                host: "github.com",
            }),
        );
    });

    test("detects gitlab provider", () => {
        expect(
            parseGitUrl("origin", "fetch", "https://gitlab.com/owner/repo.git"),
        ).toEqual(
            expect.objectContaining({
                provider: "gitlab",
                host: "gitlab.com",
            }),
        );
    });

    test("detects bitbucket provider", () => {
        expect(
            parseGitUrl(
                "origin",
                "fetch",
                "https://bitbucket.org/owner/repo.git",
            ),
        ).toEqual(
            expect.objectContaining({
                provider: "bitbucket",
                host: "bitbucket.org",
            }),
        );
    });

    test("falls back to unknown provider", () => {
        expect(
            parseGitUrl(
                "origin",
                "fetch",
                "https://example.com/owner/repo.git",
            ),
        ).toEqual(
            expect.objectContaining({
                provider: "unknown",
            }),
        );
    });

    test("matches provider case-insensitively", () => {
        expect(
            parseGitUrl("origin", "fetch", "https://GITHUB.COM/owner/repo.git"),
        ).toEqual(
            expect.objectContaining({
                provider: "github",
                host: "github.com",
            }),
        );
    });

    test("strips authentication details from the host", () => {
        expect(
            parseGitUrl(
                "origin",
                "fetch",
                "https://token@github.com/owner/repo.git",
            ),
        ).toEqual(
            expect.objectContaining({
                host: "github.com",
            }),
        );
    });

    test("trims surrounding whitespace", () => {
        expect(
            parseGitUrl(
                "origin",
                "fetch",
                "  https://github.com/owner/repo.git \n",
            ),
        ).toEqual(
            expect.objectContaining({
                host: "github.com",
                name: "repo",
            }),
        );
    });

    test("strips trailing slash", () => {
        expect(
            parseGitUrl("origin", "fetch", "https://github.com/owner/repo/"),
        ).toEqual(
            expect.objectContaining({
                fullName: "owner/repo",
                name: "repo",
            }),
        );
    });

    test("keeps nested paths in the full name", () => {
        expect(
            parseGitUrl("origin", "fetch", "https://github.com/a/b/c/repo.git"),
        ).toEqual(
            expect.objectContaining({
                owner: "a",
                name: "repo",
                fullName: "a/b/c/repo",
            }),
        );
    });

    test("returns null for an empty url", () => {
        expect(parseGitUrl("origin", "fetch", "")).toBeNull();
    });

    test("returns null for a non-string url", () => {
        expect(
            parseGitUrl("origin", "fetch", undefined as unknown as string),
        ).toBeNull();
    });

    test("returns null for an invalid url", () => {
        expect(parseGitUrl("origin", "fetch", "not a url")).toBeNull();
    });

    test("returns null when the path has fewer than two segments", () => {
        expect(
            parseGitUrl("origin", "fetch", "https://github.com/single.git"),
        ).toBeNull();
    });
});

describe("parseGitRemoteRefs", () => {
    test("returns an empty array for no remotes", () => {
        expect(parseGitRemoteRefs([])).toEqual([]);
    });

    test("returns one entry per direction", () => {
        const refs: RemoteWithRefs[] = [
            {
                name: "origin",
                refs: {
                    fetch: "https://github.com/owner/repo.git",
                    push: "https://github.com/owner/repo.git",
                },
            },
        ];

        expect(parseGitRemoteRefs(refs)).toEqual([
            expect.objectContaining({ ref: "origin", direction: "fetch" }),
            expect.objectContaining({ ref: "origin", direction: "push" }),
        ]);
    });

    test("parses distinct fetch and push urls", () => {
        const refs: RemoteWithRefs[] = [
            {
                name: "origin",
                refs: {
                    fetch: "https://github.com/owner/repo.git",
                    push: "git@github.com:owner/repo.git",
                },
            },
        ];

        const result = parseGitRemoteRefs(refs);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual(
            expect.objectContaining({ direction: "fetch", protocol: "https" }),
        );
        expect(result[1]).toEqual(
            expect.objectContaining({ direction: "push", protocol: "ssh" }),
        );
    });

    test("flattens multiple remotes", () => {
        const refs: RemoteWithRefs[] = [
            {
                name: "origin",
                refs: {
                    fetch: "https://github.com/owner/repo.git",
                    push: "https://github.com/owner/repo.git",
                },
            },
            {
                name: "upstream",
                refs: {
                    fetch: "https://github.com/upstream/repo.git",
                    push: "https://github.com/upstream/repo.git",
                },
            },
        ];

        expect(parseGitRemoteRefs(refs)).toEqual([
            expect.objectContaining({ ref: "origin", direction: "fetch" }),
            expect.objectContaining({ ref: "origin", direction: "push" }),
            expect.objectContaining({ ref: "upstream", direction: "fetch" }),
            expect.objectContaining({ ref: "upstream", direction: "push" }),
        ]);
    });

    test("filters out unparseable urls", () => {
        const refs: RemoteWithRefs[] = [
            {
                name: "origin",
                refs: {
                    fetch: "",
                    push: "https://github.com/owner/repo.git",
                },
            },
        ];

        expect(parseGitRemoteRefs(refs)).toEqual([
            expect.objectContaining({ ref: "origin", direction: "push" }),
        ]);
    });
});
