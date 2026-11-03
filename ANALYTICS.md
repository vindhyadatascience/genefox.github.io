# Analytics setup

1. In the GA console, create a GA4 property and a **web data stream** for `https://genefox.app`.
2. Paste its measurement ID into `GA_MEASUREMENT_ID` in `assets/analytics.js` (one line). Until then analytics is inert.
3. Under Admin > Data settings > Data retention, set **Event data retention** to **2 months**. Turning off Google Signals is also recommended.
4. Optionally add the repository secret `GA4_API_SECRET` (Admin > Data streams > Measurement Protocol API secrets) and repository variable `GA4_MEASUREMENT_ID` for download-count events. The workflow works without them.
5. Optionally set the repository variable `CLI_RELEASE_REPO` if the CLI release repository changes.

| Event | Parameters | Where it fires |
| --- | --- | --- |
| `page_view` | automatic GA4 parameters | Automatically on each configured in-scope page |
| `store_redirect` | `platform`: `apple` or `android` | Redirects on `/apple/`, `/android/`, and matching devices on `/download/` |
| `cli_install_copy` | none | Elements with `data-copy-install` |
| `cli_download` | none | Elements with `data-ga-event="cli_download"` |
| `cli_download_count` | `release`, `asset`, `download_count` | Optional daily workflow Measurement Protocol submission |

`cli_download` and `cli_install_copy` do not fire until the site has those hooks. For redirect volume, register `platform` as an event-scoped custom dimension in Admin > Custom definitions, then use Explore > Blank exploration with dimension `event_name`, metric `event_count`, a filter for `store_redirect`, and a breakdown by `platform`. The `cli_download_count` events can also be explored by event name; the workflow's `stats` branch retains the daily asset counts.

The download-counts workflow reads the private `vindhyadatascience/locus` repository, which the default token cannot read. Make the CLI release assets readable from this repository's token scope, or change the source.
