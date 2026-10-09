# Shared platform presentation and reads

Canonical owner for platform presentation, strict browser DTO decoding, bounded private HTTP reads and the existing session-bridge read service. Both admin apps consume these modules; app-private implementations are never imported here. Backend query authorization remains authoritative. This package has no tenant writer, provisioning, provider or bootstrap action.

Legacy web shims preserve their URLs. The separate platform app passes explicit optional contractor navigation; links do not transfer credentials or establish permission. Styles include their own source directives so extracted controls remain visible to the Tailwind build.
