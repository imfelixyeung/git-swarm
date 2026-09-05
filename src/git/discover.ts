import { dirname, relative } from "node:path";
import simpleGit, { type SimpleGit } from "simple-git";
import { glob } from "tinyglobby";

export type GitRepository = {
    path: {
        absolute: string;
        relative: string;
    };
    git: SimpleGit;
};

export async function* findGitRepositoryPaths(root: string) {
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
