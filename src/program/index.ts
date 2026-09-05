#!/usr/bin/env bun
import { Command } from "commander";
import packageJson from "@/package.json";
import { checkoutCommand } from "./commands/checkout/command";
import { execCommand } from "./commands/exec/command";
import { fetchCommand } from "./commands/fetch/command";
import { findBranchCommand } from "./commands/find-branch/command";
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
    .addCommand(checkoutCommand)
    .addCommand(execCommand)
    .addCommand(fetchCommand)
    .addCommand(findBranchCommand)
    .addCommand(pullCommand)
    .addCommand(statusCommand);
