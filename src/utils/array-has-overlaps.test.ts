import { describe, expect, test } from "bun:test";
import { arrayHasOverlaps } from "./array-has-overlaps";

describe("arrayHasOverlaps", () => {
    test("returns true when arrays share a common element", () => {
        expect(arrayHasOverlaps(["a", "b"], ["b", "c"])).toBe(true);
    });

    test("returns false when arrays have no common elements", () => {
        expect(arrayHasOverlaps(["a", "b"], ["c", "d"])).toBe(false);
    });

    test("returns false for empty arrays", () => {
        expect(arrayHasOverlaps([], [])).toBe(false);
    });

    test("returns false when first array is empty", () => {
        expect(arrayHasOverlaps([], ["a", "b"])).toBe(false);
    });

    test("returns false when second array is empty", () => {
        expect(arrayHasOverlaps(["a", "b"], [])).toBe(false);
    });

    test("returns true when first array is a subset of the second", () => {
        expect(arrayHasOverlaps(["a"], ["a", "b", "c"])).toBe(true);
    });

    test("returns true when arrays are identical", () => {
        expect(arrayHasOverlaps(["a", "b"], ["a", "b"])).toBe(true);
    });

    test("returns true when there are multiple overlapping elements", () => {
        expect(arrayHasOverlaps(["a", "b", "c"], ["b", "c", "d"])).toBe(true);
    });

    test("returns true with a single shared element in larger arrays", () => {
        expect(arrayHasOverlaps(["x", "y", "z"], ["a", "b", "z", "c"])).toBe(
            true,
        );
    });
});
