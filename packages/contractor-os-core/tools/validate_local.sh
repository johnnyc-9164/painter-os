#!/usr/bin/env bash
# Disposable local-only verification. Pass official convex-local-backend binary path.
set -euo pipefail
# Official CLI suppresses Sentry in CI mode. No diagnostic egress is authorized.
export CI=1
unset VERCEL
: "${CONVEX_LOCAL_BINARY:?Set CONVEX_LOCAL_BINARY to the official Convex backend binary}"
ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"
RUNTIME=$(mktemp -d /tmp/contractor-convex-test.XXXXXX)
mkdir -p evidence/v060
SECRET=$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')
"$CONVEX_LOCAL_BINARY" --interface 127.0.0.1 --port 3210 --site-proxy-port 3211 --instance-name contractor-validation --instance-secret "$SECRET" --local-storage "$RUNTIME/storage" --disable-beacon "$RUNTIME/db.sqlite3" > "$RUNTIME/backend.log" 2>&1 & PID=$!
cleanup(){ kill "$PID" 2>/dev/null || true; wait "$PID" 2>/dev/null || true; rm -rf "$RUNTIME"; }
trap cleanup EXIT
export CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
export CONVEX_SELF_HOSTED_ADMIN_KEY=$("$CONVEX_LOCAL_BINARY" keygen admin-key --instance-name contractor-validation --instance-secret "$SECRET")
export NO_PROXY=127.0.0.1,localhost
# Wait for local startup only, never contact a remote backend.
for i in $(seq 1 30); do if curl --silent --fail http://127.0.0.1:3210/version >/dev/null; then break; fi; sleep 1; done
npx convex dev --once --typecheck enable --typecheck-components
for dir in src/component src/trades/*/component; do npx convex codegen --component-dir "$dir" --typecheck enable; done
# Rebuild full host API after targeted component generation.
npx convex dev --once --typecheck enable --typecheck-components
npm run typecheck
for trade in contractorPainting contractorPlumbing contractorRoofing contractorGarageDoor contractorElectrical contractorHvac contractorConcrete contractorLandscaping contractorDrywallFraming; do
 npx convex run --component "$trade" records:create '{"tenantId":"synthetic-a","actorId":"test|synthetic","identifier":"smoke","requestKey":"smoke","properties":{}}'
 npx convex run --component "$trade" records:get '{"tenantId":"synthetic-a","identifier":"smoke"}'
done
if npx convex run --component contractorPainting records:create '{"tenantId":"synthetic-a","actorId":"test|synthetic","identifier":"mixed","requestKey":"mixed","properties":{"roof_type":"metal"}}' > "$RUNTIME/negative.log" 2>&1; then
 echo 'FAIL: mixed-trade properties accepted'; exit 1
else
 cat "$RUNTIME/negative.log"
 grep -q 'ArgumentValidationError' "$RUNTIME/negative.log"
 grep -q 'extra field `roof_type`' "$RUNTIME/negative.log"
 echo 'PASS: mixed-trade properties specifically rejected by validator'
fi
npx convex run --component contractorPainting --inline-query '({count:(await ctx.db.query("specs").withIndex("by_tenant",q=>q.eq("tenantId","synthetic-b")).take(1)).length})' > "$RUNTIME/tenant.json"
node -e 'const x=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));if(x.count!==0)throw Error("tenant leakage");console.log("PASS: foreign tenant has zero records")' "$RUNTIME/tenant.json"
