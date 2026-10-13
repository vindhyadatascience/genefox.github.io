import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COPY, MAX_CHOSEN, capabilityName, listWords, reviewModel, toggle, datasetName, canApprove, chosenIds, hostName,
  reasonOf, describeAccessError, formatWhen, coolingOff, bannerFor, readAddress, defaultDeviceLabel, reauthProvider,
} from "../access.js";

const NOW = 1_800_000_000_000;
const DAY = 24 * 60 * 60 * 1000;
const titles = (held, extra = {}, grantsReadable = true) => ({
  held: held.map(([id, title]) => ({ id, title })),
  titles: new Map([...held, ...Object.entries(extra)]),
  grantsReadable,
});

test("the approval wording is the approved text (bead wgd2.3 notes; FoxKit AgentApprovalCopy)", () => {
  assert.equal(COPY.heading("Jo's Mac", "TCGA BRCA"), "Let AI assistants on Jo's Mac use TCGA BRCA?");
  assert.equal(COPY.body("Jo's Mac", "TCGA BRCA"), "This lets AI assistants and other programs on Jo's Mac read TCGA BRCA through your account. "
    + "It lasts up to 30 days, ends sooner if unused for 7 days, and you can withdraw it any time under Linked computers.");
  assert.equal(COPY.whatThisIs("Jo's Mac"), "What this approval is: your consent, a record of what you approved and when, and a time limit. "
    + "It is not a lock against the computer itself. A program that can act as you on Jo's Mac, "
    + "for example one that can use your terminal or browser, can use whatever you approve here.");
  assert.equal(COPY.onlyApprove, "Only approve on a computer you control, and only data your licence lets you use with these tools.");
  assert.deepEqual([COPY.approveButton, COPY.cancelButton], ["Approve with passkey", "Cancel"]);
});

test("names: capabilities by their app names, lists as a sentence, an unnamed computer", () => {
  assert.equal(capabilityName("batchExplorer"), "Batch Explorer");
  assert.equal(capabilityName("reproducibilityPacks"), "R Reproduction");
  assert.equal(capabilityName("futureThing"), "futureThing");
  assert.equal(capabilityName("constructor"), "constructor", "no prototype lookups");
  assert.deepEqual([listWords([]), listWords(["A"]), listWords(["A", "B"]), listWords(["A", "B", "C"])], ["", "A", "A and B", "A, B and C"]);
  assert.equal(hostName(null), "an unnamed computer");
  assert.equal(hostName(" Jo‮'s Mac "), "Jo 's Mac");
});

test("a named request: each requested dataset ticked, one without a live grant shown unavailable and disabled; untick, never add", () => {
  const model = reviewModel({ resourceIds: ["gse1", "gse9"], capabilities: ["batchExplorer"] }, titles([["gse1", "Zebrafish atlas"]]));
  assert.equal(model.chooseInApp, false);
  assert.deepEqual(model.resources, [
    { id: "gse1", title: "Zebrafish atlas", checked: true, disabled: false, note: "" },
    { id: "gse9", title: "gse9", checked: false, disabled: true, note: "Not available on this account" },
  ]);
  assert.deepEqual(model.capabilities, [{ id: "batchExplorer", name: "Batch Explorer", checked: true }]);
  assert.equal(datasetName(model), "Zebrafish atlas and Batch Explorer");
  assert.deepEqual(chosenIds(model), { resourceIds: ["gse1"], capabilities: ["batchExplorer"] });
  // A disabled box can't be ticked; an id not in the request can't be added.
  assert.equal(toggle(model, "resource", "gse9"), model);
  assert.equal(toggle(model, "resource", "gse-other"), model);
  const narrowed = toggle(toggle(model, "resource", "gse1"), "capability", "batchExplorer");
  assert.equal(canApprove(narrowed), false, "nothing left to approve");
  assert.deepEqual(chosenIds(toggle(model, "resource", "gse1")), { resourceIds: [], capabilities: ["batchExplorer"] });
  assert.equal(canApprove(toggle(model, "resource", "gse1")), true, "a named request may approve capabilities alone");
});

test("a chooseInApp request: every live licensed dataset, none ticked; Approve needs one; at most 64", () => {
  const held = Array.from({ length: 70 }, (_, i) => [`gse${i}`, `Dataset ${String(i).padStart(2, "0")}`]);
  let model = reviewModel({ chooseInApp: true, resourceIds: [], capabilities: ["batchExplorer"] }, titles(held));
  assert.equal(model.chooseInApp, true);
  assert.equal(model.resources.length, 70);
  assert.ok(model.resources.every((r) => !r.checked && !r.disabled));
  assert.equal(canApprove(model), false);
  assert.equal(datasetName(model), COPY.chosenPlaceholder);
  model = toggle(model, "resource", "gse3");
  assert.equal(canApprove(model), true);
  assert.equal(datasetName(model), "Dataset 03 and Batch Explorer");
  for (let i = 0; i < 70; i += 1) model = toggle(model, "resource", `gse${i}`);
  // gse3 was unticked by the loop; the 65th tick was refused, with the notice.
  assert.equal(model.resources.filter((r) => r.checked).length, MAX_CHOSEN);
  assert.equal(model.notice, COPY.tooManyChosen);
  model = toggle(model, "resource", "gse0");
  assert.equal(model.notice, "", "unticking clears the notice");
  assert.equal(chosenIds(model).resourceIds.length, MAX_CHOSEN - 1);
});

test("a chooseInApp request with nothing to choose says why: none held, or the list couldn't be read", () => {
  assert.equal(reviewModel({ chooseInApp: true }, titles([])).notice, COPY.noLicensedDatasets);
  assert.equal(reviewModel({ chooseInApp: true }, titles([], {}, false)).notice, COPY.datasetsUnavailable);
  assert.equal(reviewModel({ resourceIds: "junk", capabilities: [1, "batchExplorer"] }, titles([])).capabilities.length, 1);
});

const httpsError = (code, message, details) => Object.assign(new Error(message), { code: `functions/${code}`, details });

test("refusals in plain words, by the server's reason first", () => {
  assert.equal(reasonOf(httpsError("unauthenticated", "x", { reason: "stale-sign-in" })), "stale-sign-in");
  assert.equal(reasonOf({}), "");
  const cases = [
    [httpsError("unauthenticated", "Sign in again to approve agent access.", { reason: "stale-sign-in" }), COPY.signInAgain],
    [httpsError("failed-precondition", "x", { reason: "email-unverified" }), /from the GeneFox app/],
    [httpsError("failed-precondition", "x", { reason: "passkey-limit" }), /most passkeys/],
    [httpsError("permission-denied", "x", { reason: "ticket-unavailable" }), /expired, was already used, or was turned down/],
    [httpsError("permission-denied", "x", { reason: "challenge-unavailable" }), /expired, was already used, or was turned down/],
    [httpsError("permission-denied", "x", { reason: "passkey-not-verified" }), /could not be verified/],
    [httpsError("permission-denied", "x", { reason: "email-link-unavailable" }), /email link can't be used/],
    [httpsError("permission-denied", "x", { reason: "origin" }), /genefox\.app\/agent-access/],
    [httpsError("failed-precondition", "A verified passkey from the GeneFox app is required to approve agent access.", { reason: "passkey-required" }), /needed to approve/],
    [httpsError("failed-precondition", "Confirm with a passkey to remove this one.", { reason: "passkey-required" }), /to remove this one/],
    [httpsError("permission-denied", "x", { reason: "passkey-unavailable" }), /no longer on your account/],
    [httpsError("resource-exhausted", "Too many requests today. Try again tomorrow."), /3 new passkeys today/],
    [httpsError("resource-exhausted", "Too many requests. Wait a minute."), /one minute/],
    [httpsError("deadline-exceeded", "That request has expired."), /new code/],
    [httpsError("permission-denied", "That request is unavailable."), /not recognized for this account/],
    [httpsError("permission-denied", "This account has no live grant for one of those resources."), /no longer holds/],
    [httpsError("failed-precondition", "That request already has a decision."), /already has a decision/],
    [httpsError("invalid-argument", "Choose at least one dataset to approve."), /Choose at least one dataset/],
    [httpsError("already-exists", "x"), /already on your account/],
    [httpsError("internal", "internal"), /Could not reach GeneFox/],
  ];
  for (const [err, expected] of cases) {
    const text = describeAccessError(err);
    if (expected instanceof RegExp) assert.match(text, expected, err.message);
    else assert.equal(text, expected);
  }
});

test("dates in the person's locale; a missing one says so", () => {
  assert.equal(formatWhen(Date.UTC(2026, 9, 12, 14, 5), "en-GB", "UTC"), "12 Oct 2026, 14:05");
  assert.equal(formatWhen(undefined), "an unknown time");
});

test("the banner: a passkey still waiting first, else one added in the last 7 days; nothing otherwise", () => {
  const waiting = { credentialId: "w", deviceLabel: "Chrome on Linux", channel: "web", createdAtMs: NOW - 1000, approvableAfterMs: NOW + DAY - 1000 };
  const active = { credentialId: "a", deviceLabel: "Jo's iPhone", channel: "native", createdAtMs: NOW - 30 * DAY, approvableAfterMs: NOW - 30 * DAY };
  const both = bannerFor({ passkeys: [active, waiting], events: [], nowMs: NOW, locale: "en-GB", timeZone: "UTC" });
  assert.equal(both.credentialId, "w");
  assert.match(both.text, /“Chrome on Linux”/);
  assert.match(both.text, /can approve from/);
  assert.match(both.text, /remove it now/);
  const recent = { type: "passkeyAdded", credentialId: "a2", deviceLabel: "Key", channel: "web", createdAtMs: NOW - 2 * DAY };
  const added = bannerFor({ passkeys: [active], events: [recent], nowMs: NOW, locale: "en-GB", timeZone: "UTC" });
  assert.equal(added.credentialId, null, "removed since: nothing to point at");
  assert.match(added.text, /“Key”, was added .* \(added on the web\)/);
  assert.equal(bannerFor({ passkeys: [active], events: [{ ...recent, createdAtMs: NOW - 8 * DAY }], nowMs: NOW }), null);
  assert.equal(bannerFor({ passkeys: [active], events: [{ ...recent, type: "passkeyRemoved" }], nowMs: NOW }), null);
  assert.equal(bannerFor({ nowMs: NOW }), null);
  assert.equal(coolingOff({ approvableAfterMs: NOW }, NOW), false);
  assert.equal(coolingOff({ approvableAfterMs: NOW + 1 }, NOW), true);
  assert.equal(coolingOff({}, NOW), false, "a native row with no field is active");
});

test("the address: ?code= is a prefill; an email link opens the confirm view; every one of them is stripped", () => {
  const plain = readAddress("?code=3f9a0-b21c7&emulator=1");
  assert.deepEqual([plain.code, plain.confirm, plain.keep.toString()], ["3f9a0-b21c7", null, "emulator=1"]);
  const ticket = "0B8A3C7E-5D2F-4E61-8A0C-3F5E7D9B1A22";
  const link = readAddress(`?confirm=${ticket}&apiKey=AIza&oobCode=abcDEF_123-xyz&mode=signIn&lang=en`);
  assert.deepEqual(link.confirm, { ticketId: ticket.toLowerCase(), oobCode: "abcDEF_123-xyz" });
  assert.equal(link.keep.toString(), "");
  for (const broken of [`?confirm=${ticket}&mode=signIn`, `?confirm=nope&oobCode=abcDEF_123-xyz&mode=signIn`,
    `?confirm=${ticket}&oobCode=abcDEF_123-xyz&mode=resetPassword`, `?confirm=${ticket}&oobCode=short&mode=signIn`]) {
    assert.equal(readAddress(broken).confirm, "broken", broken);
  }
  // Email-link parameters outside a confirm link are ignored, and stripped.
  const stray = readAddress("?oobCode=abcDEF_123-xyz&mode=signIn&apiKey=k&continueUrl=x&tenantId=t");
  assert.deepEqual([stray.confirm, stray.keep.toString()], [null, ""]);
});

test("a default passkey name from the browser", () => {
  const cases = [
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", "Chrome on Windows"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0", "Edge on Windows"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15", "Safari on Mac"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1", "Chrome on iPhone"],
    ["Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0", "Firefox on Linux"],
    ["Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36", "Chrome on Android"],
    ["", "Browser"],
  ];
  for (const [ua, label] of cases) assert.equal(defaultDeviceLabel(ua), label);
});

test("re-sign-in uses the account's own provider; a custom-token session has none", () => {
  assert.equal(reauthProvider({ providerData: [{ providerId: "google.com" }] }), "google");
  assert.equal(reauthProvider({ providerData: [{ providerId: "apple.com" }] }), "apple");
  assert.equal(reauthProvider({ providerData: [{ providerId: "microsoft.com" }] }), "microsoft");
  assert.equal(reauthProvider({ providerData: [] }), "");
  assert.equal(reauthProvider(null), "");
});
