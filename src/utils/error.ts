import { c } from "@/utils/colour";

export const catchError = (error: unknown) =>
    error instanceof Error ? error : new Error(`${error}`, { cause: error });

export const reportRepoError = (path: string, error: unknown): null => {
    const message = (
        error instanceof Error ? error.message : `${error}`
    ).trim();
    console.error(`${c.red("✗")} ${path}: ${message}`);
    return null;
};
