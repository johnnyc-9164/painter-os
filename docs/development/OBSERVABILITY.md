# Local observability

`agent:dev` prints a run directory and loopback URL. It records Next stdout/stderr in server.log and startup timing in run.json. Logs and SQLite state are private synthetic artifacts; raw application errors can still contain synthetic names or bearer links. Review/redact before sharing, and never commit the run directory.

While the server is running:

```sh
npm run agent:observe -- .agent/runs/dev-REPLACE-WITH-ACTUAL-ID /api/snapshot
npm run agent:observe -- .agent/runs/dev-REPLACE-WITH-ACTUAL-ID /
```

The observer verifies an owned active run, permits only four anonymous read-only probe routes, rejects redirects, and writes requests.jsonl with route labels, random trace IDs, status and duration. It never records response bodies, cookies, headers or query/token values. Its output includes request count, 5xx count and p95 duration across those probes. Anonymous /api/snapshot returning 401 is expected.

Browser smoke records sanitized request timing spans, console exceptions and 5xx route labels beside screenshots/video. These are HTTP probe/browser spans, not internal Convex or distributed application traces. First-request compile cost in development is not production latency.

Use file reads/search and JSON parsing for local queries. Full LogQL/PromQL infrastructure, internal application spans, production telemetry and performance budgets are explicit [remaining gaps](HARNESS_AUDIT.md). No observability provider or background AI agent is installed. After stopping the owned app, delete only its reported run directory when evidence is no longer needed; do not delete another task's files.
