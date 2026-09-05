import { Command } from "commander";
import type { PullResult } from "simple-git";
import { catchError } from "@/utils/error";
import { forEachRepoWithSpinner } from "@/utils/spinner";
import { CliTable } from "@/utils/table";

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
    .description("Fetch from and integrate with another repository")
    .argument("[remote]", "the remote to pull from")
    .argument("[branch]", "the branch to pull")
    .action(async (remote?: string, branch?: string) => {
        const root = process.cwd();
        const table = new CliTable({ head: ["path", "result"] });
        await forEachRepoWithSpinner(
            root,
            "pulling repositories",
            async ({ path, git }) => {
                const result = await git.pull(remote, branch).catch(catchError);
                if (result instanceof Error) {
                    return;
                }

                table.push([path.relative, getPullSummary(result)]);
            },
        );
        console.log(table.toString());
    });
