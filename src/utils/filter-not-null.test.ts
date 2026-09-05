import { describe, expect, test } from "bun:test";
import { filterNotNull } from "./filter-not-null";

describe("filterNotNull", () => {
    test("filters out null values", () => {
        expect(filterNotNull([1, null, 2, 3])).toEqual([1, 2, 3]);
    });

    test("filters out undefined values", () => {
        expect(filterNotNull([1, undefined, 2])).toEqual([1, undefined, 2]);
    });

    test("returns empty array when all values are null", () => {
        expect(filterNotNull([null, null, null])).toEqual([]);
    });

    test("returns the original array when there are no null values", () => {
        const input = [1, 2, 3];
        expect(filterNotNull(input)).toEqual(input);
    });

    test("returns empty array for empty input", () => {
        expect(filterNotNull([])).toEqual([]);
    });

    test("works with objects", () => {
        const obj = { a: 1 };
        expect(filterNotNull([obj, null, { b: 2 }])).toEqual([obj, { b: 2 }]);
    });

    test("preserves order of remaining elements", () => {
        expect(filterNotNull(["a", null, "b", null, "c"])).toEqual([
            "a",
            "b",
            "c",
        ]);
    });
});
