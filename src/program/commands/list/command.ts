import { Command } from "commander";
import { findGitRepositories } from "@/git/discover";
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
        for await (const { path } of findGitRepositories(
            root,
            programOptions.where,
        )) {
            table.push([path.relative]);
        }
        console.log(table.toString());
    });
