import { Command } from "commander";
import pluralize from "pluralize-esm";
import type { PullResult } from "simple-git";
import { forEachRepo } from "@/git/worker";
import { getProgramOptions } from "@/program";
import { catchError, reportRepoError } from "@/utils/error";
import { filterNotNull } from "@/utils/filter-not-null";
import { CliTable } from "@/utils/table";

const getPullSummary = (result: PullResult) => {
    if (!result.files.length) {
        return "already up-to-date";
    }

    const { insertions, deletions } = result.summary;
    const chunks = [
        `${pluralize("file", result.files.length, true)} changed`,
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
        let failed = false;
        const results = await forEachRepo(
            root,
            async ({ path, git }) => {
                const result = await git
                    .pull(remote ?? undefined, branch ?? undefined)
                    .catch(catchError);
                if (result instanceof Error) {
                    failed = true;
                    return reportRepoError(path.relative, result);
                }

                return [path.relative, getPullSummary(result)];
            },
            programOptions,
        );
        if (failed) {
            process.exitCode = 1;
        }
        table.push(...filterNotNull(results));
        console.log(table.toString());
    });
