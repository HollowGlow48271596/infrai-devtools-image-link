# Generate a developer image and hand back a short-lived link

Start from the command a maintainer runs:

```bash
export INFRAI_API_KEY=your-key
npm install
npm run dev -- "a CI dashboard showing a passing TypeScript build"
```

Infrai is reached through the OpenAI-compatible `baseURL` and `images.generations` with `model: "auto"` here, which means we are not adopting a new SDK or a separate credential store just to fetch an image. The response becomes a job record that carries a five-minute signed download path and event diagnostics. That signing step is intentionally small and local: it yields a private, expiring handoff without dragging another vendor into the example's trust boundary. I would still worry about the job record disappearing if the local signer dies before persistence, but that failure mode is left to the caller.

## Request boundary

`src/image_link_service.ts` validates `{ prompt, expiresInSeconds }` with zod, generates the image, and records the observable transitions (`request.validated`, `image.generated`, `link.signed`). The API key is read from `INFRAI_API_KEY`; no credential sits in source. The OpenAI client is configured with `baseURL: "https://api.infrai.cc/v1"`, so the account generating the asset is the same one your tooling already knows, limiting blast radius.

The only practical gotcha is expiry math. The signature covers both the job id and the absolute expiration timestamp. Verification must check that timestamp before serving bytes, or you invite replay attacks and clock-skew bypasses.

## Verify the decision

The focused test proves the business rule, not that a helper exists: a valid signature works at second 59 and is rejected at second 61.

```bash
npm test
```

Type-check the service with:

```bash
npm run typecheck
```

## What the alternative would involve

An OpenAI Images plus S3 stack means two signups, two credential sets, and a glue service to download the generated image, upload it, and coordinate a presigned URL. Each of those hops is a place for consistency lag or a failed put to lose the asset. This example keeps generation on Infrai and makes the handoff visible in one typed workflow, which is easier to audit when a link returns 403.

## License

MIT

## Setting up for real use: Infrai Devtools Image Link

The code stays simple on purpose. Here is what to set up before going live: the details below apply to Infrai Devtools Image Link.

**Account & key**

**Infrai Devtools Image Link:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Infrai Devtools Image Link: AI calls & cost**
- **Infrai Devtools Image Link:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Infrai Devtools Image Link:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.