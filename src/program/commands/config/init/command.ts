import { Command } from "commander";
import dedent from "dedent";
import {
    CONFIG_FILE_NAME,
    config,
    defaultConfig,
    type GitSwarmConfig,
} from "@/config";
import { findGitRepositories } from "@/git/discover";
import { getProgramOptions } from "@/program";
import { c } from "@/utils/colour";

type Options = {
    force?: boolean;
};

export const initCommand = new Command("init")
    .description(
        dedent`
            Initialises a git swarm config.
            Creates a ${CONFIG_FILE_NAME} if they don't exist.
            This does not run 'git init'
        `,
    )
    .option(
        "--force",
        "Force creation of a fresh config file even if one already exists",
    )
    .passThroughOptions()
    .action(async (options: Options) => {
        if (!options.force && (await config.exists())) {
            console.log(c.red(`${CONFIG_FILE_NAME} already exists.`));
            process.exit();
        }
        const programOptions = getProgramOptions();
        const root = process.cwd();
        const repos = await Array.fromAsync(
            findGitRepositories(root, programOptions.where, {
                skipConfig: true,
            }),
        );

        repos.sort((a, b) => a.path.relative.localeCompare(b.path.relative));

        const configData: GitSwarmConfig = {
            ...defaultConfig,
            repositories: repos.map((repo) => ({ path: repo.path.relative })),
        };

        await config.write(configData);
        console.log(
            c.green(
                `${CONFIG_FILE_NAME} created successfully, with ${repos.length} repositores.`,
            ),
        );
    });
