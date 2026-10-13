// genefox.app/agent-access: approve an AI assistant's access request with a passkey, add a passkey on
// the web, and list or remove passkeys (RNABrowser-3caw; design docs/WebPasskeys2026-10.md, in the
// RNABrowser repository, sections 3 to 6).
//
// Backend (RNABrowser/functions/src, region us-central1):
//   agentApprovalDecide {userCode, action: inspect|approve|decline}       agent-approvals.ts
//   webPasskeyApprovalBegin {userCode} -> {challengeId, options}          web-passkeys.ts
//   webPasskeyEnrollBegin {deviceLabel} -> case A {stepUp: "passkey", ticketId, challengeId,
//     assertionOptions} | case B {stepUp: "emailLink", ticketId, emailHint}
//   webPasskeyEmailConfirm {action: inspect|confirm, ticketId, oobCode}   (no session needed)
//   webPasskeyEnrollConfirm {ticketId, assertion?} -> {status: "waiting"} | {challengeId, options}
//   webPasskeyEnrollFinish {challengeId, credential} -> {passkey}
//   webPasskeyList {} -> {passkeys, events}
//   webPasskeyDelete {credentialId, assertion?} -> {status: "deleted"} | {status: "needsPasskey", ...}
// The signed-in Firebase uid alone selects the account; nothing here names an account.
//
// Every passkey ceremony (navigator.credentials.get/create) runs straight from a button press, with
// its challenge fetched beforehand, so browsers that need a user gesture (Safari) allow it.
// Everything from the helper, the server or a dataset reaches the page through textContent only.
// No innerHTML anywhere in this file (tests/page.test.mjs checks).

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  initializeAuth, browserSessionPersistence, browserPopupRedirectResolver, onAuthStateChanged,
  signInWithPopup, reauthenticateWithPopup, signOut, sendSignInLinkToEmail, GoogleAuthProvider, OAuthProvider,
  connectAuthEmulator,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFunctions, httpsCallable, connectFunctionsEmulator,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js";
import {
  getFirestore, connectFirestoreEmulator, collection, getDocs, doc, getDoc,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-lite.js";
import { normalizeCode, formatRemaining, describeAuthError } from "../link/code.js";
import {
  requestOptionsFromJSON, creationOptionsFromJSON, credentialToJSON, passkeysAvailable, describeCeremonyError,
} from "./webauthn.js";
import { firestoreReaders, readTitles, setText } from "./titles.js";
import {
  COPY, reviewModel, toggle, datasetName, canApprove, chosenIds, hostName, reasonOf, describeAccessError,
  formatWhen, passkeyLabel, coolingOff, channelWords, bannerFor, readAddress, defaultDeviceLabel, reauthProvider,
  PROVIDER_NAMES,
} from "./access.js";

// Clickjacking guard: GitHub Pages cannot send frame-ancestors, so refuse to work framed.
if (window.top !== window.self) {
  document.body.textContent = "For your safety, this page only works when opened directly. Open genefox.app/agent-access in a new tab.";
  throw new Error("framed");
}

// Public client configuration (not secrets), as /link.
const PRODUCTION_CONFIG = {
  apiKey: "AIzaSyCdBtmkreiH3q-rPdSdDhlcSd7BsYGyT_c",
  authDomain: "vds-genefox.firebaseapp.com",
  projectId: "vds-genefox",
};
const REGION = "us-central1";
const PAGE_URL = "https://genefox.app/agent-access/";

// Local testing only: http://localhost:8000/agent-access/?emulator=1 talks to the Firebase emulators
// (Auth 9099, Functions 5001, Firestore 8080) under a demo- project that can never reach production.
// The published CSP blocks them; tests/local-copy.mjs makes a local copy whose CSP allows them.
const address = readAddress(location.search);
const local = location.hostname === "localhost" || location.hostname === "127.0.0.1";
const useEmulator = local && address.keep.get("emulator") === "1";
const config = useEmulator
  ? { apiKey: "demo-key", authDomain: "localhost", projectId: address.keep.get("project") || "demo-genefox" }
  : PRODUCTION_CONFIG;

const app = initializeApp(config);
// Session persistence: closing the tab signs the person out of this page.
const auth = initializeAuth(app, { persistence: browserSessionPersistence, popupRedirectResolver: browserPopupRedirectResolver });
const functions = getFunctions(app, REGION);
const firestore = getFirestore(app);
if (useEmulator) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
}
const callable = (name) => httpsCallable(functions, name, { timeout: 20000 });
const api = {
  decide: callable("agentApprovalDecide"),
  approvalBegin: callable("webPasskeyApprovalBegin"),
  enrollBegin: callable("webPasskeyEnrollBegin"),
  emailConfirm: callable("webPasskeyEmailConfirm"),
  enrollConfirm: callable("webPasskeyEnrollConfirm"),
  enrollFinish: callable("webPasskeyEnrollFinish"),
  list: callable("webPasskeyList"),
  remove: callable("webPasskeyDelete"),
};
const canUsePasskeys = passkeysAvailable(window);

// The address bar keeps nothing it was given: the ?code= prefill and the email link's code are read
// once, then stripped (design 3.1 step 1), so neither lingers in history.
{
  const q = address.keep.toString();
  history.replaceState(null, "", location.pathname + (q ? `?${q}` : "") + location.hash);
}

// ---- elements ----
const $ = (id) => document.getElementById(id);
const STEPS = ["signin", "code", "review", "enroll", "email", "confirm", "cooling", "passkeys", "done"];
const steps = Object.fromEntries(STEPS.map((name) => [name, $(`step-${name}`)]));
const statusEl = $("status");

// ---- state ----
let current = "";
let busy = false;
let review = null;      // {userCode, inspection, model, host, expiresAtMs, clockOffsetMs}
let prepared = null;    // {challengeId, options, expiresAtMs, clockOffsetMs}: the approval challenge, fetched ahead
let noPasskey = false;  // the account has no passkey: Approve stays off, Add a passkey shows instead
let reviewTimer = 0;
let enrollment = null;  // {returnTo, ticketId, stepUp, challengeId, assertionOptions, create: {challengeId, options}}
let pollTimer = 0;
let afterReauth = null; // what to do once the person has signed in again
let previous = "code";  // where Back goes from the passkeys, enroll and cooling views

function show(name) {
  if (current && current !== name && ["code", "review"].includes(current)) previous = current;
  current = name;
  for (const [key, el] of Object.entries(steps)) el.hidden = key !== name;
  $("reauth").hidden = true;
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
function clear(list) { while (list.firstChild) list.removeChild(list.firstChild); }
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) setText(node, text);
  return node;
}
function noPasskeyBrowser(errorEl) {
  if (canUsePasskeys) return false;
  setText(errorEl, COPY.noPasskeySupport);
  return true;
}

// ---- sign in ----
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
  try { await signOut(auth); } catch { /* the state listener resets the page either way */ }
});

// ---- sign in again (a step needs a sign-in from the last 5 minutes) ----
function needReauth(then) {
  afterReauth = then;
  const provider = reauthProvider(auth.currentUser);
  setText($("reauth-text"), provider ? COPY.signInAgain
    : `${COPY.signInAgain} This account signed in through the GeneFox app's Microsoft sign-in, so sign out and sign in again here.`);
  setText($("reauth-go"), provider ? `Sign in again with ${PROVIDER_NAMES[provider]}` : "Sign out");
  $("reauth-error").textContent = "";
  $("reauth").hidden = false;
  $("reauth-go").focus();
}
$("reauth-go").addEventListener("click", async () => {
  if (busy || !auth.currentUser) return;
  const provider = reauthProvider(auth.currentUser);
  if (!provider) { await signOut(auth).catch(() => {}); return; }
  setBusy(true, $("reauth-go"));
  try {
    await reauthenticateWithPopup(auth.currentUser, providerFor(provider));
    $("reauth").hidden = true;
    announce("Signed in again.");
    const then = afterReauth;
    afterReauth = null;
    if (then) then();
  } catch (err) {
    const code = String(err?.code ?? "");
    $("reauth-error").textContent = code === "auth/user-mismatch" ? COPY.wrongAccount : describeAuthError(err);
  } finally {
    setBusy(false, $("reauth-go"));
  }
});

/** Handles a refusal common to every step: a stale sign-in asks for a new one (then `retry`). */
function refused(err, errorEl, retry) {
  if (reasonOf(err) === "stale-sign-in") {
    errorEl.textContent = "";
    needReauth(retry);
    return true;
  }
  if (reasonOf(err) === "passkey-cooling-off") {
    showCooling(err?.details?.approvableAfterMs);
    return true;
  }
  errorEl.textContent = describeAccessError(err);
  return false;
}

// ---- the account's passkeys: banner, list, remove ----
async function refreshBanner() {
  try {
    const { data } = await api.list({});
    const banner = bannerFor({ passkeys: data?.passkeys ?? [], events: data?.events ?? [], nowMs: Number(data?.serverTimeMs) || Date.now() });
    $("banner").hidden = !banner;
    if (banner) setText($("banner-text"), banner.text);
    return data;
  } catch {
    $("banner").hidden = true;
    return null;
  }
}
$("banner-review").addEventListener("click", () => openPasskeys());
for (const button of document.querySelectorAll("[data-open-passkeys]")) button.addEventListener("click", () => openPasskeys());

let removing = null;  // {credentialId, challengeId, options} while a removal waits for its passkey

async function openPasskeys() {
  stopPolling();
  show("passkeys");
  $("passkeys-error").textContent = "";
  $("passkeys-ok").textContent = "";
  $("passkeys-title").focus();
  await loadPasskeys();
}

async function loadPasskeys() {
  const data = await refreshBanner();
  if (!data) {
    $("passkeys-error").textContent = "Your passkeys could not be read. Check your connection, then try again.";
    return;
  }
  renderPasskeys(data.passkeys ?? [], data.events ?? [], Number(data.serverTimeMs) || Date.now());
}

function renderPasskeys(passkeys, events, nowMs) {
  const list = $("passkey-list");
  clear(list);
  removing = null;
  $("passkey-empty").hidden = passkeys.length > 0;
  for (const passkey of passkeys) {
    const item = el("li");
    item.appendChild(el("p", "name", passkeyLabel(passkey.deviceLabel)));
    const used = Number.isFinite(passkey.lastUsedAtMs) ? `last used ${formatWhen(passkey.lastUsedAtMs)}` : "not used yet";
    item.appendChild(el("p", "meta", `Added ${formatWhen(passkey.createdAtMs)}, ${channelWords(passkey.channel)}; ${used}.`));
    if (coolingOff(passkey, nowMs)) {
      item.appendChild(el("p", "waiting", `Usable for approvals from ${formatWhen(passkey.approvableAfterMs)}.`));
    }
    const actions = el("div", "row-actions");
    const remove = el("button", "btn btn-quiet", "Remove");
    remove.type = "button";
    remove.addEventListener("click", () => askRemove(item, passkey, nowMs));
    actions.appendChild(remove);
    item.appendChild(actions);
    list.appendChild(item);
  }
  const eventList = $("event-list");
  clear(eventList);
  $("events-title").hidden = events.length === 0;
  for (const event of events) {
    const label = passkeyLabel(event.deviceLabel ?? "");
    const when = formatWhen(event.createdAtMs);
    const text = event.type === "passkeyAdded"
      ? `${when}: added ${event.deviceLabel ? `“${label}” ` : ""}(${channelWords(event.channel)}).`
      : `${when}: a passkey was removed${event.wasCoolingOff ? " during its waiting period" : ""}.`;
    eventList.appendChild(el("li", "", text));
  }
}

function askRemove(item, passkey, nowMs) {
  if (busy) return;
  $("passkeys-error").textContent = "";
  $("passkeys-ok").textContent = "";
  const actions = item.querySelector(".row-actions");
  clear(actions);
  const waiting = coolingOff(passkey, nowMs);
  const prompt = el("p", "meta", `Remove the passkey “${passkeyLabel(passkey.deviceLabel)}”? It stops approving anything new. `
    + "Approvals already made with it stay until they end or you withdraw them under Linked computers."
    + (waiting ? "" : " You'll confirm with one of your passkeys."));
  const yes = el("button", "btn", "Remove");
  const keep = el("button", "btn btn-quiet", "Keep");
  yes.type = "button"; keep.type = "button";
  keep.addEventListener("click", () => loadPasskeys());
  yes.addEventListener("click", () => removePasskey(passkey.credentialId, yes, keep, actions));
  actions.append(prompt, yes, keep);
  yes.focus();
}

async function removePasskey(credentialId, yes, keep, actions) {
  if (busy) return;
  $("passkeys-error").textContent = "";
  setBusy(true, yes, keep);
  try {
    const { data } = await api.remove({ credentialId });
    if (data?.status === "deleted") return removed();
    if (data?.status !== "needsPasskey" || !data.challengeId || !data.options) throw unexpected();
    // An active passkey goes only with a passkey (T23): the ceremony runs from the next press.
    removing = { credentialId, challengeId: data.challengeId, options: data.options };
    clear(actions);
    actions.appendChild(el("p", "meta", "Confirm with one of your passkeys to remove this one."));
    const go = el("button", "btn", "Confirm with passkey");
    go.type = "button";
    go.addEventListener("click", () => confirmRemoval(go));
    actions.appendChild(go);
    go.focus();
  } catch (err) {
    refused(err, $("passkeys-error"), () => loadPasskeys());
  } finally {
    setBusy(false, yes, keep);
  }
}

async function confirmRemoval(button) {
  if (busy || !removing) return;
  if (noPasskeyBrowser($("passkeys-error"))) return;
  const { credentialId, challengeId, options } = removing;
  setBusy(true, button);
  let credential;
  try {
    credential = await navigator.credentials.get({ publicKey: requestOptionsFromJSON(options) });
  } catch (err) {
    setBusy(false, button);
    $("passkeys-error").textContent = describeCeremonyError(err) || "The passkey step was cancelled. Nothing was removed.";
    return;
  }
  try {
    const { data } = await api.remove({ credentialId, assertion: { challengeId, response: credentialToJSON(credential) } });
    if (data?.status !== "deleted") throw unexpected();
    removed();
  } catch (err) {
    if (reasonOf(err) === "passkey-not-verified") $("passkeys-error").textContent = "Your passkey could not be verified, so nothing was removed. Try again.";
    else refused(err, $("passkeys-error"), () => loadPasskeys());
    await loadPasskeys();
  } finally {
    setBusy(false, button);
  }
}

function removed() {
  $("passkeys-error").textContent = "";
  setText($("passkeys-ok"), "Passkey removed from GeneFox. Also delete it from the device's password manager if you no longer need it; GeneFox cannot.");
  announce("Passkey removed.");
  loadPasskeys();
}

function unexpected() {
  return Object.assign(new Error("unexpected"), { code: "functions/internal", message: "unexpected" });
}

$("passkeys-add").addEventListener("click", () => startEnroll("passkeys", ""));

// ---- the code ----
function validateCode(final) {
  const input = $("code");
  const n = normalizeCode(input.value);
  if (input.value !== n.value) input.value = n.value;
  let message = n.error;
  if (!message && final && !n.complete) message = "Enter all 10 characters of the code, for example 3F9A0-B21C7.";
  $("code-error").textContent = message;
  input.setAttribute("aria-invalid", message ? "true" : "false");
  return n.complete && !n.error ? n.value : null;
}
$("code").addEventListener("input", () => validateCode(false));
$("code").addEventListener("blur", () => { if ($("code").value) validateCode(true); });

$("code-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  const userCode = validateCode(true);
  if (!userCode) { $("code").focus(); return; }
  if (!auth.currentUser) { show("signin"); return; }
  const submit = $("code-submit");
  setBusy(true, submit);
  setText(submit, "Checking…");
  try {
    const { data } = await api.decide({ userCode, action: "inspect" });
    await beginReview(userCode, data);
  } catch (err) {
    $("code-error").textContent = describeAccessError(err);
    $("code").setAttribute("aria-invalid", "true");
    $("code").focus();
  } finally {
    setBusy(false, submit);
    setText(submit, "Continue");
  }
});

// ---- review: the approved wording, the picker, Approve with passkey ----
async function beginReview(userCode, inspection) {
  const valid = inspection && typeof inspection.thumbprint === "string" && typeof inspection.host === "string"
    && Number.isFinite(inspection.expiresAtMs) && Number.isFinite(inspection.serverTimeMs);
  if (!valid) {
    $("code-error").textContent = "GeneFox returned an unexpected answer. Try again, or ask your AI assistant for a new code.";
    return;
  }
  const ids = [...(inspection.resourceIds ?? [])];
  const uid = auth.currentUser.uid;
  const titles = await readTitles({ ...firestoreReaders({ collection, getDocs, doc, getDoc }, firestore, uid), ids, nowMs: inspection.serverTimeMs });
  review = {
    userCode, inspection, model: reviewModel(inspection, titles), host: hostName(inspection.hostLabel),
    expiresAtMs: inspection.expiresAtMs, clockOffsetMs: inspection.serverTimeMs - Date.now(),
  };
  prepared = null;
  show("review");
  renderReview();
  $("review-error").textContent = "";
  clearInterval(reviewTimer);
  tick();
  reviewTimer = setInterval(tick, 1000);
  $("review-title").focus();
  prepareApproval();
}

function renderReview() {
  const { model, host } = review;
  const dataset = datasetName(model);
  setText($("review-title"), COPY.heading(host, dataset));
  setText($("review-body"), COPY.body(host, dataset));
  setText($("review-what"), COPY.whatThisIs(host));
  setText($("review-warn"), COPY.onlyApprove);
  setText($("cancel"), COPY.cancelButton);
  setText($("approve"), COPY.approveButton);
  setText($("review-notice"), model.notice);
  $("choose").hidden = !model.chooseInApp;
  $("named").hidden = model.chooseInApp || model.resources.length === 0;
  $("caps").hidden = model.capabilities.length === 0;
  if (model.chooseInApp) setText($("choose-heading"), COPY.chooseHeading);
  fillChoices(model.chooseInApp ? $("dataset-list") : $("named-list"), model.resources, "resource");
  fillChoices($("cap-list"), model.capabilities.map((c) => ({ ...c, title: c.name })), "capability");
  updateApprove();
}

function fillChoices(list, items, kind) {
  clear(list);
  for (const item of items) {
    const row = el("li", item.disabled ? "off" : "");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.id = `${kind}-${list.children.length}`;
    box.checked = item.checked;
    box.disabled = Boolean(item.disabled);
    box.addEventListener("change", () => {
      review.model = toggle(review.model, kind, item.id);
      renderReview();
      const again = document.getElementById(box.id);
      if (again) again.focus();
    });
    const label = el("label", "", item.title);
    label.htmlFor = box.id;
    if (item.note) label.appendChild(el("span", "note", item.note));
    row.append(box, label);
    list.appendChild(row);
  }
}

function remainingMs() {
  return review ? review.expiresAtMs - (Date.now() + review.clockOffsetMs) : 0;
}
function tick() {
  const ms = remainingMs();
  setText($("remaining"), formatRemaining(ms));
  if (ms <= 0) {
    clearInterval(reviewTimer);
    $("approve").disabled = true;
    setText($("review-error"), "This request has expired. Ask your AI assistant for a new code.");
  }
}

function updateApprove() {
  const ready = canApprove(review.model) && remainingMs() > 0 && !noPasskey;
  $("approve").disabled = busy || !ready;
}

/** Fetches the approval challenge ahead of the press, so the passkey sheet opens from the click. */
async function prepareApproval() {
  if (!review) return;
  const forReview = review;
  noPasskey = false;
  $("review-enroll").hidden = true;
  setText($("approve-hint"), "");
  try {
    const { data } = await api.approvalBegin({ userCode: review.userCode });
    if (review !== forReview) return;
    if (!data?.challengeId || !data?.options) throw unexpected();
    prepared = { challengeId: data.challengeId, options: data.options, expiresAtMs: data.expiresAtMs,
      clockOffsetMs: Number(data.serverTimeMs) - Date.now() };
    if (!busy) updateApprove();
  } catch (err) {
    if (review !== forReview) return;
    prepared = null;
    if (reasonOf(err) === "no-passkey") {
      noPasskey = true;
      setText($("approve-hint"), "This account has no passkey yet. Add one to approve.");
      $("review-enroll").hidden = false;
      updateApprove();
      return;
    }
    refused(err, $("review-error"), () => prepareApproval());
  }
}

function preparedIsFresh() {
  return prepared && prepared.expiresAtMs - (Date.now() + prepared.clockOffsetMs) > 20000;
}

$("approve").addEventListener("click", async () => {
  if (busy || !review || !canApprove(review.model)) return;
  if (noPasskeyBrowser($("review-error"))) return;
  if (remainingMs() <= 0) { tick(); return; }
  $("review-error").textContent = "";
  const approve = $("approve"), cancel = $("cancel");
  setBusy(true, approve, cancel);
  try {
    // Normally prepared ahead; if not (or stale), fetch now: most browsers still allow the sheet.
    if (!preparedIsFresh()) {
      const { data } = await api.approvalBegin({ userCode: review.userCode });
      prepared = { challengeId: data.challengeId, options: data.options, expiresAtMs: data.expiresAtMs,
        clockOffsetMs: Number(data.serverTimeMs) - Date.now() };
    }
    const challenge = prepared;
    prepared = null;
    let credential;
    try {
      credential = await navigator.credentials.get({ publicKey: requestOptionsFromJSON(challenge.options) });
    } catch (err) {
      setText($("review-error"), describeCeremonyError(err) || "The passkey step was cancelled. Nothing was approved.");
      prepareApproval();
      return;
    }
    const response = credentialToJSON(credential);
    const { resourceIds, capabilities } = chosenIds(review.model);
    const { data } = await api.decide({
      userCode: review.userCode, action: "approve", thumbprint: review.inspection.thumbprint, host: review.inspection.host,
      resourceIds, capabilities, credentialId: response.id, passkeyAssertion: { challengeId: challenge.challengeId, response },
    });
    if (data?.status !== "approved") throw unexpected();
    finish("approved");
  } catch (err) {
    if (!refused(err, $("review-error"), () => prepareApproval())) prepareApproval();
  } finally {
    busy = false;
    cancel.disabled = false; cancel.setAttribute("aria-busy", "false"); approve.setAttribute("aria-busy", "false");
    if (review) updateApprove();
  }
});

$("cancel").addEventListener("click", async () => {
  if (busy || !review) return;
  setBusy(true, $("approve"), $("cancel"));
  // Declining is best effort: whatever the server says, nothing was approved.
  try { await api.decide({ userCode: review.userCode, action: "decline" }); } catch { /* still not approved */ }
  busy = false;
  finish("declined");
});

$("review-add-passkey").addEventListener("click", () => startEnroll("review", "To approve, this account needs a passkey. Add one on this device."));

function finish(status) {
  const host = review?.host ?? COPY.unnamedHost, dataset = review ? datasetName(review.model) : "";
  clearInterval(reviewTimer);
  review = null; prepared = null; busy = false;
  const done = steps.done;
  done.classList.toggle("ok", status === "approved");
  done.classList.toggle("no", status !== "approved");
  if (status === "approved") {
    setText($("done-mark"), "Approved");
    setText($("done-title"), COPY.approved(host, dataset));
    setText($("done-body"), "Your computer picks this up on its own. You can withdraw it any time under Linked computers in the GeneFox app.");
  } else {
    setText($("done-mark"), "Not approved");
    setText($("done-title"), COPY.declined);
    setText($("done-body"), "Nothing was approved.");
  }
  setText($("done-next"), "You can close this page.");
  show("done");
  announce(status === "approved" ? "Approved." : "Not approved.");
  $("done-title").focus();
}

// ---- add a passkey ----
function startEnroll(returnTo, why) {
  stopPolling();
  enrollment = { returnTo };
  setText($("enroll-why"), why || "Add a passkey on this device to approve AI assistants' access. Your phone, a security key or this computer's password manager can hold it.");
  $("device-label").value = defaultDeviceLabel(navigator.userAgent);
  $("enroll-form").hidden = false;
  $("enroll-vouch").hidden = true;
  $("enroll-create").hidden = true;
  $("enroll-error").textContent = "";
  show("enroll");
  $("enroll-title").focus();
  noPasskeyBrowser($("enroll-error"));
}

$("enroll-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy || !enrollment) return;
  if (noPasskeyBrowser($("enroll-error"))) return;
  const deviceLabel = $("device-label").value.trim();
  if (!deviceLabel) { setText($("enroll-error"), "Give the passkey a name, such as the device it is on."); return; }
  $("enroll-error").textContent = "";
  const start = $("enroll-start");
  setBusy(true, start);
  try {
    const { data } = await api.enrollBegin({ deviceLabel });
    enrollment = { ...enrollment, deviceLabel, ticketId: data.ticketId, stepUp: data.stepUp };
    $("enroll-form").hidden = true;
    if (data.stepUp === "passkey") {
      enrollment.challengeId = data.challengeId;
      enrollment.assertionOptions = data.assertionOptions;
      $("enroll-vouch").hidden = false;
      $("vouch-go").focus();
    } else if (data.stepUp === "emailLink") {
      await sendEmail(data);
    } else {
      throw unexpected();
    }
  } catch (err) {
    refused(err, $("enroll-error"), () => {});
  } finally {
    setBusy(false, start);
  }
});

/** Case B: Firebase emails the account's own address a link to this page's confirm view. */
async function sendEmail(begun) {
  const { claims } = await auth.currentUser.getIdTokenResult();
  const url = useEmulator
    ? `${location.origin}${location.pathname}?emulator=1&confirm=${encodeURIComponent(begun.ticketId)}`
    : `${PAGE_URL}?confirm=${encodeURIComponent(begun.ticketId)}`;
  try {
    await sendSignInLinkToEmail(auth, String(claims.email ?? ""), { url, handleCodeInApp: true });
  } catch (err) {
    $("enroll-form").hidden = false;
    setText($("enroll-error"), describeAuthError(err) || "The email could not be sent. Try again.");
    return;
  }
  setText($("email-body"), `GeneFox sent a sign-in link to ${begun.emailHint}. Open it on any device and confirm there. `
    + "The link works for 15 minutes. This passkey can approve 24 hours after it is added: that wait is your chance to notice "
    + "if someone else added it.");
  $("email-wait").hidden = false;
  $("email-create").hidden = true;
  $("email-error").textContent = "";
  show("email");
  $("email-title").focus();
  poll();
}

function stopPolling() { clearTimeout(pollTimer); pollTimer = 0; }

/** Case B: waits for the link to be confirmed (a waiting poll needs no fresh sign-in). */
async function poll() {
  stopPolling();
  if (!enrollment?.ticketId || current !== "email") return;
  try {
    const { data } = await api.enrollConfirm({ ticketId: enrollment.ticketId });
    if (data?.status === "waiting") { pollTimer = setTimeout(poll, 3000); return; }
    if (!data?.challengeId || !data?.options) throw unexpected();
    enrollment.create = { challengeId: data.challengeId, options: data.options };
    $("email-wait").hidden = true;
    $("email-create").hidden = false;
    announce("The email link was confirmed. Create the passkey now.");
    $("email-create-go").focus();
  } catch (err) {
    $("email-wait").hidden = true;
    // Confirmed while the sign-in went stale: sign in again, then the next poll gets the challenge.
    refused(err, $("email-error"), () => { $("email-wait").hidden = false; poll(); });
  }
}

$("vouch-go").addEventListener("click", async () => {
  if (busy || !enrollment?.assertionOptions) return;
  const button = $("vouch-go");
  $("enroll-error").textContent = "";
  setBusy(true, button);
  let credential;
  try {
    credential = await navigator.credentials.get({ publicKey: requestOptionsFromJSON(enrollment.assertionOptions) });
  } catch (err) {
    setBusy(false, button);
    setText($("enroll-error"), describeCeremonyError(err) || "The passkey step was cancelled. Nothing was added.");
    return;
  }
  try {
    const { data } = await api.enrollConfirm({ ticketId: enrollment.ticketId,
      assertion: { challengeId: enrollment.challengeId, response: credentialToJSON(credential) } });
    if (!data?.challengeId || !data?.options) throw unexpected();
    enrollment.create = { challengeId: data.challengeId, options: data.options };
    $("enroll-vouch").hidden = true;
    setText($("enroll-create-text"), "Confirmed. Now create the new passkey on this device.");
    $("enroll-create").hidden = false;
    $("create-go").focus();
  } catch (err) {
    // A refused step-up spends the ticket: start again.
    $("enroll-vouch").hidden = true;
    $("enroll-form").hidden = false;
    refused(err, $("enroll-error"), () => {});
  } finally {
    setBusy(false, button);
  }
});

async function createPasskey(button, errorEl) {
  if (busy || !enrollment?.create) return;
  if (noPasskeyBrowser(errorEl)) return;
  errorEl.textContent = "";
  setBusy(true, button);
  let credential;
  try {
    credential = await navigator.credentials.create({ publicKey: creationOptionsFromJSON(enrollment.create.options) });
  } catch (err) {
    setBusy(false, button);
    setText(errorEl, describeCeremonyError(err) || "The passkey step was cancelled. Nothing was added.");
    return;
  }
  try {
    const { data } = await api.enrollFinish({ challengeId: enrollment.create.challengeId, credential: credentialToJSON(credential) });
    const passkey = data?.passkey;
    if (!passkey) throw unexpected();
    enrolled(passkey, Number(data.serverTimeMs) || Date.now());
  } catch (err) {
    refused(err, errorEl, () => {});
  } finally {
    setBusy(false, button);
  }
}
$("create-go").addEventListener("click", () => createPasskey($("create-go"), $("enroll-error")));
$("email-create-go").addEventListener("click", () => createPasskey($("email-create-go"), $("email-error")));

function enrolled(passkey, nowMs) {
  const returnTo = enrollment?.returnTo;
  enrollment = null;
  stopPolling();
  refreshBanner();
  if (coolingOff(passkey, nowMs)) {
    showCooling(passkey.approvableAfterMs, `Passkey “${passkeyLabel(passkey.deviceLabel)}” added.`);
    return;
  }
  announce("Passkey added.");
  if (returnTo === "review" && review) {
    show("review");
    setText($("review-error"), "");
    setText($("approve-hint"), "Passkey added. Approve with it now.");
    prepareApproval();
    updateApprove();
    return;
  }
  openPasskeys().then(() => setText($("passkeys-ok"), "Passkey added."));
}

function showCooling(approvableAfterMs, lead = "") {
  stopPolling();
  const when = Number.isFinite(approvableAfterMs) ? formatWhen(approvableAfterMs) : "24 hours after it was added";
  setText($("cooling-title"), lead || "Your passkey can't approve yet");
  setText($("cooling-body"), `A passkey added on the web by email link can approve from ${when}. Until then it can't approve, `
    + "and it can't vouch for another passkey. The wait is your chance to notice if someone else added it: if you didn't, remove it now.");
  show("cooling");
  $("cooling-title").focus();
}

for (const button of document.querySelectorAll("[data-back]")) {
  button.addEventListener("click", () => {
    stopPolling();
    enrollment = null;
    if (previous === "review" && review) { show("review"); prepareApproval(); updateApprove(); return; }
    show(auth.currentUser ? "code" : "signin");
  });
}

// ---- the email link's confirm view (any device, signed in or not) ----
async function openConfirm() {
  show("confirm");
  $("account").hidden = true;
  setText(document.querySelector(".doc-head h1"), "Add a passkey");
  setText(document.querySelector(".doc-head p:not(.eyebrow)"), "You opened a GeneFox sign-in link. Check what it would add before you confirm.");
  const link = address.confirm;
  if (link === "broken") {
    setText($("confirm-title"), "This email link is incomplete");
    setText($("confirm-error"), "Open the link from the email again, or start again on the page where you asked for it.");
    return;
  }
  try {
    const { data } = await api.emailConfirm({ action: "inspect", ticketId: link.ticketId, oobCode: link.oobCode });
    setText($("confirm-title"), `Confirm adding a passkey to ${String(data.email ?? "your GeneFox account")}?`);
    setText($("confirm-label"), passkeyLabel(data.deviceLabel));
    setText($("confirm-when"), formatWhen(data.requestedAtMs));
    setText($("confirm-from"), data.requestedFrom ? defaultDeviceLabel(data.requestedFrom) : "an unknown browser");
    $("confirm-facts").hidden = false;
    $("confirm-warn").hidden = false;
    $("confirm-actions").hidden = false;
    $("confirm-title").focus();
  } catch (err) {
    setText($("confirm-title"), "This email link can't be used");
    setText($("confirm-error"), describeAccessError(err));
  }
}

$("confirm-yes").addEventListener("click", async () => {
  if (busy || !address.confirm || address.confirm === "broken") return;
  const yes = $("confirm-yes"), no = $("confirm-no");
  setBusy(true, yes, no);
  try {
    const { data } = await api.emailConfirm({ action: "confirm", ticketId: address.confirm.ticketId, oobCode: address.confirm.oobCode });
    if (data?.status !== "confirmed") throw unexpected();
    $("confirm-actions").hidden = true;
    $("confirm-warn").hidden = true;
    setText($("confirm-ok"), "Confirmed. Go back to the page where you asked for the passkey: it will ask you to create it. You can close this page.");
    announce("Confirmed.");
  } catch (err) {
    $("confirm-actions").hidden = true;
    setText($("confirm-error"), describeAccessError(err));
  } finally {
    setBusy(false, yes, no);
  }
});
$("confirm-no").addEventListener("click", () => {
  $("confirm-actions").hidden = true;
  $("confirm-warn").hidden = true;
  setText($("confirm-ok"), "Nothing was added. If you didn't ask for this, someone may be signed in to your account: sign in to the GeneFox app, "
    + "check Account > Passkeys, and change your account's password or sign-in.");
});

// ---- start ----
if (!canUsePasskeys) setText($("no-passkeys-text"), COPY.noPasskeySupport);

if (address.confirm) {
  openConfirm();
} else {
  {
    const n = normalizeCode(address.code);
    if (address.code && !n.error) $("code").value = n.value;
  }
  onAuthStateChanged(auth, (user) => {
    stopPolling();
    clearInterval(reviewTimer);
    review = null; prepared = null; enrollment = null; afterReauth = null; noPasskey = false;
    $("banner").hidden = true;
    $("no-passkeys").hidden = !user || canUsePasskeys;
    if (!user) {
      $("account").hidden = true;
      show("signin");
      return;
    }
    setText($("account-name"), accountLabel(user));
    $("account").hidden = false;
    show("code");
    $("code-error").textContent = "";
    $("code").focus();
    refreshBanner();
  });
}
