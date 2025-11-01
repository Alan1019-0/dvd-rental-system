#!/usr/bin/env bash
set -euo pipefail
API="http://localhost:3000/api"

RID="${1:-1}"

curl -s -X DELETE "$API/rentals/$RID" | jq
