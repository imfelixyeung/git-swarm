import { Command } from "commander";
import pluralize from "pluralize-esm";
import type { StatusResult } from "simple-git";
import { forEachRepo } from "@/git/worker";
import { getProgramOptions } from "@/program";
import { c } from "@/utils/colour";
import { catchError, reportRepoError } from "@/utils/error";
import { filterNotNull } from "@/utils/filter-not-null";
import { CliTable } from "@/utils/table";

const getStatusSummary = (status: StatusResult) => {
    if (status.modified.length) {
        return c.red("modified");
    }

    if (status.ahead || status.behind) {
        return c.yellow(`↑ ${status.ahead} ↓ ${status.behind}`);
    }

    if (status.detached) {
        return c.red("detached");
    }

    if (status.isClean()) {
        return c.green("clean");
    }

    if (status.not_added.length) {
        return c.red(
            pluralize("untracked item", status.not_added.length, true),
        );
    }

    return c.gray("unknown");
};

export const statusCommand = new Command("status")
    .description("Show the working tree status")
    .action(async () => {
        const programOptions = getProgramOptions();
        const root = process.cwd();
        const table = new CliTable({
            head: ["path", "branch", "tracking", "status"],
        });
        const results = await forEachRepo(
            root,
            async ({ path, git }) => {
                const status = await git.status().catch(catchError);
                if (status instanceof Error) {
                    return reportRepoError(path.relative, status);
                }
                return [
                    path.relative,
                    status.current,
                    status.tracking,
                    getStatusSummary(status),
                ];
            },
            programOptions,
        );
        table.push(...filterNotNull(results));
        console.log(table.toString());
    });
