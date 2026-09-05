import { glob } from "node:fs/promises";
import { dirname, relative } from "node:path";
import simpleGit, { type SimpleGit } from "simple-git";

export type GitRepository = {
    path: {
        absolute: string;
        relative: string;
    };
    git: SimpleGit;
};

export async function* findGitRepositoryPaths(root: string) {
    for await (const path of glob("**/.git", {
        cwd: root,
    })) {
        yield dirname(path);
    }
}

export async function* findGitRepositories(
    root: string,
): AsyncGenerator<GitRepository> {
    for await (const path of findGitRepositoryPaths(root)) {
        yield {
            path: { absolute: path, relative: relative(root, path) || "." },
            git: simpleGit(path, { baseDir: path }),
        };
    }
}
