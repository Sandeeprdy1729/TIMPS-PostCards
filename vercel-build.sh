#!/bin/sh
set -e

BEEHIIV_PUB_ID="${BEEHIVE_ID}"
GOATCOUNTER_CODE="${GOATCOUNTER_CODE:-}"

if [ -z "$BEEHIVE_ID" ]; then
  # No Beehiiv ID: this is not an error. Preview builds for the orphan
  # "stats" branch carry no secrets, and failing here only produced a red
  # build every 10 minutes. Emit an inert config.js instead.
  echo "WARNING: BEEHIVE_ID not set; writing an inert config.js" >&2
fi

echo "window.BEEHIIV_PUB_ID = '${BEEHIIV_PUB_ID}'; window.GOATCOUNTER_CODE = '${GOATCOUNTER_CODE}';" > config.js
echo "Generated config.js (BEEHIIV_PUB_ID=${BEEHIIV_PUB_ID}, GOATCOUNTER_CODE=${GOATCOUNTER_CODE:-unset})"