import { Option } from "commander";

export type ProgressOption = {
    progress: boolean;
};

export const progressOption = new Option(
    "--no-progress",
    "disable the progress bar (defaults to enabled only when stdout is a TTY)",
).default(true, "auto");
