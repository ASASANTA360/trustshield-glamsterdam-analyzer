import { NextResponse } from "next/server";

const { listScans } = require("../../../platform/storage");

export async function GET() {
  return NextResponse.json({ scans: await listScans() });
}
