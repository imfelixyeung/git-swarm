import { Command } from "commander";
import type { StatusResult } from "simple-git";
import { findGitRepositories } from "@/git/discover";
import { c } from "@/utils/colour";
import { catchError } from "@/utils/error";
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

export const statusCommand = new Command("status").action(async () => {
    const root = process.cwd();
    const table = new CliTable({
        head: ["path", "branch", "tracking", "status"],
    });
    for await (const { path, git } of findGitRepositories(root)) {
        const status = await git.status().catch(catchError);
        if (status instanceof Error) {
            if (process.env.NODE_ENV === "dev") {
                table.push([path.relative, "---", status.message.trim()]);
            }
            continue;
        }
        table.push([
            path.relative,
            status.current,
            status.tracking,
            getStatusSummary(status),
        ]);
    }
    console.log(table.toString());
});
