import { relative } from "node:path";
import pLimit from "p-limit";
import simpleGit from "simple-git";
import { findGitRepositoryPaths, type GitRepository } from "@/git/discover";
import { filterNotNull } from "@/utils/filter-not-null";
import { SwarmProgressBar } from "@/utils/swarm-progress-bar";
import { type GitRepoFilters, repoMatchesFilter } from "./filter";

type ForEachRepoOptions = {
    parallel: number;
    where: GitRepoFilters;
    skipConfig?: boolean;
    showProgress?: boolean;
};

export const forEachRepo = async <T>(
    root: string,
    visit: (repo: GitRepository, log: (message: string) => void) => Promise<T>,
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

    const progress =
        options.showProgress !== false ? new SwarmProgressBar(repos) : null;
    progress?.start();
    const promises = repos.map((repo) =>
        limit(async () => {
            progress?.update(repo, "started");
            const result = await visit(
                repo,
                progress?.log ? (m: string) => progress.log(m) : console.log,
            );
            progress?.update(repo, "done");
            return result;
        }),
    );
    const results = await Promise.all(promises);
    progress?.stop();
    return results;
};
