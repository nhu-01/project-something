import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

// Rider frames: Vercel Blob when configured, local disk (served by /api/photos) otherwise.
// When developing against the local database, photos stay local too, so test runs never touch the live bucket.
export async function savePhoto(name: string, data: Buffer): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN && process.env.USE_LOCAL_DB !== "1") {
    const blob = await put(`frames/${name}`, data, { access: "public", contentType: "image/jpeg", addRandomSuffix: false, allowOverwrite: true });
    return blob.url;
  }
  const dir = path.join(process.cwd(), ".data", "photos");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), data);
  return `/api/photos/${name}`;
}
