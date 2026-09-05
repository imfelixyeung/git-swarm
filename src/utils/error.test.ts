import { describe, expect, test } from "bun:test";
import { catchError } from "./error";

describe("catchError", () => {
    test("returns the same Error instance for an Error", () => {
        const error = new Error("boom");
        expect(catchError(error)).toBe(error);
    });

    test("wraps a non-error value in an Error", () => {
        const result = catchError("oops");
        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe("oops");
    });

    test("wraps a number in an Error", () => {
        const result = catchError(42);
        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe("42");
    });

    test("wraps an object and stores it as the cause", () => {
        const cause = { code: 500 };
        const result = catchError(cause);
        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe("[object Object]");
        expect(result.cause).toBe(cause);
    });

    test("wraps undefined in an Error", () => {
        const result = catchError(undefined);
        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe("undefined");
    });
});
