import { NextResponse } from "next/server";

const { getScan } = require("../../../../platform/storage");

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const scan = await getScan(params.id);
  if (!scan) return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  return NextResponse.json(scan);
}
