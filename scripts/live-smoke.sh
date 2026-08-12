#!/usr/bin/env bash
# Brilla Prep — live production smoke matrix (read-only / non-mutating)
# Usage: bash scripts/live-smoke.sh
export MSYS_NO_PATHCONV=1
API="https://brilla-api.ghwmelite.workers.dev/api"
pass=0; fail=0
declare -a failures

check() { # name expected_status actual_status body
  local name="$1" want="$2" got="$3" body="$4"
  local ct_json=1
  echo "$body" | head -c 1 | grep -q '[{\[]' || ct_json=0
  if [[ "$got" == "$want" && $ct_json == 1 ]]; then
    pass=$((pass+1)); printf '  ✓ %-58s %s\n' "$name" "$got"
  else
    fail=$((fail+1)); failures+=("$name -> got $got (want $want), json=$ct_json")
    printf '  ✗ %-58s %s (want %s, json=%s)\n' "$name" "$got" "$want" "$ct_json"
  fi
}

req() { # method path [token] [data]
  local method="$1" path="$2" token="${3:-}" data="${4:-}"
  local args=(-s -w $'\n%{http_code}' -X "$method" -H 'Content-Type: application/json')
  [[ -n "$token" ]] && args+=(-H "Authorization: Bearer $token")
  [[ -n "$data" ]] && args+=(-d "$data")
  curl "${args[@]}" "$API$path"
}

echo "== 1. Public catalog & gamification endpoints =="
for ep in \
  "/health" \
  "/exam-types" \
  "/subjects" \
  "/topics" \
  "/questions" \
  "/papers" \
  "/papers/years" \
  "/riddles" \
  "/achievements" \
  "/leaderboard" \
  "/race/cycles" \
  "/houses" \
  "/houses/standings" \
  "/battles/available" \
  "/flashcards/public" \
  "/subscriptions/plans" \
  "/payments/plans" \
  "/affiliates/leaderboard" \
  "/affiliates/leaderboard/schools" \
  "/tutoring/directory" \
  "/exam-boards" \
  "/exam-boards/specifications" \
; do
  out=$(req GET "$ep"); code=$(echo "$out" | tail -1); body=$(echo "$out" | head -n -1)
  check "GET $ep" "200" "$code" "$body"
done

echo
echo "== 2. Auth wall: no token -> 401 JSON on protected routes (all roles) =="
for ep in \
  "/progress" \
  "/subscriptions/status" \
  "/subscriptions/trial/status" \
  "/notifications/xp" \
  "/notifications/telegram/status" \
  "/engagement/status" \
  "/streak/info" \
  "/quests/daily" \
  "/race/current" \
  "/affiliates/profile" \
  "/parents/students" \
  "/parents/notifications" \
  "/teacher/dashboard" \
  "/classes" \
  "/assessments" \
  "/grading" \
  "/tutoring/teacher/earnings" \
  "/teacher-bonuses/my-status" \
  "/admin/users" \
  "/admin/users/pending" \
  "/admin/schools" \
  "/admin/dashboard/stats" \
  "/admin/analytics" \
  "/admin/audit/logs" \
  "/admin/system/health" \
  "/auth/oauth/providers" \
; do
  out=$(req GET "$ep"); code=$(echo "$out" | tail -1); body=$(echo "$out" | head -n -1)
  check "GET $ep (no token)" "401" "$code" "$body"
done

echo
echo "== 3. Malformed token -> 401 (JWT verification live) =="
out=$(req GET "/progress" "not.a.token"); code=$(echo "$out" | tail -1); body=$(echo "$out" | head -n -1)
check "GET /progress (garbage token)" "401" "$code" "$body"
out=$(req GET "/admin/users" "garbage"); code=$(echo "$out" | tail -1); body=$(echo "$out" | head -n -1)
check "GET /admin/users (garbage token)" "401" "$code" "$body"

echo
echo "== 4. Auth entry points behave sanely =="
# Turnstile is enforced in prod: a tokenless login attempt must be rejected
# with 400 ("Security verification required") BEFORE any credential check.
out=$(req POST "/auth/login" "" '{"email":"no-such-user-zz@example.com","password":"WrongPass123!"}')
code=$(echo "$out" | tail -1); body=$(echo "$out" | head -n -1)
check "POST /auth/login (no Turnstile token)" "400" "$code" "$body"

out=$(req POST "/auth/register" "" '{"email":"smoke-probe@example.com","password":"x","name":"x"}')
code=$(echo "$out" | tail -1); body=$(echo "$out" | head -n -1)
# Weak password must be rejected (400) before any insert; also reveals Turnstile/invite gating
check "POST /auth/register (weak password probe)" "400" "$code" "$body"
echo "    register probe said: $(echo "$body" | head -c 160)"

echo
echo "== 5. Webhook hardening =="
out=$(req POST "/telegram/webhook" "" '{}'); code=$(echo "$out" | tail -1); body=$(echo "$out" | head -n -1)
check "POST /telegram/webhook (no secret)" "401" "$code" "$body"
out=$(req POST "/payments/webhook" "" '{}'); code=$(echo "$out" | tail -1); body=$(echo "$out" | head -n -1)
if [[ "$code" == "400" || "$code" == "401" ]]; then
  pass=$((pass+1)); printf '  ✓ %-58s %s\n' "POST /payments/webhook (unsigned)" "$code"
else
  fail=$((fail+1)); failures+=("payments/webhook unsigned -> $code"); printf '  ✗ %-58s %s (want 400/401)\n' "POST /payments/webhook (unsigned)" "$code"
fi

echo
echo "==================================================="
echo "RESULT: $pass passed, $fail failed"
if [[ $fail -gt 0 ]]; then
  printf '%s\n' "${failures[@]}"
  exit 1
fi
