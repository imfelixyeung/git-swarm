import { Command } from "commander";
import type { ParsedGitUrl } from "@/git/remote";
import { parseGitRemoteRefs } from "@/git/remote";
import { forEachRepo } from "@/git/worker";
import { getProgramOptions } from "@/program";
import { catchError } from "@/utils/error";
import { filterNotNull } from "@/utils/filter-not-null";
import { CliTable } from "@/utils/table";

const toRows = (path: string, remotes: ParsedGitUrl[]): string[][] => {
    const byRef = new Map<string, ParsedGitUrl[]>();
    for (const entry of remotes) {
        byRef.set(entry.ref, [...(byRef.get(entry.ref) ?? []), entry]);
    }

    const rows: string[][] = [];
    for (const [ref, entries] of byRef) {
        const fetch = entries.find((e) => e.direction === "fetch");
        const push = entries.find((e) => e.direction === "push");

        if (
            fetch &&
            push &&
            fetch.protocol === push.protocol &&
            fetch.href === push.href
        ) {
            const e = fetch;
            rows.push([
                path,
                ref,
                "push, fetch",
                e.href,
                e.provider,
                e.owner,
                e.name,
            ]);
            continue;
        }

        for (const entry of entries) {
            rows.push([
                path,
                ref,
                entry.direction,
                entry.href,
                entry.provider,
                entry.owner,
                entry.name,
            ]);
        }
    }
    return rows;
};

export const remoteCommand = new Command("remote")
    .description("List remotes for each repository")
    .action(async () => {
        const programOptions = getProgramOptions();
        const root = process.cwd();
        const table = new CliTable({
            head: [
                "path",
                "remote",
                "direction",
                "url",
                "provider",
                "owner",
                "name",
            ],
        });
        const results = await forEachRepo(
            root,
            "listing remotes",
            async ({ path, git }) => {
                const remotes = await git.getRemotes(true).catch(catchError);
                if (remotes instanceof Error) {
                    return null;
                }
                const parsed = parseGitRemoteRefs(remotes);
                if (parsed.length === 0) {
                    return null;
                }
                return toRows(path.relative, parsed);
            },
            programOptions,
        );
        const rows = filterNotNull(results).flat();
        table.push(...rows);
        console.log(table.toString());
    });
