// A local copy of /agent-access for the Firebase emulators, never published:
//   node agent-access/tests/local-copy.mjs <out-dir>
//   cd <out-dir> && python3 -m http.server 8000   # http://localhost:8000/agent-access/?emulator=1
// The published page's CSP (docs/WebPasskeys2026-10.md 6.2) does not allow the emulators; this copy's
// does (Auth 9099, Functions 5001, Firestore 8080), as /link allows them. The out directory gets
// agent-access/, link/ (for code.js) and assets/.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const EMULATOR_CONNECT = "http://127.0.0.1:9099 http://127.0.0.1:5001 http://127.0.0.1:8080 http://localhost:9099 http://localhost:5001 http://localhost:8080";
const EMULATOR_FRAME = "http://127.0.0.1:9099 http://localhost:9099";

/** The page with the emulator sources added to connect-src and frame-src. */
export function emulatorPage(html) {
  let out = html.replace(/(connect-src [^;"]*)/, `$1 ${EMULATOR_CONNECT}`).replace(/(frame-src [^;"]*)/, `$1 ${EMULATOR_FRAME}`);
  if (out === html) throw new Error("no CSP to extend");
  out = out.replace("<head>", "<head>\n<!-- LOCAL EMULATOR COPY: never publish (agent-access/tests/local-copy.mjs) -->");
  return out;
}

export function writeLocalCopy(outDir) {
  const out = resolve(outDir);
  if (out === SITE || out.startsWith(SITE + "\\") || out.startsWith(SITE + "/")) throw new Error("write the copy outside the site repository");
  for (const dir of ["agent-access", "link", "assets"]) cpSync(join(SITE, dir), join(out, dir), { recursive: true });
  const page = join(out, "agent-access", "index.html");
  writeFileSync(page, emulatorPage(readFileSync(page, "utf8")));
  mkdirSync(out, { recursive: true });
  return page;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outDir = process.argv[2];
  if (!outDir) { console.error("usage: node agent-access/tests/local-copy.mjs <out-dir>"); process.exit(2); }
  console.log(writeLocalCopy(outDir));
}
