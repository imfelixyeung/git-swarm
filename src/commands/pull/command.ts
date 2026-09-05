import { Command } from "commander";
import type { PullResult } from "simple-git";
import { getProgramOptions } from "@/cli";
import { forEachRepo } from "@/git/worker";
import { catchError } from "@/utils/error";
import { filterNotNull } from "@/utils/filter-not-null";
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
    .action(async (remote: string | null, branch: string | null) => {
        const programOptions = getProgramOptions();
        const root = process.cwd();
        const table = new CliTable({ head: ["path", "result"] });
        const results = await forEachRepo(
            root,
            "pulling repositories",
            async ({ path, git }) => {
                const result = await git
                    .pull(remote ?? undefined, branch ?? undefined)
                    .catch(catchError);
                if (result instanceof Error) {
                    return null;
                }

                return [path.relative, getPullSummary(result)];
            },
            programOptions,
        );
        table.push(...filterNotNull(results));
        console.log(table.toString());
    });
