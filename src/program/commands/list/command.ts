import { Command } from "commander";
import { forEachRepo } from "@/git/worker";
import { getProgramOptions } from "@/program";
import { CliTable } from "@/utils/table";

export const listCommand = new Command("list")
    .description("List repositories discovered below the current directory")
    .action(async () => {
        const programOptions = getProgramOptions();
        const root = process.cwd();
        const table = new CliTable({
            head: ["path"],
        });
        const repos = await forEachRepo(
            root,
            async ({ path }) => path.relative,
            programOptions,
        );
        for (const relative of repos) {
            table.push([relative]);
        }
        console.log(table.toString());
    });
