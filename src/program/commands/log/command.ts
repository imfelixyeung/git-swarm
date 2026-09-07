import { Command } from "commander";
import { formatDistanceToNow } from "date-fns";
import { forEachRepo } from "@/git/worker";
import { getProgramOptions } from "@/program";
import { c } from "@/utils/colour";
import { catchError } from "@/utils/error";
import { filterNotNull } from "@/utils/filter-not-null";
import { CliTable } from "@/utils/table";

type LogOptions = {
    after: string | null;
    before: string | null;
    exactDate: boolean;
    author: boolean;
};

type LogRow = {
    path: string;
    hash: string;
    message: string;
    date: string;
    time: number;
    author: string;
    files: number;
    insertions: number;
    deletions: number;
};

export const logCommand = new Command("log")
    .description("Show commit logs across all repositories")
    .argument("[rev]", "the revision or revision range to log")
    .option("--after <date>", "show commits more recent than a specific date")
    .option("--before <date>", "show commits older than a specific date")
    .option(
        "--exact-date",
        "show the exact commit date instead of a relative time",
    )
    .option("--author", "show the author of each commit")
    .action(async (rev: string | null, options: LogOptions) => {
        const programOptions = getProgramOptions();
        const root = process.cwd();
        const logArgs = [
            ...(rev ? [rev] : []),
            ...(options.after ? [`--after=${options.after}`] : []),
            ...(options.before ? [`--before=${options.before}`] : []),
        ];
        const log = await forEachRepo(
            root,
            "reading logs",
            async ({ path, git }) => {
                const result = await git
                    .log(["--stat=4096", ...logArgs])
                    .catch(catchError);
                if (result instanceof Error || result.all.length === 0) {
                    return null;
                }
                return { path: path.relative, log: result };
            },
            programOptions,
        );
        const logs = filterNotNull(log);
        if (logs.length === 0) {
            return;
        }

        const rows: LogRow[] = [];
        for (const { path, log } of logs) {
            for (const entry of log.all) {
                rows.push({
                    path,
                    hash: entry.hash.slice(0, 7),
                    message: entry.message,
                    date: options.exactDate
                        ? entry.date
                        : formatDistanceToNow(new Date(entry.date), {
                              addSuffix: true,
                          }),
                    time: new Date(entry.date).getTime(),
                    author: entry.author_name,
                    files: entry.diff?.changed ?? 0,
                    insertions: entry.diff?.insertions ?? 0,
                    deletions: entry.diff?.deletions ?? 0,
                });
            }
        }

        rows.sort((a, b) => b.time - a.time);

        const head = [
            "path",
            "hash",
            "date",
            ...(options.author ? ["author"] : []),
            "message",
            "files",
            "insertions",
            "deletions",
        ];
        const table = new CliTable({
            head,
        });
        for (const row of rows) {
            table.push([
                row.path,
                row.hash,
                c.gray(row.date),
                ...(options.author ? [row.author] : []),
                row.message,
                String(row.files),
                c.green(`+${row.insertions}`),
                c.red(`-${row.deletions}`),
            ]);
        }
        console.log(table.toString());
    });
