<!-- Generated from store/listing.json by scripts/build.mjs. Edit that file, not this one. -->
# Chrome Web Store listing

Version 4.4.0. Paste each field into the dashboard as-is.

## Name (26/75)

```text
Return YouTube Subscribers
```

## Summary (100/132)

```text
See exact subscriber counts on YouTube again: on channel pages, under videos, and in search results.
```

## Description (2074/16000)

```text
Since September 2019 YouTube has rounded every subscriber count: "1.2M subscribers" could mean anything from 1,200,000 to 1,299,999. Return YouTube Subscribers puts the full number back.

WHAT IT DOES
• Channel pages: "452M subscribers" becomes "452,318,906 subscribers"
• Watch pages: the exact count appears under the channel name on every video
• Search results: exact counts on channel results
• Real counts for creators in NextCounts' Unabbreviated Project, estimates for everyone else
• Keeps working as you browse; no page reloads needed
• Sort channel search results by exact subscriber count
• Exact counts on featured channels and channel lists
• Live streams: the count refreshes every 10 seconds, with rolling digits
• Full-screen live counter, and race mode to watch two channels side by side
• Save a shareable image of any count or race
• On your own channel: next milestone, subscribers to go and a projected date
• Toolbar popup ranking the channels you've viewed by how fast they're growing
• Choose exact (452,318,906) or compact (452.3M) numbers
• Hover any count to see where it came from and when it was updated

HOW IT WORKS
YouTube no longer publishes exact counts. The extension reads the ID of the channel you are viewing. If the channel is in NextCounts' Unabbreviated Project, you see its real count from YouTube Studio. Otherwise you see a live estimate from Mixerno.space, which can differ slightly from YouTube's internal figure. Hover a count to see which one it is.

PRIVACY
• No account, no sign-in, nothing to configure
• No analytics, ads or tracking inside the extension
• Growth history stays on your device
• The only data sent anywhere is the public ID of the channel you are viewing, to NextCounts or Mixerno.space, to look up its count
• Open source on GitHub

LINKS
Website: https://ryts.mgcounts.com
Source code: https://github.com/returnyoutubesubscribers/returnyoutubesubscribers.github.io
Discord: https://discord.gg/RRwzccVWfD

Return YouTube Subscribers is an independent project and is not affiliated with YouTube or Google.
```

## Category

Social & Communication

## Images

| Field | File |
| --- | --- |
| Store icon (128x128) | `store/assets/icon-128.png` |
| Small promo tile (440x280) | `store/assets/promo-small-440x280.png` |
| Marquee promo tile (1400x560) | `store/assets/promo-marquee-1400x560.png` |
| Screenshots (1280x800, Chrome takes 5: use 1 to 5) | `store/assets/screenshot-*.png` |

Screenshots, in order:

1. `store/assets/screenshot-1-channel.png`: Exact subscriber counts on every channel page
2. `store/assets/screenshot-2-search.png`: Exact counts in search results, sortable by subscribers
3. `store/assets/screenshot-3-race.png`: Race any two channels, live
4. `store/assets/screenshot-4-your-channel.png`: Your next milestone, with real Studio counts via NextCounts
5. `store/assets/screenshot-5-before-after.png`: 452M becomes 452,318,906
6. `store/assets/screenshot-6-watch.png`: The full number under every video
7. `store/assets/screenshot-7-privacy.png`: Lightweight, open source, no tracking

## Privacy practices tab

## Single purpose

```text
Show exact, unabbreviated subscriber counts on YouTube in place of YouTube's rounded counts.
```

## Host permission justification

```text
backend.mixerno.space returns the estimated subscriber count for a channel ID. NextCounts (api.nextcounts.com, api-v2.nextcounts.com) returns the real Studio count for channels that opted in, and is reached through its public CORS API without extra permissions. youtube.com access is needed to read the channel ID and replace the rounded count on the page.
```

Data usage: tick only **Web history (the ID of the YouTube channel currently being viewed)**, then tick all three certifications (not sold, not used for unrelated purposes, not used for creditworthiness).

Remote code: **No**.

## Links

- Homepage: https://ryts.mgcounts.com
- Support: https://github.com/returnyoutubesubscribers/returnyoutubesubscribers.github.io/issues
- Privacy policy: https://ryts.mgcounts.com/privacy.html
