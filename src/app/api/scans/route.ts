const { listScans } = require("../../../platform/storage");

export async function GET() {
  const scans = await listScans();
  return new Response(JSON.stringify({ scans }), {
    headers: { "Content-Type": "application/json" },
  });
}
