# Feature ideas

Fifty ideas for where Return YouTube Subscribers could go next, grouped by theme. **★** marks
ones that are cheap to build and that most users would notice.

## Reliability and speed

1. ★ **Cache counts briefly.** Keep each channel's count for a few minutes so going back and
   forth between videos doesn't re-fetch.
2. ★ **One page observer instead of timers.** Replace the `setInterval` URL polling and
   `setTimeout` retries with YouTube's `yt-navigate-finish` event and a single `MutationObserver`.
   Less CPU, and faster on navigation.
3. ★ **Drop the synchronous page re-fetch.** Read the channel ID from the live page
   (`ytInitialData`, `<meta itemprop="identifier">` or the channel link) instead of a blocking
   XHR of the whole page.
4. **Fall back between selectors automatically.** Keep a list of selectors per page type and
   report which one matched, so a YouTube layout change degrades gracefully.
5. **Remote selector updates.** Ship selector lists as a small signed JSON file so a layout
   change can be fixed without waiting for store review (selectors only, never code).
6. **Fallback data source.** If Mixerno is down, try a second count provider and say which one
   answered.
7. **Error state.** If a lookup fails, keep YouTube's rounded number and add a small marker
   explaining why, instead of silently doing nothing.
8. **Batch search-page lookups.** Fetch all channels on a results page in one request where the
   API allows it.

## More places to show counts

9. ★ **Channel hovercards.** Exact count in the popup when hovering a channel name.
10. ★ **Subscriptions page and sidebar.** Exact counts next to each subscribed channel.
11. **Comment authors.** Optional exact subscriber count next to commenter names.
12. **Shorts.** Exact count on the Shorts player channel row.
13. **"About" panel.** Exact count in the channel's About dialog alongside join date and views.
14. **YouTube Studio.** Exact count on the creator's own dashboard.
15. **Embedded players.** Count on embedded videos elsewhere on the web (opt-in).
16. **YouTube Music artist pages.** Exact counts for artists.
17. **Mobile site (m.youtube.com).** Needed for Firefox for Android and Safari on iOS.

## Exact numbers beyond subscribers

18. ★ **Exact view counts.** Replace "1.2M views" on video cards with the full number.
19. **Exact like counts.** Show the full like number on the watch page.
20. **Exact channel totals.** Total channel views and video count, unabbreviated.
21. **Dislike estimate integration.** Optional pairing with Return YouTube Dislike data.

## Live and history

22. ★ **Live-updating counts.** Refresh the count every few seconds on a channel page, rolling
    digits like the homepage counter.
23. **Gain since last visit.** "+1,204 since you last looked" next to the count.
24. **Daily change.** "+3,410 today" pulled from the estimate history.
25. **Sparkline.** A small 30-day graph on hover.
26. **Milestone countdown.** "15,481 to go until 1.3M".
27. **Milestone celebration.** Confetti when you're watching a channel hit a round number.
28. **Projected date for next milestone.** Based on recent growth rate.

## Compare and track

29. **Watchlist.** Pin channels and see their live counts in the toolbar popup.
30. **Head-to-head.** Compare two channels' counts and gap, live.
31. **Badge count.** Toolbar badge showing a favourite channel's latest count.
32. **Notifications.** Alert when a tracked channel passes a milestone.
33. **Export.** Download tracked channels' history as CSV.
34. **Open in Mixerno / MGCounts.** One click from any channel to its full live-count page.

## Settings and display

35. ★ **Toolbar popup with an on/off switch.** Including per-page-type toggles.
36. ★ **Number format follows the browser's locale.** 1.284.519 in Germany, 12,84,519 in India.
37. **Choose the format.** Exact, exact with rounded in brackets, or rounded with exact on hover.
38. **Highlight exact counts.** Optional subtle underline so users can tell which numbers are
    estimates.
39. **Hide counts entirely.** For people who want a calmer YouTube, the opposite mode.
40. **Keyboard shortcut.** Toggle between exact and rounded.
41. **Translations.** Localise the extension UI and store listings (`_locales`), starting with
    Spanish, Portuguese, Hindi, German and Japanese.

## Platforms and distribution

42. ★ **Safari for iOS and iPadOS.** Add an iOS target once m.youtube.com is supported.
43. **Firefox for Android.** Mark the add-on Android-compatible once mobile pages work.
44. **Native Edge listing.** Publish to Edge Add-ons for better visibility in Edge's store
    (the workflow already supports it).
45. **Kiwi and Orion.** Test and document support for these mobile and WebKit browsers.

## Project and community

46. ★ **Automated selector health check.** A scheduled workflow that loads real YouTube pages
    and opens an issue when a selector stops matching.
47. **Bug report button.** A popup button that opens a pre-filled GitHub issue with the page
    type and extension version.
48. **Public status page.** Show whether the count API is up, linked from the error state.
49. **Contributor guide.** How to add a new page type, with the smoke test as a template.
50. **Changelog notice.** After an update, a one-time "what's new" link in the popup.
