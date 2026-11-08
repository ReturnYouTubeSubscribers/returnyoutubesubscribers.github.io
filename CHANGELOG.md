# Changelog

Release notes for each version. The release workflow copies the section for the
tagged version into the GitHub release and the Firefox Add-ons version notes.

## 4.4.0

- New logo and icons, redrawn for every size from 16px up.
- Firefox now uses Manifest V3, the same manifest as every other browser. Requires Firefox 140 or newer.
- One build now produces the Chrome, Edge, Opera, Firefox and Safari packages and the userscript, so every browser gets the same version at the same time.
- The userscript now updates itself automatically in Tampermonkey and Violentmonkey.
- Fixed a stray global variable leaking into YouTube's page from the userscript.

## 4.3

- Subscriber counts on watch pages no longer revert to the rounded number when YouTube re-renders the page.
