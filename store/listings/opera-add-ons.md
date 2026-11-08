<!-- Generated from store/listing.json by scripts/build.mjs. Edit that file, not this one. -->
# Opera Add-ons listing

Version 4.4.0. Paste each field into the dashboard as-is.

Upload `dist/return-youtube-subscribers-<version>-chrome.zip`. Opera has no publishing API, so updates are manual.

## Name

```text
Return YouTube Subscribers
```

## Summary

```text
See exact subscriber counts on YouTube again: on channel pages, under videos, and in search results.
```

## Description

```text
Since September 2019 YouTube has rounded every subscriber count: "1.2M subscribers" could mean anything from 1,200,000 to 1,299,999. Return YouTube Subscribers puts the full number back.

WHAT IT DOES
• Channel pages: "452M subscribers" becomes "452,318,906 subscribers"
• Watch pages: the exact count appears under the channel name on every video
• Search results: exact counts on channel results
• Keeps working as you browse; no page reloads needed

HOW IT WORKS
YouTube no longer publishes exact counts. The extension reads the ID of the channel you are viewing, asks the Mixerno.space API for its estimated count, and shows that in place of the rounded number. Counts are estimates and can differ slightly from YouTube's internal figure.

PRIVACY
• No account, no sign-in, nothing to configure
• No analytics, ads or tracking inside the extension
• The only data sent anywhere is the public ID of the channel you are viewing, to backend.mixerno.space, to look up its count
• Open source on GitHub

LINKS
Website: https://ryts.mgcounts.com
Source code: https://github.com/returnyoutubesubscribers/returnyoutubesubscribers.github.io
Discord: https://discord.gg/RRwzccVWfD

Return YouTube Subscribers is an independent project and is not affiliated with YouTube or Google.
```

## Category

Social

## Images

| Field | File |
| --- | --- |
| Icon (128x128) | `store/assets/icon-128.png` |
| Screenshots (1280x800) | `store/assets/screenshot-*.png` |

Screenshots, in order:

1. `store/assets/screenshot-1-channel.png`: Exact subscriber counts on every channel page
2. `store/assets/screenshot-2-watch.png`: The full number under every video
3. `store/assets/screenshot-3-search.png`: Exact counts in search results
4. `store/assets/screenshot-4-before-after.png`: 452M becomes 452,318,906
5. `store/assets/screenshot-5-privacy.png`: Lightweight, open source, no tracking

## Links

- Homepage: https://ryts.mgcounts.com
- Support: https://github.com/returnyoutubesubscribers/returnyoutubesubscribers.github.io/issues
- Privacy policy: https://ryts.mgcounts.com/privacy.html
