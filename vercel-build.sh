#!/bin/sh
set -e

BEEHIIV_PUB_ID="${BEEHIVE_ID}"
GOATCOUNTER_CODE="${GOATCOUNTER_CODE:-}"

if [ -z "$BEEHIVE_ID" ]; then
  echo "ERROR: BEEHIVE_ID env var not set" >&2
  exit 1
fi

echo "window.BEEHIIV_PUB_ID = '${BEEHIIV_PUB_ID}'; window.GOATCOUNTER_CODE = '${GOATCOUNTER_CODE}';" > config.js
echo "Generated config.js (BEEHIIV_PUB_ID=${BEEHIIV_PUB_ID}, GOATCOUNTER_CODE=${GOATCOUNTER_CODE:-unset})"