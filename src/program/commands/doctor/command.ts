import { Command } from "commander";
import dedent from "dedent";
import pluralize from "pluralize-esm";
import { forEachRepo } from "@/git/worker";
import { getProgramOptions } from "@/program";
import { c } from "@/utils/colour";
import { catchError } from "@/utils/error";

type DoctorIssue = {
    mode: "warn" | "error";
    detail: string;
};

const reportIssue = (path: string, issue: DoctorIssue) => {
    const symbol = issue.mode === "error" ? "✗" : "⚠";
    const colour = issue.mode === "error" ? c.red : c.yellow;
    return console.warn(
        colour(
            dedent`
                ${symbol} ${path}
                  ${issue.detail}
            `,
        ),
    );
};

const reportHealthy = (path: string) => {
    console.info(c.green(`✓ ${path}`));
};

export const doctorCommand = new Command("doctor")
    .description("Run diagnostics")
    .action(async () => {
        const programOptions = getProgramOptions();
        const root = process.cwd();

        const results = await forEachRepo(
            root,
            async ({ path, git }) => {
                const issues: DoctorIssue[] = [];
                const relative = path.relative;

                const status = await git.status().catch(catchError);
                if (status instanceof Error) {
                    issues.push({
                        mode: "error",
                        detail: `git status failed: ${status.message}`,
                    });
                    return { path: relative, issues };
                }

                if (status.detached) {
                    issues.push({
                        mode: "warn",
                        detail: "HEAD is detached",
                    });
                }

                const remotes = await git.getRemotes().catch(catchError);
                const hasRemotes =
                    !(remotes instanceof Error) && remotes.length > 0;
                if (!hasRemotes) {
                    issues.push({
                        mode: "warn",
                        detail: "No remotes configured",
                    });
                }

                if (status.current && !status.tracking) {
                    issues.push({
                        mode: "warn",
                        detail: `Branch '${status.current}' has no upstream`,
                    });
                }

                if (status.behind && status.ahead) {
                    const summary = (["ahead", "behind"] as const)
                        .map(
                            (v) =>
                                `${pluralize("commit", status[v], true)} ${v}`,
                        )
                        .join(" ");

                    issues.push({
                        mode: "warn",
                        detail: `'${status.current}' has diverged from ${status.tracking}. ${summary}`,
                    });
                } else {
                    for (const v of ["ahead", "behind"] as const) {
                        if (status[v]) {
                            issues.push({
                                mode: "warn",
                                detail: `'${status.current}' is ${pluralize("commit", status[v], true)} ${v} ${status.tracking}`,
                            });
                        }
                    }
                }

                return { path: relative, issues };
            },
            programOptions,
        );

        for (const result of results) {
            if (result.issues.length === 0) {
                reportHealthy(result.path);
                continue;
            }
            for (const issue of result.issues) {
                reportIssue(result.path, issue);
                if (issue.mode === "error") {
                    process.exitCode = 1;
                }
            }
        }

        console.log(
            c.gray(
                "Run `git-swarm config refresh` if repositories have changed.",
            ),
        );
    });
