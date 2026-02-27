export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    service: "api",
    version: "0.0.1",
  });
}
