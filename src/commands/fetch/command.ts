import { Command } from "commander";
import type { FetchResult } from "simple-git";
import { findGitRepositories } from "@/git/discover";
import { catchError } from "@/utils/error";
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

export const fetchCommand = new Command("fetch")
    .option(
        "-p, --prune",
        "prune remote-tracking branches no longer on the remote",
    )
    .action(async (options?: { prune?: boolean }) => {
        const root = process.cwd();
        const table = new CliTable({ head: ["path", "result"] });
        for await (const { path, git } of findGitRepositories(root)) {
            const result = await git
                .fetch(options?.prune ? ["--prune"] : [])
                .catch(catchError);
            if (result instanceof Error) {
                continue;
            }

            table.push([path.relative, getFetchSummary(result)]);
        }

        console.log(table.toString());
    });
