<!-- Generated from store/listing.json by scripts/build.mjs. Edit that file, not this one. -->
# Firefox Add-ons (AMO) listing

Version 4.4.1. Paste each field into the dashboard as-is.

Name, summary, description, homepage, support URL and category are pushed automatically by the release workflow (`store/listings/amo-metadata.json`). Upload images by hand.

## Name (26/50)

```text
Return YouTube Subscribers
```

## Summary (100/250)

```text
See exact subscriber counts on YouTube again: on channel pages, under videos, and in search results.
```

## Description (2074/15000)

```text
Since September 2019 YouTube has rounded every subscriber count: "1.2M subscribers" could mean anything from 1,200,000 to 1,299,999. Return YouTube Subscribers puts the full number back.

WHAT IT DOES
• Channel pages: "526M subscribers" becomes "526,594,749 subscribers"
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
• Choose exact (526,594,749) or compact (526.5M) numbers
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

social-communication

## Images

| Field | File |
| --- | --- |
| Icon (128x128) | `store/assets/icon-128.png` |
| Screenshots (1280x800) | `store/assets/screenshot-*.png` |

Screenshots, in order:

1. `store/assets/screenshot-1-channel.png`: Exact subscriber counts on every channel page
2. `store/assets/screenshot-2-search.png`: Exact counts in search results, sortable by subscribers
3. `store/assets/screenshot-3-race.png`: Race any two channels, live
4. `store/assets/screenshot-4-live.png`: On live streams the count refreshes every 10 seconds
5. `store/assets/screenshot-5-before-after.png`: 526M becomes 526,594,749
6. `store/assets/screenshot-6-watch.png`: The full number under every video
7. `store/assets/screenshot-7-popup.png`: See which channels you visit are growing fastest

## Notes to reviewer

```text
To test: open any YouTube channel page (for example https://www.youtube.com/@YouTube) or video. The rounded count under the channel name (e.g. "14.2M subscribers") is replaced with the full number: from https://api-v2.nextcounts.com/api/youtube/channel/<channelId> for channels in NextCounts' Unabbreviated Project (list: https://api.nextcounts.com/api/youtube/studio/channels), otherwise from https://backend.mixerno.space/api/youtube/estv3/<channelId>. No minification or bundling is used; the submitted main.js is the source.
```

## Links

- Homepage: https://ryts.mgcounts.com
- Support: https://github.com/returnyoutubesubscribers/returnyoutubesubscribers.github.io/issues
- Privacy policy: https://ryts.mgcounts.com/privacy.html
