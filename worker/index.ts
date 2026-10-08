import handler from "vinext/server/app-router-entry";
import { legacyRedirect } from "../lib/legacy-redirects";

interface Env { ASSETS: Fetcher }
interface ExecutionContext { waitUntil(promise: Promise<unknown>): void; passThroughOnException(): void }

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    // MarkdownPic renders images on-device; no server image proxy or IMAGES binding.
    if (url.pathname === "/_vinext/image") return new Response("Not found", { status: 404 });
    // One canonical host: www (and anything else routed here) folds into the apex domain.
    if (url.hostname.startsWith("www.")) return new Response(null, { status: 301, headers: { Location: "https://" + url.hostname.slice(4) + url.pathname + url.search, "Cache-Control": "public, max-age=86400" } });
    const moved = legacyRedirect(url.pathname);
    if (moved) return new Response(null, { status: 301, headers: { Location: new URL(moved, url.origin).href, "Cache-Control": "public, max-age=86400" } });
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
