import { InvalidArgumentError, Option } from "commander";
import { config } from "@/config";

export const toParallel = (value: string | number): number => {
    const parallel = Number(value);
    if (!Number.isInteger(parallel) || parallel < 0) {
        throw new InvalidArgumentError(
            "expected a non-negative integer (0 = unlimited, 1 = sequential)",
        );
    }
    if (parallel === 0) {
        return Infinity;
    }
    return parallel;
};

export const valueDescription = (value: number): string => {
    switch (true) {
        case value === 0:
            return "unlimited";
        case value === 1:
            return "sequential";
        default:
            return value.toLocaleString();
    }
};

export type ParallelOption = {
    parallel: number;
};

const defaultValue = toParallel(await config.getOption("parallel"));

export const parallelOption = new Option(
    "--parallel <count>",
    "run git in parallel, 0 = unlimited",
)
    .default(defaultValue, valueDescription(defaultValue))
    .argParser(toParallel);
