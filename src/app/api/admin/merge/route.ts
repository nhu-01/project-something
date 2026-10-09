import { mergeDuplicates } from "@/lib/server/maintenance";

// Maintenance: GET shows which duplicate hazards would be folded together, POST does it. Needs the admin key.
const allowed = (req: Request) => Boolean(process.env.ADMIN_KEY) && req.headers.get("x-admin-key") === process.env.ADMIN_KEY;

export async function GET(req: Request) {
  if (!allowed(req)) return new Response("not found", { status: 404 });
  return Response.json(await mergeDuplicates(false));
}
export async function POST(req: Request) {
  if (!allowed(req)) return new Response("not found", { status: 404 });
  return Response.json(await mergeDuplicates(true));
}
