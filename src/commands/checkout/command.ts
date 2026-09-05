import { Command } from "commander";
import { findGitRepositories } from "../../git/discover";
import { catchError } from "../../utils/error";
import { CliTable } from "../../utils/table";

export const checkoutCommand = new Command("checkout")
    .argument("<branch>", "the branch to checkout")
    .action(async (branch: string) => {
        const root = process.cwd();
        const table = new CliTable({ head: ["path", "result"] });
        for await (const { path, git } of findGitRepositories(root)) {
            const result = await git.checkout(branch).catch(catchError);
            if (result instanceof Error) {
                continue;
            }

            table.push([path.relative, branch]);
        }

        console.log(table.toString());
    });
