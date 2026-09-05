import { Command } from "commander";
import type { StatusResult } from "simple-git";
import { getProgramOptions } from "@/cli";
import { forEachRepo } from "@/git/worker";
import { c } from "@/utils/colour";
import { catchError } from "@/utils/error";
import { filterNotNull } from "@/utils/filter-not-null";
import { CliTable } from "@/utils/table";

const getStatusSummary = (status: StatusResult) => {
    if (status.modified.length) {
        return c.red("modified");
    }

    if (status.ahead || status.behind) {
        return c.bold(`↑ ${status.ahead} ↓ ${status.behind}`);
    }

    if (status.detached) {
        return c.red("detached");
    }

    if (status.isClean()) {
        return c.green("clean");
    }

    if (status.not_added.length) {
        return c.red(`${status.not_added.length} untracked item(s)`);
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
            "checking repositories",
            async ({ path, git }) => {
                const status = await git.status().catch(catchError);
                if (status instanceof Error) {
                    if (process.env.NODE_ENV === "dev") {
                        return [
                            path.relative,
                            "---",
                            "---",
                            status.message.trim(),
                        ];
                    }
                    return null;
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
