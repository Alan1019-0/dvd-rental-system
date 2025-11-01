#!/usr/bin/env bash
set -euo pipefail
API="http://localhost:3000/api"

RID="${1:-1}"

curl -s -X POST "$API/rentals/$RID/return" -d '{}' | jq
