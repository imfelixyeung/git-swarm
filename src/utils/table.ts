import CliTable3, { type TableConstructorOptions } from "cli-table3";

export class CliTable extends CliTable3 {
    constructor(options: Omit<TableConstructorOptions, "chars" | "style">) {
        super({
            ...options,
            style: {
                head: ["bold", "underline", "gray"],
                "padding-left": 0,
                "padding-right": 0,
            },
            chars: {
                top: "",
                "top-mid": "",
                "top-left": "",
                "top-right": "",
                bottom: "",
                "bottom-mid": "",
                "bottom-left": "",
                "bottom-right": "",
                left: "",
                "left-mid": "",
                mid: "",
                "mid-mid": "",
                right: "",
                "right-mid": "",
                middle: "  ",
            },
        });
    }
}
