import { YAML } from "bun";
import { z } from "zod";
import packageJson from "@/package.json";

export const CONFIG_FILE_NAME = "git-swarm.config.yaml";

const defaults = {
    $schema: `https://raw.githubusercontent.com/imfelixyeung/git-swarm/v${packageJson.version}/src/config/schema.json`,
    options: {
        parallel: 1,
        where: "",
    },
};

export const configSchema = z.object({
    $schema: z.string().default(defaults.$schema).nullish(),
    repositories: z
        .array(
            z.object({
                path: z.string(),
            }),
        )
        .nullish(),
    options: z
        .object({
            parallel: z
                .number()
                .gte(0)
                .nullish()
                .default(defaults.options.parallel),
            where: z.string().nullish().default(defaults.options.where),
        })
        .nullish(),
});

export type GitSwarmConfig = z.infer<typeof configSchema>;
defaults satisfies GitSwarmConfig;

export const defaultConfig = {
    $schema: defaults.$schema,
    options: {
        parallel: defaults.options.parallel,
        where: defaults.options.where,
    },
} as const satisfies GitSwarmConfig;

const file = () => Bun.file(CONFIG_FILE_NAME);

const exists = async () => file().exists();

const write = async (config: GitSwarmConfig) => {
    await file().write(YAML.stringify(config, null, 4));
};

let cache: GitSwarmConfig | null = null;

const get = async (): Promise<GitSwarmConfig> => {
    if (cache !== null) {
        return cache;
    }

    if (!(await file().exists())) {
        cache = defaultConfig;
        return cache;
    }

    const contents = await file().text();
    const config = YAML.parse(contents);
    const result = await configSchema.parseAsync(config);
    cache = result;
    return result;
};

const getOption = async <
    T extends keyof NonNullable<GitSwarmConfig["options"]>,
>(
    key: T,
) => {
    const config = await get();
    return config.options?.[key] ?? defaultConfig.options[key];
};

export const config = {
    file,
    exists,
    write,
    get,
    getOption,
};
