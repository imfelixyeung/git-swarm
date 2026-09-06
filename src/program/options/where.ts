import { InvalidArgumentError, Option } from "commander";
import { type GitRepoFilters, parseQueryString } from "@/git/filter";

export type WhereOption = {
    where: GitRepoFilters;
};

export const whereOption = new Option(
    "--where <query>",
    "filter repos by a query string",
)
    .default({} satisfies GitRepoFilters, "all repos")
    .argParser((value) => {
        const parsed = parseQueryString(value);
        if (parsed instanceof Error) {
            throw new InvalidArgumentError(parsed.message);
        }
        return parsed;
    });
