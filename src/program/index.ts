#!/usr/bin/env bun
import { Command } from "commander";
import packageJson from "@/package.json";
import { checkoutCommand } from "./commands/checkout/command";
import { configCommand } from "./commands/config/command";
import { diffCommand } from "./commands/diff/command";
import { doctorCommand } from "./commands/doctor/command";
import { execCommand } from "./commands/exec/command";
import { fetchCommand } from "./commands/fetch/command";
import { findBranchCommand } from "./commands/find-branch/command";
import { grepCommand } from "./commands/grep/command";
import { listCommand } from "./commands/list/command";
import { logCommand } from "./commands/log/command";
import { pullCommand } from "./commands/pull/command";
import { remoteCommand } from "./commands/remote/command";
import { statusCommand } from "./commands/status/command";
import { type ParallelOption, parallelOption } from "./options/parallel";
import { type ProgressOption, progressOption } from "./options/progress";
import { type WhereOption, whereOption } from "./options/where";

export const program = new Command();

export type ProgramOptions = ParallelOption & ProgressOption & WhereOption;
export const getProgramOptions = () => program.opts<ProgramOptions>();

program
    .name("git-swarm")
    .description(packageJson.description)
    .version(packageJson.version)
    .enablePositionalOptions()
    .addOption(parallelOption)
    .addOption(progressOption)
    .addOption(whereOption)
    .addCommand(checkoutCommand)
    .addCommand(configCommand)
    .addCommand(diffCommand)
    .addCommand(doctorCommand)
    .addCommand(execCommand)
    .addCommand(fetchCommand)
    .addCommand(findBranchCommand)
    .addCommand(grepCommand)
    .addCommand(listCommand)
    .addCommand(logCommand)
    .addCommand(pullCommand)
    .addCommand(remoteCommand)
    .addCommand(statusCommand);
