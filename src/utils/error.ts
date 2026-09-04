export const catchError = (error: unknown) =>
    error instanceof Error ? error : new Error(`${error}`, { cause: error });
