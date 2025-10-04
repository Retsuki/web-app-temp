#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   Optional env vars to override defaults below.
#   PROJECT_ID, REGION, SERVICE_NAME, API_NAME, GATEWAY_NAME, CONFIG_NAME,
#   OPENAPI_SPEC, SERVICE_ACCOUNT_EMAIL, BACKEND_URL

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT_DIR"

# Defaults for this repo
PROJECT_ID=${PROJECT_ID:-perfect-marketing-tool}
REGION=${REGION:-asia-northeast1}
SERVICE_NAME=${SERVICE_NAME:-web-app-api}
API_NAME=${API_NAME:-stripe-webhook-api}
GATEWAY_NAME=${GATEWAY_NAME:-stripe-webhook-gateway}
CONFIG_NAME=${CONFIG_NAME:-stripe-webhook-config-$(date +%Y%m%d%H%M%S)}
OPENAPI_SPEC=${OPENAPI_SPEC:-app-stripe-gateway/openapi2-run.yaml}
SERVICE_ACCOUNT_EMAIL=${SERVICE_ACCOUNT_EMAIL:-web-app-stripe-gw-sa@${PROJECT_ID}.iam.gserviceaccount.com}

if ! command -v gcloud >/dev/null 2>&1; then
  echo "[ERROR] gcloud CLI is required." >&2
  exit 1
fi

if [[ ! -f "$OPENAPI_SPEC" ]]; then
  echo "[ERROR] OpenAPI spec not found: $OPENAPI_SPEC" >&2
  exit 1
fi

if [[ -z "$PROJECT_ID" || -z "$SERVICE_NAME" ]]; then
  echo "[ERROR] PROJECT_ID and SERVICE_NAME are required." >&2
  exit 1
fi

echo "[INFO] Using project: $PROJECT_ID"
gcloud config set project "$PROJECT_ID" >/dev/null

# Optional: patch backend URL in OpenAPI
if [[ -n "${BACKEND_URL:-}" ]]; then
  echo "[INFO] Patching backend URL in $OPENAPI_SPEC -> $BACKEND_URL"
  # Replace address and jwt_audience lines
  sed -i.bak -E "s#^(\\s*address:)\\s.*#\\1 ${BACKEND_URL}#" "$OPENAPI_SPEC"
  sed -i.bak -E "s#^(\\s*jwt_audience:)\\s.*#\\1 ${BACKEND_URL}#" "$OPENAPI_SPEC"
fi

echo "[STEP] Ensure service account: $SERVICE_ACCOUNT_EMAIL"
if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${SERVICE_ACCOUNT_EMAIL%%@*}" \
    --display-name="Stripe Webhook Gateway SA" || true
fi

echo "[STEP] Grant Cloud Run invoker on $SERVICE_NAME in $REGION"
gcloud run services add-iam-policy-binding "$SERVICE_NAME" \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/run.invoker" \
  --region="$REGION" >/dev/null

echo "[STEP] Ensure API: $API_NAME"
if ! gcloud api-gateway apis describe "$API_NAME" >/dev/null 2>&1; then
  gcloud api-gateway apis create "$API_NAME" \
    --display-name="Stripe Webhook API" >/dev/null
fi

echo "[STEP] Create API config: $CONFIG_NAME"
gcloud api-gateway api-configs create "$CONFIG_NAME" \
  --api="$API_NAME" \
  --openapi-spec="$OPENAPI_SPEC" \
  --backend-auth-service-account="$SERVICE_ACCOUNT_EMAIL" \
  --display-name="$CONFIG_NAME" >/dev/null

echo "[STEP] Create or update gateway: $GATEWAY_NAME ($REGION)"
if gcloud api-gateway gateways describe "$GATEWAY_NAME" --location="$REGION" >/dev/null 2>&1; then
  gcloud api-gateway gateways update "$GATEWAY_NAME" \
    --api="$API_NAME" \
    --api-config="$CONFIG_NAME" \
    --location="$REGION" >/dev/null
else
  gcloud api-gateway gateways create "$GATEWAY_NAME" \
    --api="$API_NAME" \
    --api-config="$CONFIG_NAME" \
    --location="$REGION" \
    --display-name="$GATEWAY_NAME" >/dev/null
fi

HOST=$(gcloud api-gateway gateways describe "$GATEWAY_NAME" --location="$REGION" --format="value(defaultHostname)")

echo "[DONE] Gateway deployed: $GATEWAY_NAME"
echo "Gateway Host: https://${HOST}"
echo "Stripe Webhook URL: https://${HOST}/api/v1/stripe/webhook"
echo "Tip: Override backend with BACKEND_URL=https://<cloud-run-url> ..."
