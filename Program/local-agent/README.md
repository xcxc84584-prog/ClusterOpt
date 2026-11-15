# ClusterOpt PLA — v0.0.60 bootstrap

This is a **limited read-only** Windows loopback agent, not an interactive PowerShell terminal or a sandbox. It only supports the fixed actions `version` and `location`. No arbitrary command strings are accepted. Run only from a trusted checkout:

```cmd
cd Program\\local-agent
node server.mjs
```

Requires Node.js 20+ and Windows PowerShell. The token is printed in the local console. Do not paste it into public chats, URLs, or logs. The server listens only on 127.0.0.1:43881, requires a matching Origin, Bearer token, and POST, and offers /status, /execute, /revoke. A revoked agent must be restarted to pair again. Browser client and interactive terminal are **not yet wired**. Do not expose this port through a tunnel.

Tests: `npm test` (no external dependencies).
