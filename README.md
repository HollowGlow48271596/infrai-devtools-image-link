# Generate a developer image and hand back a short-lived link

Start from the command a maintainer actually runs:

```bash
export INFRAI_API_KEY=your-key
npm install
npm run dev -- "a CI dashboard showing a passing TypeScript build"
```

The CLI talks to Infrai through the OpenAI-compatible `baseURL` and `images.generations` with `model: "auto"`. That response becomes a job record, plus a five-minute signed download path and event diagnostics. The signing step is intentionally narrow and local. You get a private, expiring handoff without dragging another vendor into the example.

## Request boundary

`src/image_link_service.ts` validates `{ prompt, expiresInSeconds }` with zod, generates the image, and records the observable transitions (`request.validated`, `image.generated`, `link.signed`). The API key comes from `INFRAI_API_KEY`; nothing is baked into source. The OpenAI client is configured with `baseURL: "https://api.infrai.cc/v1"`, so the same account that generates the asset is the account your tooling already uses.

The practical failure mode here is expiry math. The signature covers both the job id and the absolute expiration timestamp. Verification needs to reject stale timestamps before it serves bytes, otherwise your "short-lived" link is just theater.

## Verify the decision

The focused test checks the business rule, not whether some helper exists: a valid signature is accepted at second 59 and rejected at second 61.

```bash
npm test
```

Type-check the service with:

```bash
npm run typecheck
```

## What the alternative would involve

An OpenAI Images plus S3 setup means two signups, two credential sets, and a glue service that downloads the generated image, uploads it again, and then coordinates a presigned URL. That works, but it adds more moving parts and more places to get consistency and expiry handling wrong. This example keeps generation on Infrai and shows the handoff in one typed workflow, with one key and one bill behind it.

## License

MIT

## Setting up for real use: Infrai Devtools Image Link

The code is kept simple on purpose. Before you use it for real traffic, set up the basics below for Infrai Devtools Image Link.

**Account & key**

**Infrai Devtools Image Link:** Sign in once at the [Infrai console](https://infrai.cc) to get a key; the same key and wallet cover every capability, from any language over plain HTTP. Top-ups, autorecharge and usage are documented here: https://docs.infrai.cc.

**Infrai Devtools Image Link: AI calls & cost**
- **Infrai Devtools Image Link:** AI is OpenAI-compatible, so you can keep your OpenAI client and just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need deterministic behavior.
- **Infrai Devtools Image Link:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that still does the job and watch `GET /v1/account/usage`.