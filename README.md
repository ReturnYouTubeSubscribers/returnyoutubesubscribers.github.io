<p align="center"><img src="branding/logo.svg" width="96" height="96" alt=""></p>

# Return YouTube Subscribers

Brings back exact, unabbreviated subscriber counts on YouTube: on channel pages, under videos
and in search results. Channels in [NextCounts' Unabbreviated Project](https://nextcounts.com/unabbreviate/) show their real
count from YouTube Studio; every other channel shows a live estimate from [Mixerno.space](https://mixerno.space).

**[Website](https://ryts.mgcounts.com)** ·
[Chrome](https://chrome.google.com/webstore/detail/return-youtube-subscriber/ojecnnfmjkfobkhghilomnfihgonkjdm) ·
[Firefox](https://addons.mozilla.org/firefox/addon/return-youtube-subscribers/) ·
[Userscript](https://ryts.mgcounts.com/return-youtube-subscribers.user.js) ·
[Discord](https://discord.gg/RRwzccVWfD)

## Repository layout

| Path | What it is |
| --- | --- |
| `src/` | The extension: one content script and one Manifest V3 manifest for every browser |
| `scripts/build.mjs` | Builds the Chrome/Edge/Opera, Firefox and Safari packages, the userscript and the store copy |
| `store/listing.json` | Store name, description and links, the single source for every store |
| `store/listings/` | Generated, ready-to-paste copy for each store dashboard |
| `store/assets/` | Icons, screenshots and promo tiles, rendered from `store/templates/` and `branding/` |
| `.github/workflows/` | CI, store releases, and the Safari build |
| `index.html`, `privacy.html`, `assets/` | The website, served by GitHub Pages at ryts.mgcounts.com |

## Develop

```bash
npm ci
```

```bash
npm run start:chrome
```

Edit `src/main.js`, never `userscript.js` (that file is generated). Before opening a pull
request:

```bash
npm run lint
```

```bash
npm run test:smoke && npm run test:e2e
```

Releasing, store credentials and the Safari setup are in [docs/RELEASING.md](docs/RELEASING.md).
Ideas for what to build next are in [FEATURES.md](FEATURES.md).

Not affiliated with YouTube or Google.
