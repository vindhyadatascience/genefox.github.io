import { test } from "node:test";
import assert from "node:assert/strict";
import { grantIsLive, cleanTitle, firestoreReaders, readTitles, setText, TITLE_MAX } from "../titles.js";

const NOW = 1_800_000_000_000;

test("a grant is live with no expiry or one still ahead (as the server and rules judge it)", () => {
  assert.equal(grantIsLive({}, NOW), true);
  assert.equal(grantIsLive({ expiresAtMs: null }, NOW), true);
  assert.equal(grantIsLive({ expiresAtMs: NOW + 1 }, NOW), true);
  assert.equal(grantIsLive({ expiresAtMs: NOW }, NOW), false);
  assert.equal(grantIsLive({ expiresAtMs: "never" }, NOW), false);
  assert.equal(grantIsLive(undefined, NOW), false);
});

test("titles are plain single-line text: controls and bidi overrides gone, long ones cut, empty falls back", () => {
  assert.equal(cleanTitle("TCGA ‮evil‬  BRCA\n(2024)", "x"), "TCGA evil BRCA (2024)");
  assert.equal(cleanTitle("", "gse1"), "gse1");
  assert.equal(cleanTitle(42, "gse1"), "gse1");
  assert.equal(cleanTitle(" ​ ", "gse1"), "gse1");
  const long = cleanTitle("a".repeat(500), "x");
  assert.equal(Array.from(long).length, TITLE_MAX);
  assert.ok(long.endsWith("…"));
  assert.equal(cleanTitle("<img src=x onerror=alert(1)>", "x"), "<img src=x onerror=alert(1)>", "kept as text; setText never parses it");
});

test("readTitles: live grants by title, sorted; expired grants left out; a requested id without a grant keeps its id", async () => {
  const asked = [];
  const result = await readTitles({
    listGrants: async () => [
      { id: "gse2", data: {} }, { id: "gse1", data: { expiresAtMs: NOW + 1000 } }, { id: "old", data: { expiresAtMs: NOW - 1 } },
    ],
    getDescriptor: async (id) => { asked.push(id); return { gse1: { displayName: "Zebrafish atlas" }, gse2: { displayName: "Breast cancer cohort" } }[id]; },
    ids: ["gse1", "old", "unknown"],
    nowMs: NOW,
  });
  assert.deepEqual(result.held, [{ id: "gse2", title: "Breast cancer cohort" }, { id: "gse1", title: "Zebrafish atlas" }]);
  assert.equal(result.titles.get("old"), "old");
  assert.equal(result.titles.get("unknown"), "unknown");
  assert.equal(result.grantsReadable, true);
  assert.deepEqual(asked.sort(), ["gse1", "gse2"], "descriptors are read only for live grants (the rules would deny the rest)");
});

test("readTitles falls back to ids: a denied or missing descriptor, a title that isn't text, an unreadable grant list", async () => {
  const result = await readTitles({
    listGrants: async () => [{ id: "a", data: {} }, { id: "b", data: {} }, { id: "c", data: {} }],
    getDescriptor: async (id) => { if (id === "a") throw new Error("permission-denied"); return id === "b" ? undefined : { displayName: ["x"] }; },
    nowMs: NOW,
  });
  assert.deepEqual(result.held.map((h) => h.title), ["a", "b", "c"]);
  const none = await readTitles({ listGrants: async () => { throw new Error("offline"); }, getDescriptor: async () => ({}), ids: ["x"], nowMs: NOW });
  assert.deepEqual([none.held, none.grantsReadable, none.titles.get("x")], [[], false, "x"]);
});

test("firestoreReaders reads curated/grants/{uid} and curated/resources/{id}/descriptor, nothing else", async () => {
  const paths = [];
  const fs = {
    collection: (db, ...segments) => { paths.push(["collection", db, segments.join("/")]); return { kind: "collection" }; },
    getDocs: async () => ({ docs: [{ id: "gse1", data: () => ({ grantedAtMs: 1 }) }] }),
    doc: (db, ...segments) => { paths.push(["doc", db, segments.join("/")]); return { kind: "doc" }; },
    getDoc: async () => ({ exists: () => true, data: () => ({ displayName: "T" }) }),
  };
  const readers = firestoreReaders(fs, "DB", "uid-1");
  assert.deepEqual(await readers.listGrants(), [{ id: "gse1", data: { grantedAtMs: 1 } }]);
  assert.deepEqual(await readers.getDescriptor("gse1"), { displayName: "T" });
  assert.deepEqual(paths, [["collection", "DB", "curated/grants/uid-1"], ["doc", "DB", "curated/resources/gse1/descriptor"]]);
  const missing = firestoreReaders({ ...fs, getDoc: async () => ({ exists: () => false, data: () => ({}) }) }, "DB", "u");
  assert.equal(await missing.getDescriptor("x"), undefined);
});

test("setText writes textContent only", () => {
  const element = { textContent: "" };
  assert.equal(setText(element, "<b>x</b>"), element);
  assert.equal(element.textContent, "<b>x</b>");
  assert.ok(!("innerHTML" in element));
});
