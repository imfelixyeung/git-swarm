export const arrayHasOverlaps = (a: string[], b: string[]) => {
    return !new Set(a).isDisjointFrom(new Set(b));
};
