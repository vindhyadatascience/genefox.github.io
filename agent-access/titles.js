// Dataset titles for /agent-access (RNABrowser-3caw; docs/WebPasskeys2026-10.md 3.1 step 4), read
// in the person's own tab under their own session, with the Firestore Lite SDK:
//   curated/grants/{uid}                 list: the account's grants (firestore.rules, isOwner)
//   curated/resources/{id}/descriptor    get: allowed only on a live grant; `displayName`
// The agent learns nothing from these reads. A title that can't be read falls back to the id.
// Titles reach the page through textContent only (setText below); nothing here builds HTML.
//
// The Firestore calls are injected (firestoreReaders), so this file runs under `node --test`.

export const TITLE_MAX = 120;

/** A grant is live with no expiry, or an expiry still ahead (functions curatedGrantRowIsLive). */
export function grantIsLive(data, nowMs) {
  if (!data || typeof data !== "object") return false;
  const expiresAtMs = data.expiresAtMs;
  if (expiresAtMs === undefined || expiresAtMs === null) return true;
  return typeof expiresAtMs === "number" && expiresAtMs > nowMs;
}

/** A descriptor's title as plain, single-line text, or the fallback. */
export function cleanTitle(raw, fallback) {
  let s = typeof raw === "string" ? raw : "";
  s = s.replace(/[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁠-⁯﻿]/g, " ").replace(/\s+/g, " ").trim();
  if (!s) return String(fallback);
  const chars = Array.from(s);
  return chars.length > TITLE_MAX ? chars.slice(0, TITLE_MAX - 1).join("") + "…" : s;
}

/** The readers over the Firestore Lite functions ({collection, getDocs, doc, getDoc}) and a db. */
export function firestoreReaders(fs, db, uid) {
  return {
    async listGrants() {
      const snapshot = await fs.getDocs(fs.collection(db, "curated", "grants", uid));
      return snapshot.docs.map((d) => ({ id: d.id, data: d.data() }));
    },
    async getDescriptor(id) {
      const snapshot = await fs.getDoc(fs.doc(db, "curated", "resources", id, "descriptor"));
      return snapshot.exists() ? snapshot.data() : undefined;
    },
  };
}

/**
 * The account's live grants with their titles, and a title for each extra id asked about.
 * Returns {held: [{id, title}] sorted by title, titles: Map(id -> title), grantsReadable}.
 * A descriptor read that fails (no live grant, offline) leaves the id as its own title; a grant
 * list that can't be read gives no held datasets and grantsReadable false.
 */
export async function readTitles({ listGrants, getDescriptor, ids = [], nowMs = Date.now() }) {
  let grants = [];
  let grantsReadable = true;
  try {
    grants = await listGrants();
  } catch {
    grantsReadable = false;
  }
  const live = grants.filter((g) => typeof g.id === "string" && grantIsLive(g.data, nowMs)).map((g) => g.id);
  const wanted = [...new Set([...live, ...ids.filter((id) => typeof id === "string")])];
  const titles = new Map();
  await Promise.all(wanted.map(async (id) => {
    let title = id;
    // A descriptor is readable only on a live grant; asking for any other would just be denied.
    if (live.includes(id)) {
      try { title = cleanTitle((await getDescriptor(id))?.displayName, id); } catch { title = id; }
    }
    titles.set(id, title);
  }));
  const held = live.map((id) => ({ id, title: titles.get(id) }))
    .sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
  return { held, titles, grantsReadable };
}

/** The only way a title reaches the page. */
export function setText(element, text) {
  element.textContent = String(text);
  return element;
}
