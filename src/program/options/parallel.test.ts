import { describe, expect, it } from "bun:test";
import { InvalidArgumentError } from "commander";
import { toParallel, valueDescription } from "./parallel";

describe("valueDescription", () => {
    it("returns 'unlimited' for 0", () => {
        expect(valueDescription(0)).toBe("unlimited");
    });

    it("returns 'sequential' for 1", () => {
        expect(valueDescription(1)).toBe("sequential");
    });

    it("formats other numbers using the locale", () => {
        expect(valueDescription(2)).toBe((2).toLocaleString());
        expect(valueDescription(1000)).toBe((1000).toLocaleString());
    });
});

describe("toParallel", () => {
    it("returns a positive integer unchanged", () => {
        expect(toParallel(4)).toBe(4);
    });

    it("converts a numeric string to a number", () => {
        expect(toParallel("4")).toBe(4);
    });

    it("converts 0 to Infinity", () => {
        expect(toParallel(0)).toBe(Infinity);
    });

    it("converts '0' to Infinity", () => {
        expect(toParallel("0")).toBe(Infinity);
    });

    it("converts empty strings '' to Infinity", () => {
        expect(toParallel("")).toBe(Infinity);
    });

    it.each([-1, -10, 1.5, 0.5, NaN, Infinity, -Infinity, "abc", "1.5"])(
        "throws for invalid value %s",
        (value) => {
            expect(() => toParallel(value)).toThrow(InvalidArgumentError);
        },
    );
});
