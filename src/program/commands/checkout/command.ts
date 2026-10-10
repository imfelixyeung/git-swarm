import { Command } from "commander";
import { forEachRepo } from "@/git/worker";
import { getProgramOptions } from "@/program";
import { c } from "@/utils/colour";
import { catchError, formatRepoError } from "@/utils/error";
import { filterNotNull } from "@/utils/filter-not-null";
import { CliTable } from "@/utils/table";

export const checkoutCommand = new Command("checkout")
    .description("Switch branches")
    .argument("<branch>", "the branch to checkout")
    .action(async (branch: string) => {
        const programOptions = getProgramOptions();
        const root = process.cwd();
        const table = new CliTable({ head: ["path", "result"] });
        let failed = false;
        const results = await forEachRepo(
            root,
            async ({ path, git }, log) => {
                const result = await git.checkout(branch).catch(catchError);
                if (result instanceof Error) {
                    failed = true;
                    log(formatRepoError(path.relative, result));
                    return null;
                }

                return [path.relative, c.green(branch)];
            },
            programOptions,
        );
        if (failed) {
            process.exitCode = 1;
        }
        table.push(...filterNotNull(results));
        console.log(table.toString());
    });
