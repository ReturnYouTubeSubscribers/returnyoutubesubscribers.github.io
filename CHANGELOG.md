# Changelog

Release notes for each version. The release workflow copies the section for the
tagged version into the GitHub release and the Firefox Add-ons version notes.

## 4.4.0

- Real subscriber counts for channels in NextCounts' Unabbreviated Project, which share their count straight from YouTube Studio. Every other channel still shows Mixerno.space's estimate, and so does any channel if NextCounts is unavailable.
- Creators not yet in the project see a "Show your exact count" link on their own channel.
- Sort channel search results by exact subscriber count.
- Exact counts on featured channels and other channel lists.
- Live streams refresh the count every 10 seconds, and digits roll when a count changes.
- New full-screen live counter with race mode (two channels and the gap between them) and a "Save image" button for sharing.
- On your own channel: next milestone, subscribers to go, recent daily growth and a projected milestone date.
- New toolbar popup: channels you've viewed ranked by growth, a race picker, and a choice of exact or compact (452.3M) numbers.
- Hover any count to see that it's an estimate, where it came from and when it was updated.
- Everything the extension adds follows YouTube's light, dark and ambient themes.
- New logo and icons, redrawn for every size from 16px up.
- Firefox now uses Manifest V3, the same manifest as every other browser. Requires Firefox 140 or newer.
- One build now produces the Chrome, Edge, Opera, Firefox and Safari packages and the userscript, so every browser gets the same version at the same time.
- The userscript now updates itself automatically in Tampermonkey and Violentmonkey.
- Fixed a stray global variable leaking into YouTube's page from the userscript.

## 4.3

- Subscriber counts on watch pages no longer revert to the rounded number when YouTube re-renders the page.
