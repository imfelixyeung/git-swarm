import { Command } from "commander";
import { forEachRepo } from "@/git/worker";
import { getProgramOptions } from "@/program";
import { c } from "@/utils/colour";

type ExecOptions = {
    verbose: boolean;
};

type ExecResult = {
    path: string;
    lines: string[];
    success: boolean;
};

const runCommand = async (
    name: string,
    cwd: string,
    command: string[],
): Promise<ExecResult> => {
    const subprocess = Bun.spawn({
        cmd: command,
        cwd,
        stdout: "pipe",
        stderr: "pipe",
    });

    const [stdout, stderr] = await Promise.all([
        new Response(subprocess.stdout).text(),
        new Response(subprocess.stderr).text(),
    ]);

    const exitCode = await subprocess.exited.catch(
        () => subprocess.exitCode ?? 1,
    );
    const success = exitCode === 0;
    const lines = `${stdout}\n${stderr}`
        .split("\n")
        .map((line) => line.trimEnd())
        .filter((line) => line.trim());

    return { lines, path: name, success };
};

const getBadge = (success: boolean) => (success ? c.green("✓") : c.red("✗"));

const printLines = (prefix: string, lines: string[]) => {
    for (const line of lines) {
        console.log(`${prefix}${line}`);
    }
};

export const execCommand = new Command("exec")
    .description("Run a command in every repository")
    .option("-v, --verbose", "use compact output format")
    .passThroughOptions()
    .argument("<command...>", "the command and arguments to run")
    .action(async (command: string[], options: ExecOptions) => {
        const programOptions = getProgramOptions();
        const root = process.cwd();
        const results = await forEachRepo(
            root,
            "executing command",
            async ({ path }) =>
                runCommand(path.relative, path.absolute, command),
            programOptions,
        );

        if (options.verbose) {
            const maxWidth = Math.max(
                ...results.map((result) => `[${result.path}]`.length),
            );
            for (const result of results) {
                const label = `${getBadge(result.success)} ${`[${result.path}]`.padEnd(maxWidth)}`;
                if (result.lines.length) {
                    printLines(`${label}  `, result.lines);
                } else {
                    console.log(label.trimEnd());
                }
            }
            return;
        }

        console.log();
        for (const result of results) {
            console.log(`${getBadge(result.success)} ${result.path}`);
            printLines("    ", result.lines);
            console.log();
        }
    });
