# Backend URL Proxying

How AudiScope hides backend URLs from the browser, which backends are (and aren't)
hidden, and how to extend the pattern.

## The pattern: `/api/core/*` rewrite

The Core API backend URL is kept out of the client bundle via a **Next.js rewrite**
in `next.config.mjs`:

```js
async rewrites() {
  return [
    {
      source: '/api/core/:path*',
      destination: process.env.CORE_API_URL + '/:path*'
    }
  ]
}
```

The key is that `CORE_API_URL` has **no `NEXT_PUBLIC_` prefix**, so it is a
server-only env var and is never inlined into the browser bundle. The real backend
host (e.g. the dev ALB `http://core-api-dev-alb-...elb.amazonaws.com/api`) is
resolved server-side by Next.js. The browser only ever makes same-origin requests
to `/api/core/...`.

`CORE_API_URL` is defined in `.env.dev-cloud` and `.env.development`.

### Services that use the proxy

Each calls a relative `/api/core/...` path and carries the comment
`// Use Next.js proxy path - all requests go through /api/core which rewrites to backend`:

- `lib/product.service.ts` → `/api/core/v1/products`
- `lib/learning.service.ts` → `/api/core/v1/learning`
- `lib/chat.service.ts` → `/api/core/v1/chat`
- `lib/content-generation.service.ts` → `/api/core/v1/content`
- `lib/knowlege-base.service.ts` → `/api/core/v1/knowledge-base`
- `lib/product-files.service.ts` → `/api/core` (base)

There are **no route-handler proxies** (`app/api/**/route.ts` contains only a Sentry
test stub). Proxying is done entirely at the config level via the rewrite.

## Backends NOT proxied (URL exposed to the client)

These ship the real backend URL to the browser because they use `NEXT_PUBLIC_*`
env vars:

| Env var | Used in | Proxyable? |
| --- | --- | --- |
| `NEXT_PUBLIC_API_GATEWAY_URL` | `lib/audio-pipeline-api.service.ts` | **Yes** — clean candidate to move behind a rewrite. No stated reason for exposure. |
| `NEXT_PUBLIC_AGENT_API_URL` | `lib/agent.service.ts` (`${AGENT_API_URL}/api/agent`) | Technically yes for HTTP, but shares a host with the WS endpoint below. |
| `NEXT_PUBLIC_AGENT_WS_URL` | `lib/agent/agent-connection.ts` | **No** — Next.js rewrites cannot proxy WebSockets. Deliberate; see `chat-interface-architecture.md`. |

Other exposed `NEXT_PUBLIC_*` URLs (not core backends): `NEXT_PUBLIC_KEYCLOAK_URL`,
`NEXT_PUBLIC_SIMULATION_WS_URL`, `NEXT_PUBLIC_TEST_WS_URL`, `NEXT_PUBLIC_POSTHOG_HOST`,
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_AWS_REGION`, `NEXT_PUBLIC_S3_ENDPOINT_OVERRIDE`.

## How to proxy another HTTP backend

To hide the API Gateway backend (the clean candidate) the same way as Core:

1. Add a rewrite to `next.config.mjs`:
   ```js
   { source: '/api/gateway/:path*', destination: process.env.API_GATEWAY_URL + '/:path*' }
   ```
2. Define `API_GATEWAY_URL` (server-only, drop the `NEXT_PUBLIC_` prefix) in the env
   files.
3. Change `lib/audio-pipeline-api.service.ts` to call `/api/gateway/...`.

**Caveat:** the audio flow relies on **presigned S3 URLs** returned by the gateway.
Those point at S3 directly, so proxying the gateway hides the gateway host but the
S3 URLs remain client-visible by design — that's how presigned uploads work.

**WebSocket caveat:** this rewrite technique does not work for `WebSocket`
connections (the agent server), so those hosts are necessarily public.

## Notes

- The audio pipeline service lives in `lib/audio-pipeline-api.service.ts` (the
  `CLAUDE.md` reference to `lib/aws-api.service.ts` is stale).
- Auth is enforced by JWT (Cognito/Amplify Bearer tokens via `lib/api-utils.ts`),
  not by URL secrecy — so an exposed URL is not itself an auth vulnerability, just a
  reduction in surface obscurity.
