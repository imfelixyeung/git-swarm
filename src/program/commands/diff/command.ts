import { Command } from "commander";
import type { DiffResult } from "simple-git";
import { forEachRepo } from "@/git/worker";
import { getProgramOptions } from "@/program";
import { c } from "@/utils/colour";
import { catchError } from "@/utils/error";
import { filterNotNull } from "@/utils/filter-not-null";
import { CliTable } from "@/utils/table";

type DiffOptions = {
    stat: boolean;
    cached: boolean;
};

type DiffFile = DiffResult["files"][number];

const getFileRow = (path: string, file: DiffFile) => {
    if (file.binary) {
        return [path, c.gray(file.file), c.gray("binary"), "", ""];
    }

    return [
        path,
        file.file,
        String(file.changes),
        c.green(`+${file.insertions}`),
        c.red(`-${file.deletions}`),
    ];
};

const getStatRow = (path: string, summary: DiffResult) => [
    path,
    String(summary.changed),
    c.green(`+${summary.insertions}`),
    c.red(`-${summary.deletions}`),
];

export const diffCommand = new Command("diff")
    .description("Show file changes across all repositories")
    .option("--cached", "show changes staged in the index")
    .option("--stat", "show the diff summary for each repository")
    .action(async (options: DiffOptions) => {
        const programOptions = getProgramOptions();
        const root = process.cwd();
        const diffArgs = options.cached ? ["--cached"] : [];
        const results = await forEachRepo(
            root,
            "diffing repositories",
            async ({ path, git }) => {
                const summary = await git
                    .diffSummary(diffArgs)
                    .catch(catchError);
                if (summary instanceof Error) {
                    return null;
                }

                if (summary.changed === 0) {
                    return null;
                }

                return { path: path.relative, summary };
            },
            programOptions,
        );

        const diffs = filterNotNull(results);

        if (diffs.length === 0) {
            return;
        }

        const head = options.stat
            ? ["path", "files", "insertions", "deletions"]
            : ["path", "file", "changes", "insertions", "deletions"];
        const table = new CliTable({ head });

        for (const { path, summary } of diffs) {
            if (options.stat) {
                table.push(getStatRow(path, summary));
            } else {
                table.push(
                    ...summary.files.map((file) => getFileRow(path, file)),
                );
            }
        }

        console.log(table.toString());

        const repos = diffs.length;
        const files = diffs.reduce((sum, d) => sum + d.summary.changed, 0);
        const insertions = diffs.reduce(
            (sum, d) => sum + d.summary.insertions,
            0,
        );
        const deletions = diffs.reduce(
            (sum, d) => sum + d.summary.deletions,
            0,
        );

        console.log(
            [
                c.bold(`${repos} repos`),
                c.gray("·"),
                c.bold(`${files} files`),
                c.gray("·"),
                c.green(`+${insertions}`),
                c.red(`-${deletions}`),
            ].join(" "),
        );

        process.exitCode = 1;
    });
