import { Option } from "commander";
import { config } from "@/config";

export type ParallelOption = {
    parallel: number;
};

const defaultValue = await config.getOption("parallel");

export const parallelOption = new Option(
    "--parallel <count>",
    "run git in parallel",
)
    .default(
        defaultValue,
        defaultValue === 1 ? "sequential" : defaultValue.toString(),
    )
    .argParser((value) => Number(value));
