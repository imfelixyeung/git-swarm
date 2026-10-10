import { c } from "@/utils/colour";

export const catchError = (error: unknown) =>
    error instanceof Error ? error : new Error(`${error}`, { cause: error });

export const formatRepoError = (path: string, error: unknown) => {
    const message = (
        error instanceof Error ? error.message : `${error}`
    ).trim();
    return `${c.red("✗")} ${path}: ${message}`;
};

export const reportRepoError = (path: string, error: unknown): null => {
    console.error(formatRepoError(path, error));
    return null;
};
