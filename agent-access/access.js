// The words and decisions of /agent-access (RNABrowser-3caw), with no DOM and no Firebase, so
// they run under `node --test`. agent-access.js renders them with textContent only.
//
// The approval heading, body, "what this approval is" and warning are the approved wording
// (bead RNABrowser-wgd2.3 notes, 2026-10-12), the same text as the apps' AgentApprovalCopy
// (FoxKit PasskeyFlows.swift). Change them only with a new approval, in both places.

import { describeCallError } from "../link/code.js";
import { cleanTitle } from "./titles.js";

export const COPY = {
  heading: (host, dataset) => `Let AI assistants on ${host} use ${dataset}?`,
  body: (host, dataset) => `This lets AI assistants and other programs on ${host} read ${dataset} through your account. `
    + "It lasts up to 30 days, ends sooner if unused for 7 days, and you can withdraw it any time under Linked computers.",
  whatThisIs: (host) => "What this approval is: your consent, a record of what you approved and when, and a time limit. "
    + `It is not a lock against the computer itself. A program that can act as you on ${host}, `
    + "for example one that can use your terminal or browser, can use whatever you approve here.",
  onlyApprove: "Only approve on a computer you control, and only data your licence lets you use with these tools.",
  approveButton: "Approve with passkey",
  cancelButton: "Cancel",
  unnamedHost: "an unnamed computer",
  chosenPlaceholder: "the datasets you choose below",
  chooseHeading: "Choose which of your licensed datasets to approve:",
  tooManyChosen: "One approval can name at most 64 datasets. Untick one to choose another.",
  noLicensedDatasets: "This account has no licensed datasets to approve. Nothing can be approved for this request.",
  datasetsUnavailable: "Your licensed datasets could not be read. Check your connection, then start again.",
  notAvailable: "Not available on this account",
  approved: (host, dataset) => `Approved. AI assistants on ${host} can now use ${dataset}.`,
  declined: "Not approved. The assistant was told no.",
  signInAgain: "For your security, sign in again. This step needs a sign-in from the last 5 minutes.",
  wrongAccount: "That signed in to a different account, so nothing changed. Sign in again with the account shown above.",
  noPasskeySupport: "This browser can't use passkeys. Open this page in a current version of Safari, Chrome, Edge or Firefox.",
};

/** The server's limit on resources in one approval (agent-approvals.ts MAX_RESOURCES). */
export const MAX_CHOSEN = 64;

/** PremiumCapability.displayName (FoxKit PremiumAccess.swift). */
export const CAPABILITY_NAMES = Object.freeze({
  reproducibilityPacks: "R Reproduction",
  ownDataAnalysis: "Analyze Your Own Data",
  projectNotebooks: "Project Notebooks",
  batchExplorer: "Batch Explorer",
  publicationStudio: "Publication Studio",
  advancedDataStudio: "Advanced Data Studio",
  datasetRadar: "Dataset Radar",
  projectCloudSync: "Project Cloud Sync",
  privateShareLinks: "Private Share Links",
  projectHistory: "Project History",
  labCollaboration: "Lab Collaboration",
});

export function capabilityName(raw) {
  return Object.prototype.hasOwnProperty.call(CAPABILITY_NAMES, raw) ? CAPABILITY_NAMES[raw] : cleanTitle(raw, "a GeneFox Pro feature");
}

/** "A", "A and B", "A, B and C". */
export function listWords(items) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function strings(value) {
  return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
}

/**
 * What the review shows, from decide's inspect answer and readTitles' result.
 * Named request: each requested id ticked, or "Not available on this account" (unticked,
 * disabled) without a live grant; the person may untick, never add. chooseInApp request: every
 * live licensed dataset, none ticked.
 */
export function reviewModel(inspection, titles) {
  const chooseInApp = inspection.chooseInApp === true;
  const heldIds = new Set(titles.held.map((h) => h.id));
  const resources = chooseInApp
    ? titles.held.map((h) => ({ id: h.id, title: h.title, checked: false, disabled: false, note: "" }))
    : strings(inspection.resourceIds).map((id) => heldIds.has(id)
      ? { id, title: titles.titles.get(id) ?? id, checked: true, disabled: false, note: "" }
      : { id, title: titles.titles.get(id) ?? id, checked: false, disabled: true, note: COPY.notAvailable });
  const capabilities = strings(inspection.capabilities).map((id) => ({ id, name: capabilityName(id), checked: true }));
  let notice = "";
  if (chooseInApp && resources.length === 0) notice = titles.grantsReadable ? COPY.noLicensedDatasets : COPY.datasetsUnavailable;
  return { chooseInApp, resources, capabilities, notice };
}

/** The model with one box toggled, or with a notice when that would pass MAX_CHOSEN. */
export function toggle(model, kind, id) {
  const list = kind === "capability" ? model.capabilities : model.resources;
  const target = list.find((item) => item.id === id);
  if (!target || target.disabled) return model;
  const ticked = model.resources.filter((r) => r.checked).length;
  if (kind === "resource" && !target.checked && ticked >= MAX_CHOSEN) return { ...model, notice: COPY.tooManyChosen };
  const flip = (item) => (item.id === id ? { ...item, checked: !item.checked } : item);
  const next = kind === "capability"
    ? { ...model, capabilities: model.capabilities.map(flip) }
    : { ...model, resources: model.resources.map(flip) };
  if (next.notice === COPY.tooManyChosen) next.notice = "";
  return next;
}

/** `{dataset}`: the ticked datasets' titles, then the ticked capabilities' names. */
export function datasetName(model) {
  const names = model.resources.filter((r) => r.checked).map((r) => r.title);
  if (model.chooseInApp && names.length === 0) return COPY.chosenPlaceholder;
  for (const c of model.capabilities) if (c.checked) names.push(c.name);
  return listWords(names) || "nothing";
}

/** Approve is offered only for something, and a chooseInApp request needs a ticked dataset. */
export function canApprove(model) {
  const resources = model.resources.filter((r) => r.checked).length;
  const capabilities = model.capabilities.filter((c) => c.checked).length;
  if (model.chooseInApp) return resources >= 1 && resources <= MAX_CHOSEN;
  return resources + capabilities > 0;
}

/** The ids the approve call sends. */
export function chosenIds(model) {
  return {
    resourceIds: model.resources.filter((r) => r.checked && !r.disabled).map((r) => r.id),
    capabilities: model.capabilities.filter((c) => c.checked).map((c) => c.id),
  };
}

/** `{host}`: the person's own name for the computer, else "an unnamed computer". */
export function hostName(hostLabel) {
  return cleanTitle(hostLabel, COPY.unnamedHost);
}

/** The server's refusal reason (HttpsError details.reason), or "". */
export function reasonOf(err) {
  const reason = err?.details?.reason;
  return typeof reason === "string" ? reason : "";
}

function codeOf(err) {
  return String(err?.code ?? "").replace(/^functions\//, "");
}

/** Plain words for a refusal from decide or a webPasskey callable. */
export function describeAccessError(err) {
  const reason = reasonOf(err), code = codeOf(err), message = String(err?.message ?? "");
  switch (reason) {
    case "stale-sign-in": return COPY.signInAgain;
    case "no-passkey": return "This account has no passkey yet. Add one to approve.";
    case "passkey-cooling-off": return "Your new passkey can't approve yet. See when it can, below.";
    case "email-unverified":
      return "Add your first passkey from the GeneFox app: this sign-in has no verified email address to confirm it with.";
    case "passkey-limit": return "This account already has the most passkeys it can hold. Remove one first.";
    case "ticket-unavailable":
    case "challenge-unavailable":
      return "That passkey request has expired or was already used. Start again.";
    case "passkey-not-verified": return "That passkey could not be verified. Start again.";
    case "passkey-required":
      return /remove/i.test(message)
        ? "Confirm with a passkey to remove this one."
        : "A passkey is needed to approve. Try again.";
    case "passkey-unavailable": return "That passkey is no longer on your account.";
    case "email-link-unavailable":
      return "That email link can't be used: it was already used, it expired, or it belongs to another account. Start again on the page where you asked for it.";
    case "origin": return "Open https://genefox.app/agent-access/ directly to do this.";
    default: break;
  }
  switch (code) {
    case "unauthenticated":
      return /sign in again/i.test(message) ? COPY.signInAgain : "Your sign-in has expired. Sign out, then sign in again.";
    case "resource-exhausted":
      return /today/i.test(message)
        ? "This account has started 3 new passkeys today, the most allowed. Try again tomorrow."
        : "Too many attempts in a short time. Wait one minute, then try again.";
    case "deadline-exceeded":
      return "This request has expired. Ask your AI assistant for a new code.";
    case "permission-denied":
      if (/helper session|command-line/i.test(message)) return describeCallError(err);
      if (/no live grant/i.test(message)) return "This account no longer holds one of those datasets. Untick it, then approve again.";
      if (/did not request/i.test(message)) return "That approval names something the request did not ask for. Start again.";
      return "That code was not recognized for this account. Check it against the code your AI assistant shows, or ask it for a new one.";
    case "failed-precondition":
      if (/already has a decision/i.test(message)) return "This request already has a decision. Ask your AI assistant for a new code if you need one.";
      if (/revoked|withdrawn/i.test(message)) return "That computer's link was withdrawn, so nothing can be approved for it.";
      return "GeneFox could not do that right now. Try again in a moment.";
    case "invalid-argument":
      if (/at least one dataset/i.test(message)) return "Choose at least one dataset to approve.";
      if (/format|user code/i.test(message)) return "Codes look like 3F9A0-B21C7. Check the code and try again.";
      return "GeneFox could not read that request. Start again.";
    case "already-exists": return "That passkey is already on your account.";
    default: return describeCallError(err);
  }
}

/** "12 Oct 2026, 14:05" in the person's locale (tests pass a locale and time zone). */
export function formatWhen(ms, locale = undefined, timeZone = undefined) {
  if (!Number.isFinite(ms)) return "an unknown time";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(ms));
}

export function passkeyLabel(raw) {
  return cleanTitle(raw, "Unnamed passkey");
}

/** Whether a listed passkey can approve yet (no approvableAfterMs means it always could). */
export function coolingOff(passkey, nowMs) {
  return typeof passkey?.approvableAfterMs === "number" && passkey.approvableAfterMs > nowMs;
}

export function channelWords(channel) {
  return channel === "web" ? "added on the web" : "added in the GeneFox app";
}

const BANNER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The banner (design 4.2): a passkey still cooling off, else one added in the last 7 days.
 * Returns {text, credentialId} or null. The server's list is the source; nothing is cached.
 */
export function bannerFor({ passkeys = [], events = [], nowMs, locale, timeZone }) {
  const waiting = passkeys.filter((p) => coolingOff(p, nowMs))
    .sort((a, b) => Number(b.createdAtMs ?? 0) - Number(a.createdAtMs ?? 0))[0];
  if (waiting) {
    return { credentialId: waiting.credentialId,
      text: `A passkey, “${passkeyLabel(waiting.deviceLabel)}”, was added to your account on ${formatWhen(waiting.createdAtMs, locale, timeZone)}. `
        + `It can approve from ${formatWhen(waiting.approvableAfterMs, locale, timeZone)}. If you didn't add it, remove it now.` };
  }
  const added = events.filter((e) => e?.type === "passkeyAdded" && typeof e.createdAtMs === "number" && e.createdAtMs >= nowMs - BANNER_WINDOW_MS)
    .sort((a, b) => b.createdAtMs - a.createdAtMs)[0];
  if (added) {
    const stillThere = passkeys.some((p) => p.credentialId === added.credentialId);
    return { credentialId: stillThere ? added.credentialId : null,
      text: `A passkey, “${passkeyLabel(added.deviceLabel)}”, was added to your account on ${formatWhen(added.createdAtMs, locale, timeZone)}`
        + ` (${channelWords(added.channel)}). If you didn't add it, remove it.` };
  }
  return null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OOB_CODE = /^[A-Za-z0-9_-]{10,512}$/;
/** What Firebase appends to an email link's continue URL, plus our own ?confirm=. */
export const EMAIL_LINK_PARAMS = ["confirm", "oobCode", "mode", "apiKey", "lang", "continueUrl", "tenantId"];

/**
 * The address bar's parameters, read once: a ?code= prefill, and the email-link confirm view.
 * Returns {code, confirm: {ticketId, oobCode} | "broken" | null, keep: URLSearchParams}, where
 * keep is what may stay in the address bar. An email-link parameter outside a confirm link is
 * ignored and stripped (design 3.1 step 1).
 */
export function readAddress(search) {
  const params = new URLSearchParams(search);
  const code = params.get("code") || "";
  let confirm = null;
  if (params.has("confirm")) {
    const ticketId = params.get("confirm") || "", oobCode = params.get("oobCode") || "";
    confirm = UUID.test(ticketId) && OOB_CODE.test(oobCode) && params.get("mode") === "signIn"
      ? { ticketId: ticketId.toLowerCase(), oobCode } : "broken";
  }
  const keep = new URLSearchParams(params);
  keep.delete("code");
  for (const key of EMAIL_LINK_PARAMS) keep.delete(key);
  return { code, confirm, keep };
}

/** "Chrome on Windows": a default passkey name the person can change. */
export function defaultDeviceLabel(userAgent) {
  const ua = String(userAgent ?? "");
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox"
    : /(Chrome|CriOS)\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android"
    : /CrOS/.test(ua) ? "ChromeOS" : /Windows/.test(ua) ? "Windows" : /Mac OS X|Macintosh/.test(ua) ? "Mac"
      : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}

/** The sign-in provider a popup re-authentication can use, or "" (a custom-token session can't). */
export function reauthProvider(user) {
  const ids = (user?.providerData ?? []).map((p) => p?.providerId);
  if (ids.includes("google.com")) return "google";
  if (ids.includes("apple.com")) return "apple";
  if (ids.includes("microsoft.com")) return "microsoft";
  return "";
}

export const PROVIDER_NAMES = Object.freeze({ google: "Google", apple: "Apple", microsoft: "Microsoft" });
