import ora from "ora";
import { findGitRepositories, type GitRepository } from "@/git/discover";

export const forEachRepoWithSpinner = async (
    root: string,
    label: string,
    visit: (repo: GitRepository) => Promise<void>,
): Promise<void> => {
    const spinner = ora(label).start();
    for await (const repo of findGitRepositories(root)) {
        spinner.text = repo.path.relative;
        await visit(repo);
    }
    spinner.stop();
};
