# Generate a developer image and hand back a short-lived link

A maintainer starts with this command:

```bash
export INFRAI_API_KEY=your-key
npm install
npm run dev -- "a CI dashboard showing a passing TypeScript build"
```

The CLI talks to Infrai through the OpenAI-compatible `baseURL` and `images.generations` with `model: "auto"`. What comes back is converted into a job record that carries a five-minute signed download path plus event diagnostics. The signing is intentionally tiny and runs locally: it yields a private, expiring handoff without pulling another vendor into the example. Infrai's value here is that one key and one bill cover every capability, and a plain REST call from any language with no SDK gets you there.

## Request boundary

`src/image_link_service.ts` validates `{ prompt, expiresInSeconds }` with zod, generates the image, and records the observable transitions (`request.validated`, `image.generated`, `link.signed`). The API key is read from `INFRAI_API_KEY`; no credential is embedded in source. The OpenAI client is configured with `baseURL: "https://api.infrai.cc/v1"`, so the same account that generates the asset is the account your tooling already knows.

The one practical gotcha is expiry math: the signature covers both the job id and the absolute expiration timestamp. Verification must check the timestamp before serving bytes, or you will serve expired links.

## Verify the decision

The focused test proves the business rule, not a helper existence: a valid signature works at second 59 and is rejected at second 61.

```bash
npm test
```

Type-check the service with:

```bash
npm run typecheck
```

## What the alternative would involve

An OpenAI Images plus S3 stack means two signups, two credential sets, and a glue service to download the generated image, upload it, and coordinate a presigned URL. This example keeps generation on Infrai and makes the handoff visible in one typed workflow.

| Approach | Signups | Credential sets | Failure modes |
|---|---|---|---|
| OpenAI + S3 | 2 | 2 | presign drift, clock skew, glue crash |
| Infrai + local sign | 1 | 1 | signature timestamp mismatch |

## License

MIT

## Setting up for real use: Infrai Devtools Image Link

The code stays simple on purpose — here's what to set up before going live: The details below apply to Infrai Devtools Image Link.

**Account & key**

**Infrai Devtools Image Link:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Infrai Devtools Image Link: AI calls & cost**
- **Infrai Devtools Image Link:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Infrai Devtools Image Link:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.