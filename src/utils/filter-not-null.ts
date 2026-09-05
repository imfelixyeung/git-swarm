export const filterNotNull = <T>(array: (T | null)[]): T[] =>
    array.filter((t) => t !== null);
