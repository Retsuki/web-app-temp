#!/usr/bin/env bash
set -euo pipefail

# Configuration for API env secret upload
PROJECT_EXPECTED="perfect-marketing-tool"
SECRET_NAME="api-env-production"
ENV_FILE="api/.env.production"

# Pre-flight checks
if ! command -v gcloud >/dev/null 2>&1; then
  echo "Error: gcloud CLI not found. Please install and login (gcloud init)." >&2
  exit 1
fi

PROJECT_ID=$(gcloud config get-value project 2>/dev/null | tr -d '\r')
if [[ -z "${PROJECT_ID}" || "${PROJECT_ID}" == "(unset)" ]]; then
  echo "Error: gcloud project is not set. Run: gcloud config set project ${PROJECT_EXPECTED}" >&2
  exit 1
fi

if [[ "${PROJECT_ID}" != "${PROJECT_EXPECTED}" ]]; then
  echo "Error: Current project '${PROJECT_ID}' is not '${PROJECT_EXPECTED}'. Aborting." >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Error: Env file not found: ${ENV_FILE}" >&2
  exit 1
fi

echo "Project: ${PROJECT_ID}"
echo "Secret:  ${SECRET_NAME}"
echo "Source:  ${ENV_FILE}"

# Ensure the secret exists
if ! gcloud secrets describe "${SECRET_NAME}" >/dev/null 2>&1; then
  echo "Creating secret '${SECRET_NAME}'..."
  gcloud secrets create "${SECRET_NAME}" --replication-policy="automatic"
fi

echo "Adding new secret version from ${ENV_FILE}..."
NEW_VERSION=$(gcloud secrets versions add "${SECRET_NAME}" \
  --data-file="${ENV_FILE}" \
  --format="value(name)" | awk -F'/' '{print $NF}')

echo "Disabling older secret versions..."
while read -r NAME STATE; do
  VID="${NAME##*/}"
  if [[ "${VID}" != "${NEW_VERSION}" ]]; then
    if [[ "${STATE}" != "DESTROYED" && "${STATE}" != "DISABLED" ]]; then
      gcloud secrets versions disable "${VID}" --secret="${SECRET_NAME}" || true
    fi
  fi
done < <(gcloud secrets versions list "${SECRET_NAME}" --format="value(name,state)")

echo "Done. '${SECRET_NAME}' updated to version ${NEW_VERSION}. Older versions disabled."

