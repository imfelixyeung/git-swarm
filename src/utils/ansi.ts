const write = (string: string) => {
    process.stdout.write(string);
};

export const ansi = {
    carriageReturn: () => write("\r"),
    hideCursor: () => write("\x1B[?25l"),
    showCursor: () => write("\x1B[?25h"),
    moveUp: (lines = 1) => {
        if (lines <= 0) {
            return;
        }
        write(`\x1B[${lines}A`);
    },

    clearLine: () => write("\x1B[2K"),
    clearBelow: () => write("\x1B[J"),
};
