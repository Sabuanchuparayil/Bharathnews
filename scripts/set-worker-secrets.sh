#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SECRETS_FILE="${ROOT}/workers/secrets.env"
WORKERS_DIR="${ROOT}/workers"

if [[ ! -f "$SECRETS_FILE" ]]; then
  echo "Missing ${SECRETS_FILE}"
  echo "Copy workers/secrets.env.example → workers/secrets.env and fill in values."
  exit 1
fi

# shellcheck disable=SC1090
source "$SECRETS_FILE"

cd "$WORKERS_DIR"

put_secret() {
  local name="$1"
  local value="$2"
  if [[ -z "${value}" ]]; then
    echo "Skipping ${name} (empty)"
    return
  fi
  echo "Setting ${name}..."
  printf '%s' "$value" | npx wrangler secret put "$name"
}

put_secret FIREBASE_PROJECT_ID "${FIREBASE_PROJECT_ID:-}"

if [[ -n "${FIREBASE_SERVICE_ACCOUNT_JSON:-}" && -f "${FIREBASE_SERVICE_ACCOUNT_JSON}" ]]; then
  FIREBASE_TOKEN="$(node "${ROOT}/scripts/generate-firebase-token.mjs" "${FIREBASE_SERVICE_ACCOUNT_JSON}")"
  put_secret FIREBASE_TOKEN "$FIREBASE_TOKEN"
elif [[ -n "${FIREBASE_TOKEN:-}" ]]; then
  put_secret FIREBASE_TOKEN "$FIREBASE_TOKEN"
else
  echo "Warning: set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_TOKEN in secrets.env"
fi

put_secret TELEGRAM_BOT_TOKEN "${TELEGRAM_BOT_TOKEN:-}"
put_secret TELEGRAM_CHANNEL "${TELEGRAM_CHANNEL:-@TheBharathNews}"
put_secret TELEGRAM_CHANNEL_ID "${TELEGRAM_CHANNEL_ID:-@TheBharathNews}"
put_secret ANTHROPIC_API_KEY "${ANTHROPIC_API_KEY:-}"
put_secret CLAUDE_MODEL "${CLAUDE_MODEL:-}"
put_secret RESEND_API_KEY "${RESEND_API_KEY:-}"
put_secret FACEBOOK_PAGE_TOKEN "${FACEBOOK_PAGE_TOKEN:-}"
put_secret FACEBOOK_PAGE_ID "${FACEBOOK_PAGE_ID:-}"
put_secret WORKER_API_SECRET "${WORKER_API_SECRET:-}"

echo ""
echo "Current secrets:"
npx wrangler secret list
