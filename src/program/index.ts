#!/usr/bin/env bun
import { Command } from "commander";
import packageJson from "@/package.json";
import { checkoutCommand } from "./commands/checkout/command";
import { fetchCommand } from "./commands/fetch/command";
import { pullCommand } from "./commands/pull/command";
import { statusCommand } from "./commands/status/command";
import { type ParallelOption, parallelOption } from "./options/parallel";

export const program = new Command();
export const getProgramOptions = (): ParallelOption => program.opts();

program
    .name("git-swarm")
    .description(packageJson.description)
    .version(packageJson.version)
    .enablePositionalOptions()
    .addOption(parallelOption)
    .addCommand(statusCommand)
    .addCommand(fetchCommand)
    .addCommand(pullCommand)
    .addCommand(checkoutCommand);
