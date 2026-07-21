# Website email signup — backend setup (~5 minutes)

The home-page banner collects voluntary emails and appends them to a **Google
Sheet** via a **Google Apps Script Web App** — no database or server to run, and
the data lives in a Sheet you own and can export any time.

## Steps

1. **Create the Sheet.** New Google Sheet → note its ID from the URL:
   `https://docs.google.com/spreadsheets/d/`**`<THIS_IS_THE_ID>`**`/edit`.

2. **Add the script.** In that Sheet: **Extensions → Apps Script**. Delete the
   starter code, paste the contents of [`signup.gs`](./signup.gs), and set
   `SHEET_ID` at the top to the ID from step 1. Save.

3. **Deploy.** **Deploy → New deployment → gear icon → Web app**:
   - *Description:* `GeneFox signup`
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
   
   Click **Deploy**, authorize when prompted, and copy the **Web app URL**
   (ends in `/exec`).

4. **Verify.** Open that `/exec` URL in a browser — you should see
   `{"ok":true,"service":"genefox-signup"}`.

5. **Wire up the banner.** In `index.html`, find `SIGNUP_ENDPOINT = ""` (near the
   bottom, in the signup `<script>`) and paste your `/exec` URL between the quotes.
   Commit + push. The banner now appears and writes to your Sheet.

## Notes

- **Hidden until configured:** while `SIGNUP_ENDPOINT` is empty the banner never
  renders, so nothing broken ships.
- **Dedup + validation:** the script lowercases + validates the address, skips
  duplicates, and serializes writes with a lock. The banner also validates format
  and remembers dismissal/success in `localStorage` so it won't nag.
- **Updating the code later:** after editing `signup.gs` in Apps Script, use
  **Deploy → Manage deployments → (edit) → New version** so the `/exec` URL keeps
  working. (A brand-new deployment would mint a new URL.)
- **Spam:** fine for a beta. If bots start posting, add a hidden honeypot field or
  move to the Firestore + App Check backend (planned for the in-app signup) so the
  same protection covers both surfaces.
- **Privacy/compliance:** the banner copy states the email is only used for GeneFox
  updates and links to the Privacy Policy. If you launch broadly, add a one-line
  mention of voluntary email collection to the Privacy Policy and (for the app)
  Apple App Privacy + Play Data Safety.
