import { dirname } from "node:path";
import type { SimpleGit } from "simple-git";
import { glob } from "tinyglobby";
import { config } from "@/config";

export type GitRepository = {
    path: {
        absolute: string;
        relative: string;
    };
    git: SimpleGit;
};

type Options = { skipConfig: boolean };

export async function* findGitRepositoryPaths(root: string, options: Options) {
    if (!options.skipConfig) {
        const repos = await config.get().then((c) => c.repositories);
        if (repos) {
            for (const repo of repos) {
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
