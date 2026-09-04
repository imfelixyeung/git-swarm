import CliTable3, { type TableConstructorOptions } from "cli-table3";

export class CliTable extends CliTable3 {
    constructor(options: Omit<TableConstructorOptions, "chars" | "style">) {
        super({
            ...options,
            style: {
                head: ["bold"],
            },
            chars: {
                mid: "",
                "mid-mid": "",
                "left-mid": "",
                "right-mid": "",
            },
        });
    }
}
