#!/usr/bin/env bun
import { Command } from "commander";
import packageJson from "@/package.json";
import { checkoutCommand } from "./commands/checkout/command";
import { execCommand } from "./commands/exec/command";
import { fetchCommand } from "./commands/fetch/command";
import { findBranchCommand } from "./commands/find-branch/command";
import { grepCommand } from "./commands/grep/command";
import { listCommand } from "./commands/list/command";
import { pullCommand } from "./commands/pull/command";
import { remoteCommand } from "./commands/remote/command";
import { statusCommand } from "./commands/status/command";
import { type ParallelOption, parallelOption } from "./options/parallel";
import { type WhereOption, whereOption } from "./options/where";

export const program = new Command();

export type ProgramOptions = ParallelOption & WhereOption;
export const getProgramOptions = () => program.opts<ProgramOptions>();

program
    .name("git-swarm")
    .description(packageJson.description)
    .version(packageJson.version)
    .enablePositionalOptions()
    .addOption(parallelOption)
    .addOption(whereOption)
    .addCommand(checkoutCommand)
    .addCommand(execCommand)
    .addCommand(fetchCommand)
    .addCommand(findBranchCommand)
    .addCommand(grepCommand)
    .addCommand(listCommand)
    .addCommand(pullCommand)
    .addCommand(remoteCommand)
    .addCommand(statusCommand);
