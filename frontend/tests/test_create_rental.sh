#!/usr/bin/env bash
set -euo pipefail
API="http://localhost:3000/api"

CID="${1:-1}"
SID="${2:-1}"

INV=$(curl -s "$API/films/available/list" | jq -r '.[0].inventory_id')

curl -s -X POST "$API/rentals" \
    -H "Content-Type: application/json" \
    -d "{\"customer_id\":$CID,\"inventory_id\":$INV,\"staff_id\":$SID}" | jq
