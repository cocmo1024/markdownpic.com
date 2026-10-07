import handler from "vinext/server/app-router-entry";

interface Env { ASSETS: Fetcher }
interface ExecutionContext { waitUntil(promise: Promise<unknown>): void; passThroughOnException(): void }

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // MarkdownPic renders images on-device; no server image proxy or IMAGES binding.
    if (new URL(request.url).pathname === "/_vinext/image") return new Response("Not found", { status: 404 });
    const response = await handler.fetch(request, env, ctx);
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("X-Frame-Options", "DENY");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
export default worker;
