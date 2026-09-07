import pluralize from "pluralize-esm";
import z from "zod";
import { arrayHasOverlaps } from "@/utils/array-has-overlaps";
import { catchError } from "@/utils/error";
import { isNullish } from "@/utils/is-nullish";
import type { GitRepository } from "./discover";
import { parseGitRemoteRefs } from "./remote";

const oneOrMoreStringsFilterSchema = z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .nullish();

const booleanFilterSchema = z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .nullish();

const repoFiltersSchema = z.strictObject({
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
            .map((i) => {
                if (i.code === "unrecognized_keys") {
                    return `${pluralize("unknown filter", i.keys.length, true)}: ${i.keys
                        .map((key) => `"${key}"`)
                        .join(", ")}`;
                }
                return `${i.path}: ${i.message}`;
            })
            .join(". ");

        throw new Error(`Invalid filter query. ${issue}`);
    }
    return result.data;
};

export const repoMatchesFilter = async (
    repo: GitRepository,
    filters: GitRepoFilters,
): Promise<boolean> => {
    const remoteStringFilters = [
        "ref",
        "provider",
        "owner",
        "host",
        "name",
    ] as const;
    const needsStatus = !isNullish(filters.branch) || !isNullish(filters.clean);
    const needsRemotes = remoteStringFilters.some(
        (key) => !isNullish(filters[`remote.${key}`]),
    );

    if (!needsStatus && !needsRemotes) {
        return true;
    }

    if (needsStatus) {
        const status = await repo.git.status().catch(catchError);
        if (status instanceof Error) {
            return false;
        }

        if (!isNullish(filters.branch) && status.current) {
            if (!arrayHasOverlaps(filters.branch, [status.current])) {
                return false;
            }
        }
        if (!isNullish(filters.clean)) {
            const isClean = status.isClean();
            if (filters.clean !== isClean) {
                return false;
            }
        }
    }

    if (needsRemotes) {
        const rawRemotes = await repo.git.getRemotes(true).catch(catchError);
        if (rawRemotes instanceof Error) {
            return false;
        }

        const remotes = parseGitRemoteRefs(rawRemotes);

        for (const remoteKey of remoteStringFilters) {
            const filterKey = `remote.${remoteKey}` as const;
            if (!isNullish(filters[filterKey])) {
                const needles = filters[filterKey];
                const haystacks = remotes.map((r) => r[remoteKey]);
                if (!arrayHasOverlaps(needles, haystacks)) {
                    return false;
                }
            }
        }
    }

    return true;
};
