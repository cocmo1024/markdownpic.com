import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { PAGE_BREAK_MARKER, type StudioPage, newPage } from "./studio-model.ts";

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);

export interface MarkdownSegment { markdown: string; start: number; end: number }

/** Only top-level HTML page markers count. Code fences, lists and quotations remain untouched. */
export function splitMarkdownPages(source: string): MarkdownSegment[] {
  if (!/<!--\s*page\s*-->/i.test(source)) return [{ markdown: source, start: 0, end: source.length }];
  const root = parser.parse(source);
  const markers = root.children.filter(node => node.type === "html" && /^<!--\s*page\s*-->$/i.test(node.value.trim()));
  const pages: MarkdownSegment[] = [];
  let start = 0;
  for (const marker of markers) {
    const position = marker.position!;
    // Own the separator's blank lines, so serialize -> parse does not add
    // more whitespace on every editor keystroke.
    const markerStart = position.start.offset!;
    const before = source.slice(start, markerStart);
    const paddingBefore = before.match(/(?:\r?\n){1,2}$/)?.[0].length ?? 0;
    const end = markerStart - paddingBefore;
    pages.push({ markdown: source.slice(start, end), start, end });
    const markerEnd = position.end.offset!;
    const paddingAfter = source.slice(markerEnd).match(/^(?:\r?\n){1,2}/)?.[0].length ?? 0;
    start = markerEnd + paddingAfter;
  }
  pages.push({ markdown: source.slice(start), start, end: source.length });
  return pages;
}

export function pagesFromMarkdown(source: string): StudioPage[] {
  return splitMarkdownPages(source).map(segment => newPage(segment.markdown));
}

export function serializePages(pages: Array<{ markdown: string }>) {
  return pages.map(page => page.markdown).join(`\n\n${PAGE_BREAK_MARKER}\n\n`);
}

export function displayMarkdown(pages: Array<{ markdown: string }>) {
  return pages.map(page => page.markdown).join("\n\n");
}

export function documentTitle(source: string) {
  const first = source.match(/^ {0,3}#{1,6}\s+(.+)$/m)?.[1] ?? "Untitled";
  return first.replace(/[*_`]/g, "").trim().slice(0, 100);
}

/** Source slices retain syntax and definitions. Pagination never rewrites user wording. */
export function semanticBlocks(source: string) {
  const root = parser.parse(source);
  const definitions = root.children.filter(n => n.type === "definition");
  const definitionSource = definitions.map(n => source.slice(n.position!.start.offset, n.position!.end.offset)).join("\n");
  const nodes = root.children.filter(n => n.type !== "definition");
  const blocks: Array<{ source: string; type: string }> = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    let end = node.position!.end.offset;
    // Keep a heading with its following block, including consecutive headings.
    if (node.type === "heading") {
      while (i + 1 < nodes.length) {
        const next = nodes[++i];
        end = next.position!.end.offset;
        if (next.type !== "heading") break;
      }
    }
    blocks.push({ source: source.slice(node.position!.start.offset, end), type: node.type });
  }
  return { blocks, definitions: definitionSource };
}

export function localAssetIds(source: string): string[] {
  if (!source.includes("asset:img-")) return [];
  const ids = new Set<string>();
  const walk = (node: unknown) => {
    const value = node as { type?: string; url?: string; children?: unknown[] };
    if ((value.type === "image" || value.type === "definition") && value.url?.startsWith("asset:img-")) ids.add(value.url.slice(6));
    value.children?.forEach(walk);
  };
  walk(parser.parse(source));
  return [...ids];
}

export function replaceAssetIds(source: string, replacements: Map<string, string>) {
  return source.replace(/\basset:(img-[a-z0-9-]+)/gi, (match, id: string) => replacements.has(id) ? `asset:${replacements.get(id)}` : match);
}

/** Split only at safe Markdown boundaries. Never cut code, math, images or inline formatting. */
export function splitOversizeBlock(source: string): string[] | null {
  const root = parser.parse(source);
  const first = root.children[0];
  if (!first) return null;
  if (first.type === "heading" && root.children.length > 1) {
    const prefix = source.slice(0, root.children[1].position!.start.offset);
    const rest = source.slice(root.children[1].position!.start.offset);
    const split = splitOversizeBlock(rest);
    return split ? [prefix + split[0], ...split.slice(1)] : null;
  }
  if (first.type === "list" && first.children.length > 1) {
    const middle = Math.ceil(first.children.length / 2);
    const offset = first.children[middle].position!.start.offset!;
    let rest = source.slice(offset);
    if (first.ordered) rest = rest.replace(/^([ \t]{0,3})\d+([.)])/, `$1${(first.start ?? 1) + middle}$2`);
    return [source.slice(0, offset), rest];
  }
  if (first.type === "table" && first.children.length > 2) {
    const middle = Math.ceil(first.children.length / 2);
    const offset = first.children[middle].position!.start.offset!;
    const header = source.slice(first.position!.start.offset, first.children[1].position!.start.offset);
    return [source.slice(0, offset), header + source.slice(offset)];
  }
  if (first.type === "paragraph") {
    const boundaries: number[] = [];
    for (const child of first.children) {
      if (child.type !== "text") continue;
      const start = child.position!.start.offset!;
      const text = source.slice(start, child.position!.end.offset);
      for (const match of text.matchAll(/\s+/g)) {
        const offset = start + match.index! + match[0].length;
        if (offset > 40 && offset < source.length - 40) boundaries.push(offset);
      }
    }
    const middle = boundaries.sort((a, b) => Math.abs(a - source.length / 2) - Math.abs(b - source.length / 2))[0];
    if (middle) return [source.slice(0, middle), source.slice(middle)];
  }
  return null;
}
