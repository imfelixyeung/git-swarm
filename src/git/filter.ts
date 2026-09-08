import { basename } from "node:path";
import jexl from "jexl";
import type { RemoteWithRefs } from "simple-git";
import type { GitRepository } from "./discover";
import { type GitProvider, parseGitRemoteRefs } from "./remote";

export interface RepoQueryContext {
    name: string;
    path: string;

    branch: string | null;
    branches: string[];
    localBranches: string[];
    detached: boolean;

    clean: boolean;
    stagedFiles: number;
    modifiedFiles: number;
    untrackedFiles: number;

    ahead: number;
    behind: number;
    hasUpstream: boolean;

    remote: {
        provider: "github" | "gitlab" | "bitbucket" | "other" | null;
        host: string | null;
        owner: string | null;
        repo: string | null;
    };
}

export type RepoQueryExpression = ReturnType<typeof jexl.createExpression>;

export interface RepoQuery {
    expression: RepoQueryExpression | null;
}

type StatusFields = Partial<RepoQueryContext> &
    Pick<
        RepoQueryContext,
        | "branch"
        | "detached"
        | "clean"
        | "stagedFiles"
        | "modifiedFiles"
        | "untrackedFiles"
        | "ahead"
        | "behind"
        | "hasUpstream"
    >;

type RemoteFields = RepoQueryContext["remote"];

const statusFieldKeys = new Set<keyof StatusFields>([
    "branch",
    "detached",
    "clean",
    "stagedFiles",
    "modifiedFiles",
    "untrackedFiles",
    "ahead",
    "behind",
    "hasUpstream",
]);

const toStatusFields = (
    status: Awaited<ReturnType<GitRepository["git"]["status"]>>,
): StatusFields => ({
    branch: status.current || null,
    detached: status.detached,
    clean: status.isClean(),
    stagedFiles: status.staged.length,
    modifiedFiles: status.modified.length,
    untrackedFiles: status.not_added.length,
    ahead: status.ahead,
    behind: status.behind,
    hasUpstream: Boolean(status.tracking),
});

const toRemoteFields = (remotes: RemoteWithRefs[]): RemoteFields => {
    const parsed = parseGitRemoteRefs(remotes);
    const primary =
        parsed.find((remote) => remote.ref === "origin") ?? parsed[0];
    if (primary === undefined) {
        return { provider: null, host: null, owner: null, repo: null };
    }
    return {
        provider: mapProvider(primary.provider),
        host: primary.host || null,
        owner: primary.owner || null,
        repo: primary.name || null,
    };
};

const mapProvider = (provider: GitProvider): RemoteFields["provider"] =>
    provider === "unknown" ? "other" : provider;

export const compileQuery = (expression: string): RepoQuery => {
    const trimmed = expression.trim();
    if (trimmed.length === 0) {
        return { expression: null };
    }
    const compiled = jexl.createExpression(trimmed);
    compiled.compile();
    return { expression: compiled };
};

const createRepoQueryContext = (repo: GitRepository): RepoQueryContext => {
    let statusPromise: Promise<StatusFields> | null = null;
    let allBranchesPromise: Promise<string[]> | null = null;
    let localBranchesPromise: Promise<string[]> | null = null;
    let remotePromise: Promise<RemoteFields> | null = null;

    const status = () =>
        (statusPromise ??= repo.git.status().then(toStatusFields));

    const allBranches = () =>
        (allBranchesPromise ??= repo.git
            .branch(["-a"])
            .then((summary) => summary.all));

    const localBranches = () =>
        (localBranchesPromise ??= repo.git
            .branchLocal()
            .then((summary) => summary.all));

    const remotes = () =>
        (remotePromise ??= repo.git.getRemotes(true).then(toRemoteFields));

    return new Proxy({} as RepoQueryContext, {
        get(_target, property) {
            if (property === "name") {
                return basename(repo.path.absolute);
            }
            if (property === "path") {
                return repo.path.relative;
            }
            if (property === "branches") {
                return allBranches();
            }
            if (property === "localBranches") {
                return localBranches();
            }
            if (property === "remote") {
                return remotes();
            }
            if (
                typeof property === "string" &&
                statusFieldKeys.has(property as keyof StatusFields)
            ) {
                return status().then(
                    (fields) => fields[property as keyof StatusFields],
                );
            }
            return undefined;
        },
    });
};

export const repoMatchesFilter = async (
    repo: GitRepository,
    query: RepoQuery,
): Promise<boolean> => {
    if (query.expression === null) {
        return true;
    }
    try {
        return Boolean(
            await query.expression.eval(createRepoQueryContext(repo)),
        );
    } catch {
        return false;
    }
};
