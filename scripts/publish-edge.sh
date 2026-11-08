#!/usr/bin/env bash
# Uploads a package to Microsoft Edge Add-ons and submits it for certification,
# using the Edge Add-ons API v1.1 directly (no third-party action holds the key).
#   EDGE_PRODUCT_ID, EDGE_CLIENT_ID, EDGE_API_KEY  scripts/publish-edge.sh <zip> [notes-file]
# Docs: https://learn.microsoft.com/microsoft-edge/extensions/update/api/using-addons-api
set -euo pipefail

zip="$1"; notes_file="${2:-}"
api="https://api.addons.microsoftedge.microsoft.com/v1/products/${EDGE_PRODUCT_ID}"
auth=(-H "Authorization: ApiKey ${EDGE_API_KEY}" -H "X-ClientID: ${EDGE_CLIENT_ID}")

# Polls an operation URL until it leaves InProgress; fails on anything but Succeeded.
wait_for() {
  local url="$1" body status
  for _ in $(seq 1 60); do
    body=$(curl -fsS "${auth[@]}" "$url")
    status=$(printf '%s' "$body" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).status))')
    case "$status" in
      InProgress) sleep 10 ;;
      Succeeded) echo "$body"; return 0 ;;
      *) echo "Edge API operation failed: $body" >&2; return 1 ;;
    esac
  done
  echo "Timed out waiting for $url" >&2; return 1
}

location() { grep -i '^location:' | tail -1 | tr -d '\r' | awk '{print $2}'; }

echo "Uploading $zip"
op=$(curl -fsS -D - -o /dev/null "${auth[@]}" -H "Content-Type: application/zip" \
  --data-binary "@${zip}" "${api}/submissions/draft/package" | location)
wait_for "${api}/submissions/draft/package/operations/${op##*/}"

notes="Automated release from GitHub Actions."
[ -n "$notes_file" ] && notes=$(head -c 3000 "$notes_file")
payload=$(NOTES="$notes" node -e 'console.log(JSON.stringify({ notes: process.env.NOTES }))')

echo "Submitting for certification"
op=$(curl -fsS -D - -o /dev/null "${auth[@]}" -H "Content-Type: application/json" \
  --data "$payload" "${api}/submissions" | location)
wait_for "${api}/submissions/operations/${op##*/}"
echo "Submitted to Edge Add-ons."
