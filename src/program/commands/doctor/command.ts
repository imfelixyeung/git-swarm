import { join } from "node:path";
import { Command } from "commander";
import dedent from "dedent";
import simpleGit from "simple-git";
import { CONFIG_FILE_NAME, config } from "@/config";
import { c } from "@/utils/colour";
import { catchError } from "@/utils/error";

const symbols = {
    log: "✓",
    warn: "⚠",
    error: "✗",
};

const colours = {
    log: "green",
    warn: "yellow",
    error: "red",
} as const;

const doctorLog = (
    summary: string,
    details: string | null,
    mode: "log" | "warn" | "error",
    exitCode: number | null = null,
) => {
    if (exitCode !== null) {
        process.exitCode = exitCode;
    }
    const symbol = symbols[mode];
    const colour = c[colours[mode]];
    if (details === null) {
        return console.info(colour(`${symbol} ${summary}`));
    }
    return console.warn(
        colour(dedent`
            ${symbol} ${summary}
              ${details}
        `),
    );
};

const doctorOkay = (summary: string) => doctorLog(summary, null, "log");
const doctorWarning = (summary: string, details: string) =>
    doctorLog(summary, details, "warn");
const doctorError = (summary: string, details: string) =>
    doctorLog(summary, details, "error", 1);

export const doctorCommand = new Command("doctor")
    .description("Run diagnostics")
    .action(async () => {
        const configExists = await config.exists();
        if (configExists) {
            doctorOkay(`config file ${CONFIG_FILE_NAME} found`);
        } else {
            doctorError(
                `config file ${CONFIG_FILE_NAME} not found`,
                "run `git swarm config init` to create one",
            );
        }

        const configRepos = await config
            .get()
            .then((c) => c.repositories ?? []);
        for (const repo of configRepos) {
            const stat = await Bun.file(repo.path).stat().catch(catchError);
            if (stat instanceof Error) {
                doctorError(repo.path, "Not exist");
                continue;
            }

            if (!stat.isDirectory()) {
                doctorError(repo.path, "Not a directory");
                continue;
            }

            const gitStat = await Bun.file(join(repo.path, ".git"))
                .stat()
                .catch(catchError);

            if (gitStat instanceof Error || !gitStat.isDirectory()) {
                doctorError(repo.path, "Not a git repository");
                continue;
            }

            const git = simpleGit(repo.path);
            const status = await git.status().catch(catchError);

            if (status instanceof Error) {
                doctorError(repo.path, "git status failed");
                continue;
            }

            if (status.detached) {
                doctorWarning(repo.path, "HEAD is detached");
                continue;
            }

            const remotes = await git.getRemotes();
            if (remotes.length === 0) {
                doctorWarning(repo.path, "No remotes configured");
                continue;
            }

            if (status.current && !status.tracking) {
                doctorWarning(
                    repo.path,
                    `Branch '${status.current}' has no upstream`,
                );
                continue;
            }

            doctorOkay(repo.path);
        }

        console.log(
            c.gray(
                "Run `git swarm config refresh` if repositories have changed.",
            ),
        );
    });
