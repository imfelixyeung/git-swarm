import { Command } from "commander";
import dedent from "dedent";
import { CONFIG_FILE_NAME, config, type GitSwarmConfig } from "@/config";
import { findGitRepositories } from "@/git/discover";
import { getProgramOptions } from "@/program";
import { c } from "@/utils/colour";

export const refreshCommand = new Command("refresh")
    .description(
        dedent`
            Refreshes the git swarm config with new repositores.
            Other options are kept as is.'
        `,
    )
    .option(
        "--force",
        "Force creation of a fresh config file even if one already exists",
    )
    .passThroughOptions()
    .action(async () => {
        if (!(await config.exists())) {
            console.log(
                c.red(
                    `${CONFIG_FILE_NAME} missing. Run ${c.bold("`git swarm init`")} first`,
                ),
            );
            process.exit();
        }
        const oldConfig = await config.get();
        const programOptions = getProgramOptions();
        const root = process.cwd();
        const repos = await Array.fromAsync(
            findGitRepositories(root, programOptions.where, {
                skipConfig: true,
            }),
        );

        repos.sort((a, b) => a.path.relative.localeCompare(b.path.relative));

        const configData: GitSwarmConfig = {
            ...oldConfig,
            repositories: repos.map((repo) => ({ path: repo.path.relative })),
        };

        await config.write(configData);
        console.log(
            c.green(
                `${CONFIG_FILE_NAME} refreshed successfully, with ${repos.length} repositores.`,
            ),
        );
    });
