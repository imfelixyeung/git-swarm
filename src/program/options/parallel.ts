import { Option } from "commander";

export type ParallelOption = {
    parallel: number;
};

export const parallelOption = new Option(
    "--parallel <count>",
    "run git in parallel",
)
    .default(1, "sequential")
    .argParser((value) => Number(value));
