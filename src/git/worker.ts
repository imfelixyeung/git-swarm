import { relative } from "node:path";
import pLimit from "p-limit";
import simpleGit from "simple-git";
import { findGitRepositoryPaths, type GitRepository } from "@/git/discover";
import { filterNotNull } from "@/utils/filter-not-null";
import { SwarmProgressBar } from "@/utils/swarm-progress-bar";
import { type RepoQuery, repoMatchesFilter } from "./filter";

type ForEachRepoOptions = {
    parallel: number;
    where: RepoQuery;
    progress: boolean;
    skipConfig?: boolean;
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
        options.progress && process.stdout.isTTY === true && repos.length > 0
            ? new SwarmProgressBar(repos)
            : null;
    progress?.start();
    try {
        const promises = repos.map((repo) =>
            limit(async () => {
                progress?.update(repo, "started");
                try {
                    const result = await visit(
                        repo,
                        progress
                            ? (message) => progress.log(message)
                            : console.log,
                    );
                    progress?.update(repo, "done");
                    return result;
                } catch (error) {
                    progress?.update(repo, "error");
                    throw error;
                }
            }),
        );
        return await Promise.all(promises);
    } finally {
        progress?.stop();
    }
};
