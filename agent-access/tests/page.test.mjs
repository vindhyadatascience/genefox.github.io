// The page's static guarantees (docs/WebPasskeys2026-10.md 6 and 7): the CSP is exactly 6.2's, nothing
// writes HTML from a string, the SDK is pinned, every element the script uses exists.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { emulatorPage, writeLocalCopy } from "./local-copy.mjs";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(DIR, "index.html"), "utf8");
const scripts = readdirSync(DIR).filter((f) => f.endsWith(".js")).map((f) => [f, readFileSync(join(DIR, f), "utf8")]);
const main = readFileSync(join(DIR, "agent-access.js"), "utf8");
/** The /link helpers the page imports are part of what it runs. */
const linkCode = readFileSync(join(DIR, "..", "link", "code.js"), "utf8");
/** The body of a top-level function in agent-access.js. */
function body(name) {
  const start = main.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  return main.slice(start, main.indexOf("\n}\n", start));
}

/** Section 6.2, verbatim. */
const CSP = [
  "default-src 'none'",
  "script-src 'self' https://www.gstatic.com https://apis.google.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://us-central1-vds-genefox.cloudfunctions.net https://firestore.googleapis.com",
  "frame-src https://vds-genefox.firebaseapp.com https://apis.google.com",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
];

function cspOf(page) {
  const metas = [...page.matchAll(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/g)];
  assert.equal(metas.length, 1, "exactly one CSP meta");
  return metas[0][1].split(";").map((d) => d.trim().replace(/\s+/g, " ")).filter(Boolean);
}

test("the CSP is exactly section 6.2's, with no emulator or other sources", () => {
  assert.deepEqual(cspOf(html), CSP);
  assert.doesNotMatch(html, /127\.0\.0\.1|localhost:/);
});

test("noindex, no referrer, the canonical address, and one module script from this directory", () => {
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.match(html, /<meta name="referrer" content="no-referrer">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/genefox\.app\/agent-access\/">/);
  const tags = [...html.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
  assert.deepEqual(tags, ['<script type="module" src="./agent-access.js">']);
  assert.doesNotMatch(html, /\son[a-z]+="/i, "no inline event handlers");
});

test("nothing builds HTML from a string: no innerHTML, outerHTML, insertAdjacentHTML, document.write, eval or Function", () => {
  for (const [name, source] of [...scripts, ["index.html", html], ["../link/code.js", linkCode]]) {
    for (const banned of [/\binnerHTML\b/, /\bouterHTML\b/, /\binsertAdjacentHTML\b/, /\bdocument\.write/, /\beval\s*\(/, /\bnew Function\b/, /\bcreateContextualFragment\b/]) {
      assert.doesNotMatch(source.replace(/^\s*\/\/.*$/gm, ""), banned, `${name}: ${banned}`);
    }
  }
});

test("the Firebase SDK is pinned to 10.14.1 from gstatic; the page's own modules are .js files that exist", () => {
  const imports = [...main.matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
  const remote = imports.filter((s) => s.startsWith("https://"));
  assert.deepEqual(remote.sort(), [
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js",
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js",
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-lite.js",
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js",
  ]);
  for (const [name, source] of scripts) {
    for (const [, spec] of source.matchAll(/from "(\.[^"]+)"/g)) {
      assert.ok(spec.endsWith(".js"), `${name}: ${spec} must be .js (Pages' type for .mjs is unverified)`);
      readFileSync(join(DIR, spec));
    }
  }
});

test("every element id the script reaches for is in the page", () => {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const used = new Set([...main.matchAll(/\$\("([^"]+)"\)/g)].map((m) => m[1]));
  for (const name of ["signin", "code", "review", "enroll", "email", "confirm", "cooling", "passkeys", "done"]) used.add(`step-${name}`);
  const missing = [...used].filter((id) => !ids.has(id));
  assert.deepEqual(missing, []);
});

test("the approve button is never the default: Cancel comes first, and nothing is a submit outside the two forms", () => {
  const review = html.slice(html.indexOf('id="step-review"'), html.indexOf("</section>", html.indexOf('id="step-review"')));
  assert.ok(review.indexOf('id="cancel"') < review.indexOf('id="approve"'));
  assert.doesNotMatch(review, /type="submit"/);
});

test("the local emulator copy adds the emulator sources and is refused inside the repository", () => {
  const local = emulatorPage(html);
  const csp = cspOf(local);
  assert.match(csp.find((d) => d.startsWith("connect-src")), /http:\/\/127\.0\.0\.1:8080/);
  assert.match(csp.find((d) => d.startsWith("frame-src")), /http:\/\/127\.0\.0\.1:9099/);
  assert.match(local, /never publish/);
  assert.throws(() => writeLocalCopy(join(DIR, "..", "tmp-copy")), /outside the site repository/);
  const out = mkdtempSync(join(tmpdir(), "agent-access-"));
  try {
    const page = writeLocalCopy(out);
    assert.match(readFileSync(page, "utf8"), /127\.0\.0\.1:5001/);
    readFileSync(join(out, "link", "code.js"));
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("the page refuses to run in a frame, before Firebase or anything else starts", () => {
  const guard = main.indexOf("if (window.top !== window.self) {");
  assert.ok(guard > 0, "frame guard present");
  assert.match(main.slice(guard, guard + 300), /throw new Error\("framed"\)/);
  for (const later of ["initializeApp(config)", "onAuthStateChanged(", "openConfirm()"]) {
    assert.ok(main.indexOf(later) > guard, `${later} runs after the guard`);
  }
});

test("the code and email-link parameters are read once, then stripped with replaceState before anything uses the page", () => {
  assert.equal(main.split("location.search").length - 1, 1, "the address is read in one place, readAddress");
  assert.match(main, /const address = readAddress\(location\.search\);/);
  const strip = main.indexOf('history.replaceState(null, "", location.pathname + (q ? `?${q}` : "") + location.hash);');
  assert.ok(strip > 0);
  assert.match(main.slice(main.lastIndexOf("{", strip), strip), /const q = address\.keep\.toString\(\);/);
  for (const later of ["onAuthStateChanged(", "openConfirm()", "api.decide(", "api.emailConfirm("]) {
    assert.ok(main.indexOf(later) > strip, `${later} comes after the strip`);
  }
});

test("removing a passkey: Keep comes first, is the primary button and has focus; Remove is second and plain", () => {
  const ask = body("askRemove");
  assert.match(ask, /const keep = el\("button", "btn", "Keep"\);/);
  assert.match(ask, /const yes = el\("button", "btn btn-quiet", "Remove"\);/);
  assert.match(ask, /actions\.append\(prompt, keep, yes\);/);
  assert.match(ask, /keep\.focus\(\);/);
  assert.doesNotMatch(ask, /yes\.focus\(\)/);
});

test("\"I didn't ask for this\" spends the ticket on the server; both approval-challenge fetches are checked alike", () => {
  const no = main.slice(main.indexOf('$("confirm-no").addEventListener'));
  assert.match(no.slice(0, 600), /action: "reject"/);
  assert.equal(main.split("api.approvalBegin(").length - 1, 2);
  for (const [, after] of main.matchAll(/api\.approvalBegin\([^)]*\);\n([^\n]*\n[^\n]*)/g)) {
    assert.match(after, /prepared = approvalChallenge\(data\);/);
  }
});
