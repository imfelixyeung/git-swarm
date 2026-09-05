import { Command } from "commander";
import { getProgramOptions } from "@/cli";
import { forEachRepo } from "@/git/worker";
import { catchError } from "@/utils/error";
import { filterNotNull } from "@/utils/filter-not-null";
import { CliTable } from "@/utils/table";

export const checkoutCommand = new Command("checkout")
    .description("Switch branches")
    .argument("<branch>", "the branch to checkout")
    .action(async (branch: string) => {
        const programOptions = getProgramOptions();
        const root = process.cwd();
        const table = new CliTable({ head: ["path", "result"] });
        const results = await forEachRepo(
            root,
            `checking out ${branch}`,
            async ({ path, git }) => {
                const result = await git.checkout(branch).catch(catchError);
                if (result instanceof Error) {
                    return null;
                }

                return [path.relative, branch];
            },
            programOptions,
        );
        table.push(...filterNotNull(results));
        console.log(table.toString());
    });
