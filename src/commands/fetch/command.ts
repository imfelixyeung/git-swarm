import { Command } from "commander";
import type { FetchResult } from "simple-git";
import { getProgramOptions } from "@/cli";
import { forEachRepo } from "@/git/worker";
import { catchError } from "@/utils/error";
import { filterNotNull } from "@/utils/filter-not-null";
import { CliTable } from "@/utils/table";

const getFetchSummary = (result: FetchResult) => {
    const chunks = [
        result.branches.length
            ? `${result.branches.length} new branch(s)`
            : null,
        result.tags.length ? `${result.tags.length} new tag(s)` : null,
        result.updated.length
            ? `${result.updated.length} branch(s) updated`
            : null,
        result.deleted.length
            ? `${result.deleted.length} branch(s) deleted`
            : null,
    ].filter(Boolean);

    return chunks.join(", ") || "already up-to-date";
};

export type Options = { prune: boolean };

export const fetchCommand = new Command("fetch")
    .description("Download objects and refs from another repository")
    .option(
        "-p, --prune",
        "prune remote-tracking branches no longer on the remote",
    )
    .action(async (options: Options) => {
        const programOptions = getProgramOptions();
        const root = process.cwd();
        const table = new CliTable({ head: ["path", "result"] });
        const results = await forEachRepo(
            root,
            "fetching repositories",
            async ({ path, git }) => {
                const result = await git
                    .fetch(options?.prune ? ["--prune"] : [])
                    .catch(catchError);
                if (result instanceof Error) {
                    return null;
                }

                return [path.relative, getFetchSummary(result)];
            },
            programOptions,
        );
        table.push(...filterNotNull(results));
        console.log(table.toString());
    });
