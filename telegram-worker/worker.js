/**
 * Cloudflare Worker: Read-only News API
 */

const DEFAULT_ALLOWED_ORIGINS = [
  "https://angren-im.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173"
];

function getCorsOrigin(request, env) {
  const reqOrigin = request.headers.get("Origin") || "";
  const configuredOrigin = (env.ALLOWED_ORIGIN || "").replace(/\/$/, "");

  if (configuredOrigin && reqOrigin === configuredOrigin) {
    return reqOrigin;
  }

  if (DEFAULT_ALLOWED_ORIGINS.includes(reqOrigin)) {
    return reqOrigin;
  }

  return configuredOrigin || "https://angren-im.vercel.app";
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "X-Content-Type-Options": "nosniff"
  };
}

export default {
  async fetch(request, env) {
    const origin = getCorsOrigin(request, env);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (request.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) }
      });
    }

    const url = new URL(request.url);

    // PUBLIC NEWS ENDPOINT (Read-only)
    if (url.pathname === "/news") {
      try {
        if (!env.DB) {
          throw new Error("D1 Database binding 'DB' is missing.");
        }

        const { results } = await env.DB.prepare(
          "SELECT id, tg_post_id, title, body, image_url, views_count, likes_count, created_at FROM company_news ORDER BY id DESC LIMIT 20"
        ).all();
        
        return new Response(JSON.stringify(results), {
          status: 200,
          headers: { 
            "Content-Type": "application/json", 
            "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
            ...corsHeaders(origin) 
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(origin) }
        });
      }
    }

    // Default 404 for unknown routes
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) }
    });
  }
};
