import { NextResponse } from "next/server";

const { runSecurityScan } = require("../../../platform/scanService");
const { validateScanInput } = require("../../../platform/validation");

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await request.json() : Object.fromEntries((await request.formData()).entries());
  const validation = validateScanInput(body);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const report = await runSecurityScan(validation.value);
  return NextResponse.json(report, { status: 201 });
}
