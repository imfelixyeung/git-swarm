import { InvalidArgumentError, Option } from "commander";
import { config } from "@/config";
import { compileQuery, type RepoQuery } from "@/git/filter";

export type WhereOption = {
    where: RepoQuery;
};

const defaultWhere = await config.getOption("where");

export const whereOption = new Option(
    "--where <expression>",
    "filter repos by a JEXL expression",
)
    .default(compileQuery(defaultWhere), defaultWhere.trim() || "all repos")
    .argParser((value) => {
        try {
            return compileQuery(value);
        } catch (error) {
            if (error instanceof Error) {
                throw new InvalidArgumentError(error.message);
            }
            throw error;
        }
    });
