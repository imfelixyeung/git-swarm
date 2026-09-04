import { Command } from "commander";
import { fetchCommand } from "./commands/fetch/command";
import { statusCommand } from "./commands/status/command";

const program = new Command();

program
    .name("git-swarm")
    .description("Git subcommand to manage multiple repositories at once")
    .version("0.0.1")
    .addCommand(statusCommand)
    .addCommand(fetchCommand);

program.parse();
