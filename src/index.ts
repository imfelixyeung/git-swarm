import { Command } from "commander";
import { statusCommand } from "./commands/status/command";

const program = new Command();

program
    .name("git-swarm")
    .description("Git subcommand to manage multiple repositories at once")
    .version("0.8.0");

program.addCommand(statusCommand);

program.parse();
