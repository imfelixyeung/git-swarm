import { relative } from "node:path";
import pLimit from "p-limit";
import simpleGit from "simple-git";
import { findGitRepositoryPaths, type GitRepository } from "@/git/discover";
import { filterNotNull } from "@/utils/filter-not-null";
import { type GitRepoFilters, repoMatchesFilter } from "./filter";

type ForEachRepoOptions = {
    parallel: number;
    where: GitRepoFilters;
    skipConfig?: boolean;
};

export const forEachRepo = async <T>(
    root: string,
    visit: (repo: GitRepository) => Promise<T>,
    options: ForEachRepoOptions,
): Promise<T[]> => {
    const limit = pLimit(options.parallel);

    const paths = await Array.fromAsync(
        findGitRepositoryPaths(root, {
            skipConfig: options.skipConfig ?? false,
        }),
    );

    const repos: GitRepository[] = await Promise.all(
        paths.map((path) =>
            limit(async () => {
                const repo: GitRepository = {
                    path: {
                        absolute: path,
                        relative: relative(root, path) || ".",
                    },
                    git: simpleGit(path, { baseDir: path }),
                };
                if (!(await repoMatchesFilter(repo, options.where))) {
                    return null;
                }
                return repo;
            }),
        ),
    ).then(filterNotNull);

    const promises = repos.map((repo) => limit(() => visit(repo)));
    const results = await Promise.all(promises);
    return results;
};
