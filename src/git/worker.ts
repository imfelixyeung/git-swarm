import pLimit from "p-limit";
import { findGitRepositories, type GitRepository } from "@/git/discover";

export const forEachRepo = async <T>(
    root: string,
    _label: string,
    visit: (repo: GitRepository) => Promise<T>,
    options: { parallel: number },
): Promise<T[]> => {
    const limit = pLimit(options.parallel);
    const repos = await Array.fromAsync(findGitRepositories(root));
    const promises = repos.map((repo) => limit(() => visit(repo)));
    const results = await Promise.all(promises);
    return results;
};
