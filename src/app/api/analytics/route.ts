import { NextResponse } from "next/server";

const { getAnalytics } = require("../../../platform/storage");

export async function GET() {
  return NextResponse.json(await getAnalytics());
}
