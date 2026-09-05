import { Command } from "commander";
import { catchError } from "@/utils/error";
import { forEachRepoWithSpinner } from "@/utils/spinner";
import { CliTable } from "@/utils/table";

export const checkoutCommand = new Command("checkout")
    .description("Switch branches")
    .argument("<branch>", "the branch to checkout")
    .action(async (branch: string) => {
        const root = process.cwd();
        const table = new CliTable({ head: ["path", "result"] });
        await forEachRepoWithSpinner(
            root,
            `checking out ${branch}`,
            async ({ path, git }) => {
                const result = await git.checkout(branch).catch(catchError);
                if (result instanceof Error) {
                    return;
                }

                table.push([path.relative, branch]);
            },
        );
        console.log(table.toString());
    });
