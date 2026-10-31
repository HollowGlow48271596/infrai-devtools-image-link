import assert from "node:assert/strict";
import { signDownload, verifyDownload } from "./image_link_service.js";

const now = 1_700_000_000;
const link = signDownload("job-1", "test-secret", now, 60);
const params = new URLSearchParams(link.split("?")[1]);
assert.equal(verifyDownload("job-1", "test-secret", Number(params.get("exp")), params.get("sig")!, now + 59), true);
assert.equal(verifyDownload("job-1", "test-secret", Number(params.get("exp")), params.get("sig")!, now + 61), false);
console.log("signed link expiry decision: ok");
