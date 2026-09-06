export const arrayHasOverlaps = (a: string[], b: string[]) => {
    return Boolean(
        a.find((needle) => b.find((haystack) => haystack === needle)),
    );
};
