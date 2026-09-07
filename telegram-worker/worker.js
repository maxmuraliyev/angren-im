/**
 * Cloudflare Worker: Read-only News API
 */

export default {
  // API Endpoints
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://angren-im.vercel.app/";

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(allowedOrigin) });
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
          headers: { "Content-Type": "application/json", ...corsHeaders(allowedOrigin) }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(allowedOrigin) }
        });
      }
    }

    // Default 404 for unknown routes
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders(allowedOrigin) }
    });
  }
};

function corsHeaders(allowedOrigin) {
  return {
    "Access-Control-Allow-Origin": allowedOrigin || "https://angren-im.vercel.app/",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
