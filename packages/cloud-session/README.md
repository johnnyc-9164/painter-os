# Cloud session bridge

The existing lazy Better Auth Next.js bridge is shared here without a second user store or identity authority. The platform compatibility adapter accepts login/logout only, validates origin and bounded bodies, and preserves trusted cookies. Its restricted raw session proxy delegates the existing protocol to Better Auth. Backend trusted origins and grant checks remain unchanged.

A new application host requires separately verified origin/cookie/callback configuration. This package neither bootstraps operators nor enables signup, tenant provisioning or providers in the platform app.
