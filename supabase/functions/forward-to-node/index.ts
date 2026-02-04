import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const type = body.type || body.eventType || null;
    const record = body.record || body;

    if (type && type !== "INSERT") {
      return new Response(
        JSON.stringify({ message: "Ignored non-insert event" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const bucket = record?.bucket_id || record?.bucket || body.bucket;
    const file = record?.name || body.name;

    if (!bucket || !file) {
      return new Response(JSON.stringify({ error: "Missing bucket or file" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const NODE_SERVICE_URL = Deno.env.get("NODE_THUMBNAIL_SERVICE_URL");
    if (!NODE_SERVICE_URL) {
      return new Response(
        JSON.stringify({ error: "Node.js service URL not set" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const resp = await fetch(`${NODE_SERVICE_URL}/generate-thumbnails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucket, file }),
    });

    const result = await resp.json();

    return new Response(
      JSON.stringify({ ok: true, forwarded: true, nodeResult: result }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Function top-level error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
