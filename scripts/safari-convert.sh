#!/bin/sh
# Turns dist/safari into an Xcode project with Apple's converter (macOS + Xcode only).
#   npm run safari            -> build/safari/Return YouTube Subscribers/*.xcodeproj
# Used locally and by .github/workflows/safari.yml.
set -eu

cd "$(dirname "$0")/.."
APP_NAME="Return YouTube Subscribers"
BUNDLE_ID="${SAFARI_BUNDLE_ID:-$(node -p 'require("./package.json").extension.safariBundleId')}"
OUT="build/safari"

if ! xcrun --find safari-web-extension-converter >/dev/null 2>&1; then
  echo "safari-web-extension-converter not found. Install Xcode (macOS only)." >&2
  exit 1
fi

rm -rf "$OUT"
xcrun safari-web-extension-converter dist/safari \
  --project-location "$OUT" \
  --app-name "$APP_NAME" \
  --bundle-identifier "$BUNDLE_ID" \
  --swift --macos-only --copy-resources --no-open --no-prompt --force

# Replace the converter's generated app icon with the branded macOS icon set.
find "$OUT" -type d -name AppIcon.appiconset | while IFS= read -r set; do
  rm -f "$set"/*.png
  cp store/assets/safari-appicon/*.png store/assets/safari-appicon/Contents.json "$set"/
  echo "Replaced app icon in $set"
done

echo "Xcode project: $OUT/$APP_NAME/$APP_NAME.xcodeproj"
