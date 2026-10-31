import { generateImage } from "./image_link_service.js";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("set INFRAI_API_KEY before running");
const prompt = process.argv.slice(2).join(" ") || "a terminal window with a green build check";
const job = await generateImage({ prompt, expiresInSeconds: 300 }, key);
console.log(JSON.stringify(job, null, 2));
