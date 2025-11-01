#!/usr/bin/env bash
set -euo pipefail
API="http://localhost:3000/api"

echo "=== REPORT UNRETURNED ==="
curl -s "$API/reports/unreturned" | jq

echo "=== TOP FILMS ==="
curl -s "$API/reports/top-films?limit=10" | jq

echo "=== STAFF ==="
curl -s "$API/reports/staff-earnings" | jq

echo "=== CUSTOMER ==="
curl -s "$API/reports/customer/1/rentals" | jq
