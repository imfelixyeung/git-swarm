import { Command } from "commander";
import { initCommand } from "./init/command";
import { refreshCommand } from "./refresh/command";

export const configCommand = new Command("config")
    .description("Commands related to git swarm configuration")
    .enablePositionalOptions()
    .addCommand(initCommand)
    .addCommand(refreshCommand);
