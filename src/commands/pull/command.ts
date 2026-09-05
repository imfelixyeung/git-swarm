import { Command } from "commander";
import type { PullResult } from "simple-git";
import { findGitRepositories } from "../../git/discover";
import { catchError } from "../../utils/error";
import { CliTable } from "../../utils/table";

const getPullSummary = (result: PullResult) => {
    if (!result.files.length) {
        return "already up-to-date";
    }

    const { insertions, deletions } = result.summary;
    const chunks = [
        `${result.files.length} file(s) changed`,
        insertions ? `+${insertions}` : null,
        deletions ? `-${deletions}` : null,
    ];

    return chunks.filter(Boolean).join(" ");
};

export const pullCommand = new Command("pull")
    .argument("[remote]", "the remote to pull from")
    .argument("[branch]", "the branch to pull")
    .action(async (remote?: string, branch?: string) => {
        const root = process.cwd();
        const table = new CliTable({ head: ["path", "result"] });
        for await (const { path, git } of findGitRepositories(root)) {
            const result = await git.pull(remote, branch).catch(catchError);
            if (result instanceof Error) {
                continue;
            }

            table.push([path.relative, getPullSummary(result)]);
        }

        console.log(table.toString());
    });
