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

# Recent converters derive the app's bundle ID from its name and ignore --bundle-identifier,
# and set the project's minimum macOS to the build machine's. Pin both: the app keeps its
# App Store ID (the extension's must start with it) and runs where Safari supports MV3.
MIN_MACOS="12.0"
find "$OUT" -path '*.xcodeproj/*' \( -name project.pbxproj -o -name project.xcproj \) | while IFS= read -r proj; do
  perl -0pi -e '
    s/(PRODUCT_BUNDLE_IDENTIFIER"?\s*[=:]\s*"?)(?!\Q'"$BUNDLE_ID"'\E\.Extension)[\w.-]+("?)/$1'"$BUNDLE_ID"'$2/g;
    s/(MACOSX_DEPLOYMENT_TARGET"?\s*[=:]\s*"?)[\d.]+/${1}'"$MIN_MACOS"'/g;
  ' "$proj"
  echo "Bundle ID $BUNDLE_ID, minimum macOS $MIN_MACOS in $proj"
done

# The Mac App Store requires a category in the app's Info.plist (the listing's primary one).
APP_PLIST="$OUT/$APP_NAME/$APP_NAME/Info.plist"
plutil -remove LSApplicationCategoryType "$APP_PLIST" 2>/dev/null || true
plutil -insert LSApplicationCategoryType -string public.app-category.social-networking "$APP_PLIST"
# Only the system's own HTTPS: answers App Store Connect's export-compliance question for every build.
plutil -remove ITSAppUsesNonExemptEncryption "$APP_PLIST" 2>/dev/null || true
plutil -insert ITSAppUsesNonExemptEncryption -bool NO "$APP_PLIST"

# Replace the converter's generated app icon with the branded macOS icon set.
find "$OUT" -type d -name AppIcon.appiconset | while IFS= read -r set; do
  rm -f "$set"/*.png
  cp store/assets/safari-appicon/*.png store/assets/safari-appicon/Contents.json "$set"/
  echo "Replaced app icon in $set"
done

echo "Xcode project: $OUT/$APP_NAME/$APP_NAME.xcodeproj"
