import { deflateSync, inflateSync, strFromU8, strToU8 } from "fflate";
import { newId, validateProject, type Project } from "./studio-model.ts";

/**
 * Editable share links. The draft (text, pages and styles) is compressed into the URL fragment,
 * which browsers never send to a server. Local images are not included: they live on one device.
 */
export const SHARE_PREFIX = "#s=";
export const MAX_SHARE_LENGTH = 60_000;

const toBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromBase64Url = (text: string) => {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - text.length % 4) % 4));
  return Uint8Array.from(binary, char => char.charCodeAt(0));
};

export function encodeShare(project: Project) {
  const payload = { v: 1, n: project.name, m: project.mode, d: project.design, p: project.pages.map(page => Object.keys(page.design).length ? [page.markdown, page.design] : [page.markdown]) };
  const fragment = SHARE_PREFIX + toBase64Url(deflateSync(strToU8(JSON.stringify(payload)), { level: 9 }));
  const localImages = project.pages.some(page => /\]\(asset:/.test(page.markdown));
  return { fragment, tooLong: fragment.length > MAX_SHARE_LENGTH, localImages };
}

/** A new, validated project from a share fragment; throws a readable error for damaged links. */
export function decodeShare(fragment: string): Project {
  if (!fragment.startsWith(SHARE_PREFIX) || fragment.length > MAX_SHARE_LENGTH * 2) throw new Error("This share link is not valid.");
  let payload: { v?: number; n?: unknown; m?: unknown; d?: unknown; p?: unknown };
  try { payload = JSON.parse(strFromU8(inflateSync(fromBase64Url(fragment.slice(SHARE_PREFIX.length))))); }
  catch { throw new Error("This share link is incomplete or damaged. Ask for the link again."); }
  if (payload.v !== 1 || !Array.isArray(payload.p)) throw new Error("This share link was made by a newer version of MarkdownPic.");
  const pages = (payload.p as unknown[]).map(item => Array.isArray(item) ? { markdown: item[0], design: item[1] ?? {} } : { markdown: item, design: {} });
  const project = validateProject({ version: 2, id: newId(), name: typeof payload.n === "string" ? payload.n : "Shared draft", pages, design: payload.d, mode: payload.m, revision: 0 });
  const now = Date.now();
  return { ...project, id: newId(), createdAt: now, updatedAt: now, revision: 0 };
}
