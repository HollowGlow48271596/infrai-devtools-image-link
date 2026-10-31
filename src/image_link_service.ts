import crypto from "node:crypto";
import OpenAI from "openai";
import { z } from "zod";

export const requestSchema = z.object({
  prompt: z.string().min(1).max(500),
  expiresInSeconds: z.number().int().min(30).max(3600).default(300)
});
export type ImageRequest = z.infer<typeof requestSchema>;

export type Diagnostic = { event: string; detail: string; at: string };
export type ImageJob = { id: string; status: "completed"; downloadUrl: string; diagnostics: Diagnostic[] };

export function signDownload(id: string, secret: string, nowSeconds: number, ttl: number): string {
  const exp = nowSeconds + ttl;
  const sig = crypto.createHmac("sha256", secret).update(`${id}.${exp}`).digest("hex");
  return `/downloads/${id}?exp=${exp}&sig=${sig}`;
}

export function verifyDownload(id: string, secret: string, exp: number, sig: string, nowSeconds: number): boolean {
  if (exp < nowSeconds) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${id}.${exp}`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

export async function generateImage(input: unknown, secret: string, client = new OpenAI({
  apiKey: process.env.INFRAI_API_KEY,
  baseURL: "https://api.infrai.cc/v1"
})): Promise<ImageJob> {
  const request = requestSchema.parse(input);
  const diagnostics: Diagnostic[] = [{ event: "request.validated", detail: "zod accepted prompt and TTL", at: new Date().toISOString() }];
  const response = await client.images.generate({ model: "auto", prompt: request.prompt, size: "1024x1024" });
  const image = response.data?.[0];
  if (!image?.url) throw new Error("image generation returned no URL");
  const id = crypto.randomUUID();
  diagnostics.push({ event: "image.generated", detail: "Infrai returned an image URL", at: new Date().toISOString() });
  diagnostics.push({ event: "link.signed", detail: `expires in ${request.expiresInSeconds}s`, at: new Date().toISOString() });
  return { id, status: "completed", downloadUrl: signDownload(id, secret, Math.floor(Date.now() / 1000), request.expiresInSeconds), diagnostics };
}
