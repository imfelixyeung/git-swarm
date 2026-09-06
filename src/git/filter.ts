import z from "zod";
import { catchError } from "@/utils/error";
import type { GitRepository } from "./discover";

const repoFiltersSchema = z.object({
    branch: z
        .union([z.string(), z.array(z.string())])
        .transform((v) => (Array.isArray(v) ? v : [v]))
        .nullish()
        .default(null),
    clean: z
        .enum(["true", "false"])
        .transform((v) => v === "true")
        .nullish()
        .default(null),
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

export const repoMatchesFilter = async (
    repo: GitRepository,
    filters: GitRepoFilters,
): Promise<boolean> => {
    const status = await repo.git.status().catch(catchError);
    if (status instanceof Error) {
        return false;
    }

    if (filters.branch !== null && status.current) {
        if (!filters.branch.includes(status.current)) {
            return false;
        }
    }
    if (filters.clean !== null) {
        const isClean = status.isClean();
        if (filters.clean !== isClean) {
            return false;
        }
    }

    return true;
};
