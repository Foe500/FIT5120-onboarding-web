import assert from "node:assert/strict";
import test from "node:test";
import { getValidatedRefuges, validateRefugeLocation } from "./refuges.js";

test("only returns validated sensory refuge locations", () => {
  assert.ok(getValidatedRefuges().length > 0);
});

test("rejects a refuge without an approved category or source", () => {
  assert.throws(() => validateRefugeLocation({ name: "Test", category: "Cafe", coordinates: [-37.81, 144.96], source: "" }));
});
