import { readFile } from "node:fs/promises";
import path from "node:path";

// Local-dev only: in production frames live in Vercel Blob.
export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  if (!/^[\w-]+\.jpg$/.test(name)) return new Response("not found", { status: 404 });
  try {
    return new Response(await readFile(path.join(process.cwd(), ".data", "photos", name)), { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=86400" } });
  } catch {
    return new Response("not found", { status: 404 });
  }
}
