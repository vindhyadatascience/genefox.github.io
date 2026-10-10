// genefox.app/link: approve or decline a GeneFox command-line tools link request.
//
// Backend contract (RNABrowser/functions/src/helper-link.ts, callable `linkApprove`,
// region us-central1): {userCode, action: "inspect"|"approve"|"decline"}.
//   inspect -> {id, thumbprint, host, hostLabel, expiresAtMs, serverTimeMs}
//   approve/decline must echo {thumbprint, host} from inspect -> {status}
// The signed-in Firebase uid alone selects the account; nothing here names an account.
//
// Everything the helper supplied (hostLabel) is untrusted: it goes into the page through
// textContent only, after cleanHostLabel(). No innerHTML anywhere in this file.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  initializeAuth, browserSessionPersistence, browserPopupRedirectResolver,
  onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider, OAuthProvider,
  connectAuthEmulator,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFunctions, httpsCallable, connectFunctionsEmulator,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js";
import {
  normalizeCode, cleanHostLabel, formatRemaining, describeCallError, describeAuthError,
} from "./code.js";

// Clickjacking guard: GitHub Pages cannot send frame-ancestors, so refuse to work framed.
if (window.top !== window.self) {
  document.body.textContent = "For your safety, this page only works when opened directly. Open genefox.app/link in a new tab.";
  throw new Error("framed");
}

// Public client configuration (not secrets). messagingSenderId/appId/storageBucket are not
// needed for Auth + Functions; TODO add appId from the Firebase console if that changes.
const PRODUCTION_CONFIG = {
  apiKey: "AIzaSyCdBtmkreiH3q-rPdSdDhlcSd7BsYGyT_c",
  authDomain: "vds-genefox.firebaseapp.com",
  projectId: "vds-genefox",
};
const REGION = "us-central1";

// Local testing only: http://localhost:8000/link/?emulator=1 talks to the Firebase
// emulators (Auth 9099, Functions 5001) under a demo- project that can never reach production.
const params = new URLSearchParams(location.search);
const local = location.hostname === "localhost" || location.hostname === "127.0.0.1";
const useEmulator = local && params.get("emulator") === "1";
const config = useEmulator
  ? { apiKey: "demo-key", authDomain: "localhost", projectId: params.get("project") || "demo-genefox" }
  : PRODUCTION_CONFIG;

const app = initializeApp(config);
// Session persistence: closing the tab signs the approver out of this page.
const auth = initializeAuth(app, {
  persistence: browserSessionPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});
const functions = getFunctions(app, REGION);
if (useEmulator) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}
const linkApprove = httpsCallable(functions, "linkApprove", { timeout: 20000 });

// ---- elements ----
const $ = (id) => document.getElementById(id);
const steps = { signin: $("step-signin"), code: $("step-code"), confirm: $("step-confirm"), done: $("step-done") };
const accountBox = $("account"), accountName = $("account-name");
const codeForm = $("code-form"), codeInput = $("code"), codeError = $("code-error"), codeSubmit = $("code-submit");
const approveBtn = $("approve"), declineBtn = $("decline"), confirmError = $("confirm-error"), remainingEl = $("remaining");
const statusEl = $("status");

// ---- state ----
let pending = null;      // {userCode, thumbprint, host, expiresAtMs, clockOffsetMs, label}
let timer = 0;
let busy = false;

function show(name) {
  for (const [key, el] of Object.entries(steps)) el.hidden = key !== name;
}
function announce(text) { statusEl.textContent = ""; setTimeout(() => { statusEl.textContent = text; }, 30); }
function setBusy(on, ...buttons) {
  busy = on;
  for (const b of buttons) { b.disabled = on; b.setAttribute("aria-busy", on ? "true" : "false"); }
}
function accountLabel(user) {
  if (!user) return "";
  if (user.email) return user.email;
  const p = user.providerData.find((d) => d.email);
  return p?.email || user.displayName || "your GeneFox account";
}

// ---- prefill: ?code= is only ever a prefill; nothing is inspected or approved until the
// person presses Continue. Remove it from the address bar so it doesn't linger in history.
{
  const prefill = params.get("code");
  if (prefill) {
    const n = normalizeCode(prefill);
    if (!n.error) codeInput.value = n.value;
    params.delete("code");
    const q = params.toString();
    history.replaceState(null, "", location.pathname + (q ? `?${q}` : "") + location.hash);
  }
}

// ---- step 1: sign in ----
function providerFor(name) {
  if (name === "google") {
    const p = new GoogleAuthProvider();
    p.setCustomParameters({ prompt: "select_account" });
    return p;
  }
  if (name === "apple") {
    const p = new OAuthProvider("apple.com");
    p.addScope("email"); p.addScope("name");
    return p;
  }
  // Same scopes as the iOS app's Microsoft flow (AppleAccountProvider.signInWithMicrosoft).
  const p = new OAuthProvider("microsoft.com");
  for (const s of ["openid", "email", "profile"]) p.addScope(s);
  p.setCustomParameters({ prompt: "select_account" });
  return p;
}

for (const button of steps.signin.querySelectorAll("[data-provider]")) {
  button.addEventListener("click", async () => {
    if (busy) return;
    $("signin-error").textContent = "";
    const all = steps.signin.querySelectorAll("[data-provider]");
    setBusy(true, ...all);
    try {
      await signInWithPopup(auth, providerFor(button.dataset.provider));
    } catch (err) {
      $("signin-error").textContent = describeAuthError(err);
    } finally {
      setBusy(false, ...all);
    }
  });
}

$("signout").addEventListener("click", async () => {
  try { await signOut(auth); } catch { /* state listener resets the page either way */ }
});

onAuthStateChanged(auth, (user) => {
  clearPending();
  if (!user) {
    accountBox.hidden = true;
    show("signin");
    return;
  }
  accountName.textContent = accountLabel(user);
  accountBox.hidden = false;
  show("code");
  codeError.textContent = "";
  codeInput.focus();
});

// ---- step 2: code ----
function validateInput(final) {
  const n = normalizeCode(codeInput.value);
  if (codeInput.value !== n.value) {
    codeInput.value = n.value;
  }
  let message = n.error;
  if (!message && final && !n.complete) message = "Enter all 10 characters of the code, for example 3F9A0-B21C7.";
  codeError.textContent = message;
  codeInput.setAttribute("aria-invalid", message ? "true" : "false");
  return n.complete && !n.error ? n.value : null;
}
codeInput.addEventListener("input", () => validateInput(false));
codeInput.addEventListener("blur", () => { if (codeInput.value) validateInput(true); });

codeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  const userCode = validateInput(true);
  if (!userCode) { codeInput.focus(); return; }
  if (!auth.currentUser) { show("signin"); return; }
  setBusy(true, codeSubmit);
  codeSubmit.textContent = "Checking…";
  try {
    const { data } = await linkApprove({ userCode, action: "inspect" });
    beginConfirm(userCode, data);
  } catch (err) {
    codeError.textContent = describeCallError(err);
    codeInput.setAttribute("aria-invalid", "true");
    codeInput.focus();
  } finally {
    setBusy(false, codeSubmit);
    codeSubmit.textContent = "Continue";
  }
});

// ---- step 3: confirm ----
function beginConfirm(userCode, data) {
  const valid = data && typeof data.thumbprint === "string" && typeof data.host === "string"
    && Number.isFinite(data.expiresAtMs) && Number.isFinite(data.serverTimeMs);
  if (!valid) {
    codeError.textContent = "GeneFox returned an unexpected answer. Try again, or start linking again on your computer.";
    return;
  }
  pending = {
    userCode, thumbprint: data.thumbprint, host: data.host, expiresAtMs: data.expiresAtMs,
    // Count down against the server's clock, not this device's.
    clockOffsetMs: data.serverTimeMs - Date.now(),
  };
  const label = cleanHostLabel(data.hostLabel);
  pending.label = label;
  for (const el of steps.confirm.querySelectorAll("[data-host]")) el.textContent = label;
  for (const el of steps.confirm.querySelectorAll("[data-email]")) el.textContent = accountLabel(auth.currentUser);
  confirmError.textContent = "";
  approveBtn.disabled = false; declineBtn.disabled = false;
  show("confirm");
  tick();
  timer = setInterval(tick, 1000);
  $("confirm-title").focus();
}

function remainingMs() {
  return pending ? pending.expiresAtMs - (Date.now() + pending.clockOffsetMs) : 0;
}
function tick() {
  const ms = remainingMs();
  remainingEl.textContent = formatRemaining(ms);
  if (ms <= 0) {
    clearInterval(timer);
    approveBtn.disabled = true;
    confirmError.textContent = "This code has expired. Start linking again on your computer to get a new code.";
  }
}
function clearPending() {
  clearInterval(timer);
  pending = null;
}

async function decide(action) {
  if (busy || !pending) return;
  if (action === "approve" && remainingMs() <= 0) { tick(); return; }
  const { userCode, thumbprint, host } = pending;
  confirmError.textContent = "";
  setBusy(true, approveBtn, declineBtn);
  const button = action === "approve" ? approveBtn : declineBtn;
  const original = button.textContent;
  button.textContent = action === "approve" ? "Approving…" : "Declining…";
  try {
    const { data } = await linkApprove({ userCode, action, thumbprint, host });
    const status = data?.status;
    if (status !== "approved" && status !== "declined") throw Object.assign(new Error("unexpected"), { code: "functions/internal", message: "unexpected" });
    finish(status);
  } catch (err) {
    confirmError.textContent = describeCallError(err);
    setBusy(false, approveBtn, declineBtn);
    if (remainingMs() <= 0) approveBtn.disabled = true;
    button.textContent = original;
  }
}
approveBtn.addEventListener("click", () => decide("approve"));
declineBtn.addEventListener("click", () => decide("decline"));

// ---- step 4: outcome ----
function finish(status) {
  const label = pending?.label ?? "that computer";
  clearPending();
  busy = false;
  const done = steps.done;
  done.classList.toggle("ok", status === "approved");
  done.classList.toggle("no", status !== "approved");
  if (status === "approved") {
    $("done-mark").textContent = "Approved";
    $("done-title").textContent = "One more step on your computer";
    $("done-body").textContent = `GeneFox on ${label} will now ask you to confirm on its own screen. Confirm there to finish linking.`;
    $("done-next").textContent = "If your computer doesn't ask, or you didn't start this, decline on that computer and nothing is linked. You can close this page.";
  } else {
    $("done-mark").textContent = "Not linked";
    $("done-title").textContent = "Nothing was linked";
    $("done-body").textContent = `The GeneFox command-line tools on ${label} were not given access to your account.`;
    $("done-next").textContent = "You can close this page.";
  }
  show("done");
  announce(status === "approved" ? "Approved. Confirm on your computer to finish." : "Declined. Nothing was linked.");
  $("done-title").focus();
}
