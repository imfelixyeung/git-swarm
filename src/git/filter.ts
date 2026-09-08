import pluralize from "pluralize-esm";
import z from "zod";
import { catchError } from "@/utils/error";
import { isNullish } from "@/utils/is-nullish";
import type { GitRepository } from "./discover";
import { parseGitRemoteRefs } from "./remote";

const oneOrMoreStringsFilterSchema = z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional();

const booleanFilterSchema = z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional();

const numericFilterSchema = z.coerce.number().optional();

const stringFilterOps = [
    "eq",
    "neq",
    "gte",
    "gt",
    "lt",
    "lte",
    "includes",
    "not-includes",
    "starts-with",
    "ends-with",
] as const;

type StringFilterOp = (typeof stringFilterOps)[number];
type StringFilterOpSchema<K extends string> = {
    [key in `${K}.${StringFilterOp}`]: typeof oneOrMoreStringsFilterSchema;
};

const buildStringFilterSchema = <K extends string>(
    key: K,
): StringFilterOpSchema<K> =>
    ({
        [`${key}.eq`]: oneOrMoreStringsFilterSchema,
        [`${key}.neq`]: oneOrMoreStringsFilterSchema,
        [`${key}.gte`]: oneOrMoreStringsFilterSchema,
        [`${key}.gt`]: oneOrMoreStringsFilterSchema,
        [`${key}.lt`]: oneOrMoreStringsFilterSchema,
        [`${key}.lte`]: oneOrMoreStringsFilterSchema,
        [`${key}.includes`]: oneOrMoreStringsFilterSchema,
        [`${key}.not-includes`]: oneOrMoreStringsFilterSchema,
        [`${key}.starts-with`]: oneOrMoreStringsFilterSchema,
        [`${key}.ends-with`]: oneOrMoreStringsFilterSchema,
    }) as StringFilterOpSchema<K>;

type StringFilterOpKeys<K extends string> = {
    [op in StringFilterOp]: `${K}.${op}`;
}[StringFilterOp];

const buildStringFilterKeys = <K extends string>(key: K) =>
    stringFilterOps.map((op) => `${key}.${op}`) as StringFilterOpKeys<K>[];

const numericFilterOps = ["eq", "neq", "gte", "gt", "lt", "lte"] as const;
type NumericFilterOp = (typeof numericFilterOps)[number];
type NumericFilterOpSchema<K extends string> = {
    [key in `${K}.${NumericFilterOp}`]: typeof numericFilterSchema;
};
type NumericFilterOpKeys<K extends string> = {
    [op in NumericFilterOp]: `${K}.${op}`;
}[NumericFilterOp];

const buildNumericFilterSchema = <K extends string>(
    key: K,
): NumericFilterOpSchema<K> =>
    ({
        [`${key}.eq`]: numericFilterSchema,
        [`${key}.neq`]: numericFilterSchema,
        [`${key}.gte`]: numericFilterSchema,
        [`${key}.gt`]: numericFilterSchema,
        [`${key}.lt`]: numericFilterSchema,
        [`${key}.lte`]: numericFilterSchema,
    }) as NumericFilterOpSchema<K>;

const buildNumericFilterKeys = <K extends string>(key: K) =>
    numericFilterOps.map((op) => `${key}.${op}`) as NumericFilterOpKeys<K>[];

const repoFiltersSchema = z.strictObject({
    ...buildStringFilterSchema("branch"),
    ...buildStringFilterSchema("upstream-branch"),
    clean: booleanFilterSchema,
    ahead: booleanFilterSchema,
    behind: booleanFilterSchema,
    ...buildNumericFilterSchema("ahead"),
    ...buildNumericFilterSchema("behind"),
    ...buildStringFilterSchema("remote.ref"),
    ...buildStringFilterSchema("remote.provider"),
    ...buildStringFilterSchema("remote.owner"),
    ...buildStringFilterSchema("remote.host"),
    ...buildStringFilterSchema("remote.name"),
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

type StringFilterTarget =
    | "branch"
    | "upstream-branch"
    | "remote.ref"
    | "remote.provider"
    | "remote.owner"
    | "remote.host"
    | "remote.name";

type StringFilterGroup = {
    eq?: string[] | null;
    neq?: string[] | null;
    gte?: string[] | null;
    gt?: string[] | null;
    lt?: string[] | null;
    lte?: string[] | null;
    includes?: string[] | null;
    "not-includes"?: string[] | null;
    "starts-with"?: string[] | null;
    "ends-with"?: string[] | null;
};

const getStringFilterGroup = (
    filters: GitRepoFilters,
    key: StringFilterTarget,
): StringFilterGroup => ({
    eq: filters[`${key}.eq`],
    neq: filters[`${key}.neq`],
    gte: filters[`${key}.gte`],
    gt: filters[`${key}.gt`],
    lt: filters[`${key}.lt`],
    lte: filters[`${key}.lte`],
    includes: filters[`${key}.includes`],
    "not-includes": filters[`${key}.not-includes`],
    "starts-with": filters[`${key}.starts-with`],
    "ends-with": filters[`${key}.ends-with`],
});

const matchesStringFilters = (
    values: string[],
    filters: StringFilterGroup,
): boolean => {
    const anyValueMatches = (
        needles: string[] | null | undefined,
        predicate: (value: string, needle: string) => boolean,
    ): boolean => {
        if (isNullish(needles)) {
            return true;
        }
        return needles.some((needle) =>
            values.some((value) => predicate(value, needle)),
        );
    };
    const noValueMatches = (
        needles: string[] | null | undefined,
        predicate: (value: string, needle: string) => boolean,
    ): boolean => {
        if (isNullish(needles)) {
            return true;
        }
        return !anyValueMatches(needles, predicate);
    };

    return (
        anyValueMatches(filters.eq, (value, needle) => value === needle) &&
        noValueMatches(filters.neq, (value, needle) => value === needle) &&
        anyValueMatches(filters.gte, (value, needle) => value >= needle) &&
        anyValueMatches(filters.gt, (value, needle) => value > needle) &&
        anyValueMatches(filters.lt, (value, needle) => value < needle) &&
        anyValueMatches(filters.lte, (value, needle) => value <= needle) &&
        anyValueMatches(filters.includes, (value, needle) =>
            value.includes(needle),
        ) &&
        noValueMatches(filters["not-includes"], (value, needle) =>
            value.includes(needle),
        ) &&
        anyValueMatches(filters["starts-with"], (value, needle) =>
            value.startsWith(needle),
        ) &&
        anyValueMatches(filters["ends-with"], (value, needle) =>
            value.endsWith(needle),
        )
    );
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
    const remoteFilterKeys = [
        "remote.ref",
        "remote.provider",
        "remote.owner",
        "remote.host",
        "remote.name",
    ] as const;
    const numericComparisons = {
        eq: (count: number, threshold: number) => count === threshold,
        neq: (count: number, threshold: number) => count !== threshold,
        gte: (count: number, threshold: number) => count >= threshold,
        gt: (count: number, threshold: number) => count > threshold,
        lt: (count: number, threshold: number) => count < threshold,
        lte: (count: number, threshold: number) => count <= threshold,
    } as const;
    const statusFilterKeys = [
        "clean",
        "ahead",
        "behind",
        ...buildNumericFilterKeys("ahead"),
        ...buildNumericFilterKeys("behind"),
        ...buildStringFilterKeys("branch"),
        ...buildStringFilterKeys("upstream-branch"),
    ] as const;
    const needsStatus = statusFilterKeys.some(
        (key) => !isNullish(filters[key]),
    );
    const needsRemotes = remoteFilterKeys.some((filterKey) =>
        stringFilterOps.some((op) => !isNullish(filters[`${filterKey}.${op}`])),
    );

    if (!needsStatus && !needsRemotes) {
        return true;
    }

    if (needsStatus) {
        const status = await repo.git.status().catch(catchError);
        if (status instanceof Error) {
            return false;
        }

        if (status.current) {
            if (
                !matchesStringFilters(
                    [status.current],
                    getStringFilterGroup(filters, "branch"),
                )
            ) {
                return false;
            }
        }
        if (!isNullish(filters.clean)) {
            const isClean = status.isClean();
            if (filters.clean !== isClean) {
                return false;
            }
        }
        if (status.tracking) {
            if (
                !matchesStringFilters(
                    [status.tracking],
                    getStringFilterGroup(filters, "upstream-branch"),
                )
            ) {
                return false;
            }
        }

        const matchesAheadBehind = (
            name: "ahead" | "behind",
            count: number,
        ): boolean => {
            const bounded = filters[name];
            if (!isNullish(bounded) && count > 0 !== bounded) {
                return false;
            }
            for (const op of numericFilterOps) {
                const compare = numericComparisons[op];
                const threshold = filters[`${name}.${op}` as const];
                if (!isNullish(threshold) && !compare(count, threshold)) {
                    return false;
                }
            }
            return true;
        };

        if (!matchesAheadBehind("ahead", status.ahead)) {
            return false;
        }
        if (!matchesAheadBehind("behind", status.behind)) {
            return false;
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
            const haystacks = remotes.map((r) => r[remoteKey]);
            if (
                !matchesStringFilters(
                    haystacks,
                    getStringFilterGroup(filters, filterKey),
                )
            ) {
                return false;
            }
        }
    }

    return true;
};
