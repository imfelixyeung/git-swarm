import { dirname, relative } from "node:path";
import { Glob } from "bun";
import simpleGit, { type SimpleGit } from "simple-git";

export type GitRepository = {
    path: {
        absolute: string;
        relative: string;
    };
    git: SimpleGit;
};

export async function* findGitRepositoryPaths(root: string) {
    const glob = new Glob("**/.git");

    for await (const path of glob.scan({
        cwd: root,
        dot: true,
        absolute: true,
        onlyFiles: false,
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
