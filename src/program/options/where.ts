import { InvalidArgumentError, Option } from "commander";
import { parseQueryString } from "@/git/filter";

export type WhereOption = {
    where: number;
};

export const whereOption = new Option(
    "--where <query>",
    "filter repos by a query string",
)
    .default("", "all repos")
    .argParser((value) => {
        const parsed = parseQueryString(value);
        if (parsed instanceof Error) {
            throw new InvalidArgumentError(parsed.message);
        }
        return parsed;
    });
