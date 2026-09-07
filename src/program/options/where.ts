import { InvalidArgumentError, Option } from "commander";
import { config } from "@/config";
import { type GitRepoFilters, parseQueryString } from "@/git/filter";

export type WhereOption = {
    where: GitRepoFilters;
};

const defaultWhere = await config.getOption("where");

export const whereOption = new Option(
    "--where <query>",
    "filter repos by a query string",
)
    .default(parseQueryString(defaultWhere), defaultWhere || "all repos")
    .argParser((value) => {
        try {
            return parseQueryString(value);
        } catch (error) {
            if (error instanceof Error) {
                throw new InvalidArgumentError(error.message);
            }
            throw error;
        }
    });
