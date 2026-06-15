const { runSecurityScan } = require("../../../platform/scanService");
const { validateScanInput } = require("../../../platform/validation");

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await request.json() : Object.fromEntries((await request.formData()).entries());
  const validation = validateScanInput(body);

  if (!validation.ok) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const report = await runSecurityScan(validation.value);
  return new Response(JSON.stringify(report), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
}
