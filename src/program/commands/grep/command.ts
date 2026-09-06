import { Command } from "commander";
import { forEachRepo } from "@/git/worker";
import { getProgramOptions } from "@/program";
import { c } from "@/utils/colour";
import { catchError } from "@/utils/error";

type RepoGrepResult = {
    repo: string;
    lines: Array<{ file: string; line: number; preview: string }>;
};

export const grepCommand = new Command("grep")
    .description("Search for a pattern across all repositories")
    .passThroughOptions()
    .argument("<pattern>", "the search pattern")
    .argument("[options...]", "git-grep search options", [])
    .action(async (pattern: string, grepOptions) => {
        const programOptions = getProgramOptions();
        const root = process.cwd();
        const results = await forEachRepo(
            root,
            `searching for "${pattern}"`,
            async ({ path, git }) => {
                const result = await git
                    .grep(pattern, grepOptions)
                    .catch(catchError);
                if (result instanceof Error) {
                    return null;
                }

                const lines: RepoGrepResult["lines"] = [];
                for (const [file, matches] of Object.entries(result.results)) {
                    for (const match of matches) {
                        lines.push({
                            file,
                            line: match.line,
                            preview: match.preview,
                        });
                    }
                }

                if (lines.length === 0) {
                    return null;
                }

                lines.sort(
                    (a, b) => a.file.localeCompare(b.file) || a.line - b.line,
                );
                return { repo: path.relative, lines };
            },
            programOptions,
        );

        const repos = results.filter((r): r is RepoGrepResult => r !== null);
        const totalMatches = repos.reduce((sum, r) => sum + r.lines.length, 0);

        if (repos.length === 0) {
            return;
        }

        for (const repo of repos) {
            console.log(c.bold(repo.repo));
            for (const { file, line, preview } of repo.lines) {
                console.log(`  ${file}:${line}:${preview}`);
            }
            console.log();
        }

        console.log(
            `${c.bold(`${repos.length} repos`)} ${c.gray("·")} ${c.bold(`${totalMatches} matches`)}`,
        );
    });
