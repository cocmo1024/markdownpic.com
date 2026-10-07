import { localAssetIds, replaceAssetIds, serializePages } from "./markdown-document.ts";
import { loadLocalImage, saveLocalImage } from "./local-image-store.ts";
import { MAX_IMAGE_BYTES, newId, slugify, validateProject, type Project } from "./studio-model.ts";

const MAX_BUNDLE_BYTES = 64_000_000;
interface BundleAsset { id: string; path: string; type: string }
interface Manifest { format: "markdownpic"; version: 1; project: Project; assets: BundleAsset[] }

export async function exportProjectBundle(project: Project) {
  const { zipSync, strToU8 } = await import("fflate");
  const snapshot = structuredClone(project);
  const markdown = serializePages(snapshot.pages);
  const ids = localAssetIds(markdown);
  const files: Record<string, Uint8Array> = {};
  const assets: BundleAsset[] = [];
  let bytes = 0;
  for (const id of ids) {
    const blob = await loadLocalImage(id);
    if (!blob) throw new Error("A local image is missing. Restore or replace it before backing up this project.");
    bytes += blob.size;
    if (bytes > MAX_BUNDLE_BYTES) throw new Error("This project contains more than 64 MB of images. Split it into smaller projects before backup.");
    const extension = ({ "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg" } as Record<string, string>)[blob.type] ?? "bin";
    const path = `assets/${id}.${extension}`;
    files[path] = new Uint8Array(await blob.arrayBuffer());
    assets.push({ id, path, type: blob.type });
  }
  const manifest: Manifest = { format: "markdownpic", version: 1, project: snapshot, assets };
  files["project.json"] = strToU8(JSON.stringify(manifest));
  let portableMarkdown = markdown;
  for (const asset of assets) portableMarkdown = portableMarkdown.replaceAll(`asset:${asset.id}`, asset.path);
  files["source.md"] = strToU8(portableMarkdown);
  const zip = zipSync(files, { level: 0 });
  return { blob: new Blob([new Uint8Array(zip)], { type: "application/zip" }), name: `${slugify(project.name)}.mdpic` };
}

export async function importProjectBundle(file: Blob, verifyImage?: (blob: Blob) => Promise<void>): Promise<Project> {
  if (file.size > MAX_BUNDLE_BYTES + 2_000_000) throw new Error("This project file is too large. The limit is 64 MB of assets.");
  const { unzipSync, strFromU8 } = await import("fflate");
  let expandedBytes = 0;
  let count = 0;
  const files = unzipSync(new Uint8Array(await file.arrayBuffer()), { filter: entry => {
    expandedBytes += entry.originalSize;
    if (++count > 128 || expandedBytes > MAX_BUNDLE_BYTES + 2_000_000 || entry.name.includes("..") || entry.name.startsWith("/") || entry.name.includes("\\")) throw new Error("This project archive is not safe to open.");
    return entry.name === "project.json" || /^assets\/img-[a-z0-9-]+\.[a-z]+$/i.test(entry.name);
  } });
  if (!files["project.json"] || files["project.json"].length > 2_000_000) throw new Error("Choose a .mdpic project exported by MarkdownPic.");
  const manifest = JSON.parse(strFromU8(files["project.json"])) as Partial<Manifest>;
  if (manifest.format !== "markdownpic" || manifest.version !== 1 || !Array.isArray(manifest.assets)) throw new Error("This project format is not supported. The original file was not changed.");
  const project = validateProject(manifest.project);
  // Validate the whole manifest before storing any resource. ZIP entries are never executed.
  const ids = new Set<string>();
  for (const asset of manifest.assets) {
    if (!asset || typeof asset.id !== "string" || !/^img-[a-z0-9-]+$/i.test(asset.id) || !/^assets\/img-[a-z0-9-]+\.[a-z]+$/i.test(asset.path) || !files[asset.path] || !["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"].includes(asset.type) || files[asset.path].length > MAX_IMAGE_BYTES || ids.has(asset.id)) throw new Error("The project contains an invalid, duplicate, oversized, or missing image.");
    ids.add(asset.id);
    if (verifyImage) await verifyImage(new Blob([new Uint8Array(files[asset.path])], { type: asset.type }));
  }
  const referenced = localAssetIds(serializePages(project.pages));
  if (referenced.some(id => !manifest.assets!.some(asset => asset.id === id))) throw new Error("The project backup is missing a referenced image.");
  const replacements = new Map<string, string>();
  for (const asset of manifest.assets) {
    const blob = new Blob([new Uint8Array(files[asset.path])], { type: asset.type });
    replacements.set(asset.id, await saveLocalImage(blob, asset.path));
  }
  project.id = newId();
  project.revision = 0;
  project.createdAt = project.updatedAt = Date.now();
  project.pages = project.pages.map(page => ({ ...page, markdown: replaceAssetIds(page.markdown, replacements) }));
  return project;
}
