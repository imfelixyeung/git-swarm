import z from "zod";
import { catchError } from "@/utils/error";
import type { GitRepository } from "./discover";
import { parseGitRemoteRefs } from "./remote";

const oneOrMoreStringsFilterSchema = z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .nullish()
    .default(null);

const booleanFilterSchema = z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .nullish()
    .default(null);

const repoFiltersSchema = z.object({
    branch: oneOrMoreStringsFilterSchema,
    clean: booleanFilterSchema,
    "remote.ref": oneOrMoreStringsFilterSchema,
    "remote.provider": oneOrMoreStringsFilterSchema,
    "remote.owner": oneOrMoreStringsFilterSchema,
    "remote.host": oneOrMoreStringsFilterSchema,
    "remote.name": oneOrMoreStringsFilterSchema,
});

export type GitRepoFilters = z.infer<typeof repoFiltersSchema>;

export const parseQueryString = (query: string) => {
    const search = new URLSearchParams(query);
    const rawSearch: { [key: string]: string | string[] } = {};

    for (const [key, value] of search.entries()) {
        if (key in rawSearch) {
            if (rawSearch[key] === undefined) {
                continue;
            }
            rawSearch[key] = Array.isArray(rawSearch[key])
                ? [...rawSearch[key], value]
                : [rawSearch[key], value];
            continue;
        }
        rawSearch[key] = value;
    }
    const result = repoFiltersSchema.safeParse(rawSearch);
    if (result.error) {
        const issue = result.error.issues
            .map((i) => `${i.path}: ${i.message}`)
            .join(". ");

        throw new Error(`Invalid filter query. ${issue}`);
    }
    return result.data;
};

const oneStringMatches = (needles: string[], haystacks: string[]) => {
    return Boolean(
        needles.find((needle) =>
            haystacks.find((haystack) => haystack === needle),
        ),
    );
};

export const repoMatchesFilter = async (
    repo: GitRepository,
    filters: GitRepoFilters,
): Promise<boolean> => {
    const status = await repo.git.status().catch(catchError);
    if (status instanceof Error) {
        return false;
    }

    const rawRemotes = await repo.git.getRemotes(true);
    const remotes = parseGitRemoteRefs(rawRemotes);

    if (filters.branch !== null && status.current) {
        if (!oneStringMatches(filters.branch, [status.current])) {
            return false;
        }
    }
    if (filters.clean !== null) {
        const isClean = status.isClean();
        if (filters.clean !== isClean) {
            return false;
        }
    }

    const remoteStringFilters = [
        "ref",
        "provider",
        "owner",
        "host",
        "name",
    ] as const;

    for (const remoteKey of remoteStringFilters) {
        const filterKey = `remote.${remoteKey}` as const;
        if (filters[filterKey] !== null) {
            const needles = filters[filterKey];
            const haystacks = remotes.map((r) => r[remoteKey]);
            if (!oneStringMatches(needles, haystacks)) {
                return false;
            }
        }
    }

    return true;
};
