# Building and releasing

Everything ships from one source. You edit `src/`, tag a version, and GitHub Actions
builds, tests and submits it to every store that has credentials configured.

```
src/main.js + src/manifest.json ──► npm run build ──► dist/chrome   ─► Chrome Web Store, Edge Add-ons, Opera
store/listing.json                                   dist/firefox  ─► addons.mozilla.org
package.json (version, store IDs)                    dist/safari   ─► Xcode project ─► Mac App Store
                                                     *.user.js     ─► GitHub Pages (userscript)
                                                     store/listings/*  (copy for each dashboard)
```

## Everyday work

```bash
npm ci
```

```bash
npm run start:chrome     # builds, then opens Chromium with the extension loaded
npm run start:firefox    # same, in Firefox
```

```bash
npm run lint             # build + Mozilla's add-on linter
npm run test:smoke       # loads the built extension against a fake YouTube page
```

`npm run build` also regenerates `userscript.js`, `return-youtube-subscribers.user.js` and
`store/listings/*`. Commit them; CI fails if they're out of date.

## Releasing a version

1. Add a `## x.y.z` section to `CHANGELOG.md`. It becomes the GitHub release notes, the
   Firefox version notes and the Edge certification notes.
2. Bump, tag and push:

   ```bash
   npm version 4.4.1
   ```

   ```bash
   git push --follow-tags
   ```

`npm version` updates `package.json`, rebuilds the generated files, commits and creates the
`v4.4.1` tag. Pushing the tag starts two workflows:

- **Release** (`.github/workflows/release.yml`): checks the tag matches `package.json`, lints,
  runs the smoke test, creates a GitHub release with every package attached, then submits to
  Chrome, Firefox and Edge in parallel.
- **Safari** (`.github/workflows/safari.yml`): converts, builds and uploads the macOS app to
  App Store Connect.

A store with no credentials is skipped with a warning, so you can connect stores one at a time.
To re-run one store without a new tag, run **Release** by hand from the Actions tab and list only
that store.

To make a store wait for a human, open **Settings → Environments** and add required reviewers to
`chrome-web-store`, `firefox-add-ons` or `edge-add-ons`. The workflow creates these
environments the first time it runs.

## One-time store setup

Add secrets in **Settings → Secrets and variables → Actions**, either repository-wide or on the
matching environment.

### Chrome Web Store

1. Follow the [chrome-webstore-upload-keys guide](https://github.com/fregante/chrome-webstore-upload-keys)
   to get an OAuth client ID, client secret and refresh token.
2. Copy your publisher ID from the Chrome Web Store developer dashboard's **Account** page.
3. Add secrets `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN` and `CWS_PUBLISHER_ID`.

The extension ID (`ojecnnfmjkfobkhghilomnfihgonkjdm`) is already in `package.json`.

### Firefox (AMO)

1. **Required:** put the add-on's ID in `package.json` → `extension.firefoxId`. Find it on the
   add-on's AMO Developer Hub page, or install the add-on from AMO and read **Extension ID** in
   `about:debugging#/runtime/this-firefox`. Manifest V3 needs it, and AMO rejects uploads whose
   ID doesn't match. Until it's set, local builds use a placeholder and the Firefox job refuses
   to publish.
2. Create API credentials at <https://addons.mozilla.org/developers/addon/api/key/>.
3. Add secrets `AMO_JWT_ISSUER` and `AMO_JWT_SECRET`.

The Firefox job also updates the AMO listing text (summary, description, homepage, support URL,
category) from `store/listings/amo-metadata.json`. Listed versions still go through Mozilla's
review; the job submits and doesn't wait.

### Microsoft Edge Add-ons

The site currently sends Edge users to the Chrome Web Store, which works. A native Edge
listing ranks in Edge's own store search, so it's worth adding:

1. Create the listing once in [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview)
   by uploading `dist/return-youtube-subscribers-<version>-chrome.zip`, using
   `store/listings/edge-add-ons.md` for the text.
2. Put its product ID in `package.json` → `extension.edgeProductId`.
3. In Partner Center → **Publish API**, create an API key and add secrets `EDGE_CLIENT_ID` and
   `EDGE_API_KEY`.

`scripts/publish-edge.sh` calls the Edge Add-ons API v1.1 directly, so the key never passes
through a third-party action.

### Opera Add-ons

Opera has no publishing API. Upload the Chrome zip from the GitHub release at
<https://addons.opera.com/developer/>. Opera and Opera GX users can also install from the
Chrome Web Store, which is what the site links to.

### Safari (Mac App Store)

Safari extensions must ship inside a native app, signed by Apple. The workflow does the
conversion and signing; you need an Apple account and one-time App Store Connect setup.

1. Join the [Apple Developer Program](https://developer.apple.com/programs/) (USD 99 a year).
2. In App Store Connect, create a **macOS** app with bundle ID
   `com.mgcounts.returnyoutubesubscribers`. To use a different ID, set the repository
   variable `SAFARI_BUNDLE_ID` and update `package.json` → `extension.safariBundleId`.
3. Create an App Store Connect API key with the **Admin** role (**Users and Access →
   Integrations**). Admin is needed for Xcode's cloud-managed signing, which means no
   certificates or provisioning profiles are stored in this repo.
4. Add secrets `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID` and `ASC_KEY_P8` (the full
   contents of the downloaded `.p8` file).
5. Push a tag, or run **Safari** by hand with **upload** ticked. The build appears in App Store
   Connect after processing.
6. Fill in the listing from `store/listings/safari-app-store.md`, add the screenshots, answer
   App Privacy as described there, and submit for review.

Every pull request that touches `src/` also builds an unsigned app, so a Safari-breaking change
is caught before release. You can download it from the workflow run.

To work on the Safari version locally on a Mac with Xcode installed:

```bash
npm run safari
```

The build is macOS-only: the script targets desktop youtube.com, and m.youtube.com on iOS uses
different markup. iOS is on the [feature list](../FEATURES.md).

## Store assets

All images come from two sources: `branding/logo.svg` (and `logo-small.svg` for 16 and 32px)
and `store/templates/scenes.html`. Re-render everything with:

```bash
npm run assets
```

This needs Playwright and the Inter font. The outputs are committed, so CI never renders them.

| File in `store/assets/` | Used for |
| --- | --- |
| `icon-128.png` | Chrome, Firefox and Opera store icon (96px artwork in a 128px canvas, as Chrome asks) |
| `logo-300.png` | Edge extension logo |
| `screenshot-1…7-*.png` (1280x800) | Screenshots on every store, same set and order everywhere. Captured from real YouTube with `npm run screenshots`, never drawn |
| `promo-small-440x280.png` | Chrome and Edge small promo tile |
| `promo-marquee-1400x560.png` | Chrome marquee and Edge large promo tile |
| `app-icon-1024.png`, `safari-appicon/` | Mac app icon (the workflow installs it into the Xcode project) |

Store text lives in `store/listing.json`. The build writes a ready-to-paste file per store into
`store/listings/` and fails if any field is over that store's character limit.

## Why it's set up this way

This is the simplest setup that keeps every store on the same version, with nothing copied by
hand:

- **One manifest, Manifest V3 everywhere.** Firefox, Safari, Chrome, Edge and Opera all
  support MV3 now. The build only adds or removes `browser_specific_settings`, so the
  Chrome and Firefox copies of the code can't drift apart again.
- **No framework or bundler.** The extension is one content script. Tools like WXT or Plasmo
  would add hundreds of dependencies and a build step that reviewers then ask you to explain.
  The script ships unminified, so AMO and Apple can review it as-is.
- **Generated, not duplicated.** The version number, description, userscript header and
  store copy all come from `package.json` and `store/listing.json`. CI fails if a generated
  file wasn't committed.
- **Reproducible packages.** Zips are written with fixed timestamps, so the same commit always
  produces byte-identical files. Anyone can rebuild and compare a release.
- **Tested before it ships.** Every push lints with Mozilla's official linter and runs the
  real extension against a fake YouTube page in Chromium, plus the userscript in Firefox and
  WebKit (Safari's engine). Releases run the same checks before submitting anywhere.
- **Official or minimal publishing tools.** `web-ext` is Mozilla's own tool,
  `chrome-webstore-upload-cli` is the most widely used Chrome uploader (pinned by the
  lockfile), Edge uses a 60-line script against Microsoft's API, and Safari uses Apple's own
  `xcodebuild`. An all-in-one third-party action would be fewer lines, but it would hold every
  store's credentials at once.
- **Each store fails alone.** Stores publish in separate jobs, so a Chrome review problem
  doesn't block Firefox, and each can be gated behind its own approval.

What still has to be done by hand: listing text and images on the Chrome, Edge and Opera
dashboards (their APIs only accept packages), Opera uploads, and pressing **Submit for Review**
in App Store Connect. Fastlane `deliver` could automate the App Store listing later, if it
becomes a chore.

If you start customising the native Safari app (settings screens, iOS), commit the generated
Xcode project instead of regenerating it on every build, and have the workflow copy `dist/safari`
into it.
