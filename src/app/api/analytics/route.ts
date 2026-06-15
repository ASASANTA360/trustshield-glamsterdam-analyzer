export async function GET() {
  const storage = await import("../../../platform/storage.js");
  // storage may have a default export or named exports; use any to avoid TS property errors
  const getAnalytics = (storage as any).getAnalytics ?? (storage as any).default?.getAnalytics;

  if (typeof getAnalytics !== "function") {
    return new Response(JSON.stringify({ error: "getAnalytics unavailable" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  const analytics = await getAnalytics();

  return new Response(JSON.stringify(analytics), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}