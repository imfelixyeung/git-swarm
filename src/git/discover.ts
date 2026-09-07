import { stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { SimpleGit } from "simple-git";
import { glob } from "tinyglobby";
import { config } from "@/config";
import { c } from "@/utils/colour";

export type GitRepository = {
    path: {
        absolute: string;
        relative: string;
    };
    git: SimpleGit;
};

type Options = { skipConfig: boolean };

const failConfigRepoPath = (path: string, reason: string): never => {
    console.error(`${c.red("✗")} Config repository path ${reason}: "${path}"`);
    console.error(
        `${c.gray("Hint:")} Run ${c.bold("`git-swarm config refresh`")} to refresh repository paths`,
    );
    process.exit(1);
};

const assertConfigRepoPath = async (root: string, path: string) => {
    const absolute = resolve(root, path);

    const stats = await stat(absolute).catch(() => null);
    if (stats === null || !stats.isDirectory()) {
        failConfigRepoPath(
            path,
            stats === null ? "not found" : "is not a directory",
        );
    }

    try {
        await stat(join(absolute, ".git"));
    } catch {
        failConfigRepoPath(path, "is not a git repository");
    }
};

export async function* findGitRepositoryPaths(root: string, options: Options) {
    if (!options.skipConfig) {
        const repos = await config.get().then((c) => c.repositories);
        if (repos) {
            for (const repo of repos) {
                await assertConfigRepoPath(root, repo.path);
                yield repo.path;
            }
            return;
        }
    }

    const matches = await glob("**/.git", {
        cwd: root,
        dot: true,
        onlyFiles: false,
        expandDirectories: false,
        absolute: true,
    });

    for (const path of matches) {
        yield dirname(path);
    }
}
