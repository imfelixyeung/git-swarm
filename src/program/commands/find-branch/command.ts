import { Command } from "commander";
import pluralize from "pluralize-esm";
import { forEachRepo } from "@/git/worker";
import { getProgramOptions } from "@/program";
import { c } from "@/utils/colour";
import { catchError, reportRepoError } from "@/utils/error";
import { filterNotNull } from "@/utils/filter-not-null";
import { CliTable } from "@/utils/table";

const getBranchSummary = (branch: string, branches: string[]) => {
    if (branches.includes(branch)) {
        return c.green(branch);
    }

    const matches = branches.filter((b) => b.includes(branch));
    if (matches.length) {
        return `${matches.map(c.yellow).join("\n")}\n${c.gray("(fuzzy match)")}`;
    }

    return null;
};

export const findBranchCommand = new Command("find-branch")
    .description("Search repositories for a branch by name")
    .argument("<branch>", "the branch name to search for")
    .action(async (branch: string) => {
        const programOptions = getProgramOptions();
        const root = process.cwd();
        const table = new CliTable({
            head: ["path", "result"],
        });
        const results = await forEachRepo(
            root,
            async ({ path, git }) => {
                const result = await git.branch().catch(catchError);
                if (result instanceof Error) {
                    return reportRepoError(path.relative, result);
                }

                const found = getBranchSummary(branch, result.all);
                if (found) {
                    return [path.relative, found];
                }

                return null;
            },
            programOptions,
        );
        const matches = filterNotNull(results);
        console.log(
            `${c.gray("branch")} ${c.bold(branch)} ${c.gray(`found in ${pluralize("repo", matches.length, true)}:`)}`,
        );
        if (matches.length === 0) {
            return;
        }
        table.push(...matches);
        console.log(table.toString());
    });
