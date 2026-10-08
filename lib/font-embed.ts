/**
 * Font embedding for export. html-to-image would inline every @font-face of every family a card
 * uses, which for CJK fonts means about a hundred unicode-range slices (megabytes) per export.
 * This keeps only the faces whose unicode-range covers characters that are actually in the card.
 */

export type RangeList = Array<[number, number]>;

/** Parses a CSS unicode-range ("U+4E00-9FFF, U+20, U+3??") into numeric ranges. */
export function parseUnicodeRange(value: string): RangeList {
  return value.split(",").map(part => part.trim().replace(/^u\+/i, "")).filter(Boolean).map(part => {
    if (part.includes("?")) return [parseInt(part.replace(/\?/g, "0"), 16), parseInt(part.replace(/\?/g, "F"), 16)] as [number, number];
    const [start, end] = part.split("-");
    return [parseInt(start, 16), parseInt(end ?? start, 16)] as [number, number];
  }).filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end));
}

/** Whether any code point of the text falls inside the ranges (an empty range list covers everything). */
export function rangeCovers(ranges: RangeList, codePoints: Set<number>) {
  if (!ranges.length) return true;
  for (const point of codePoints) for (const [start, end] of ranges) if (point >= start && point <= end) return true;
  return false;
}

const normalizeFamily = (family: string) => family.trim().replace(/^["']|["']$/g, "").toLowerCase();
const embedded = new Map<string, Promise<string>>();

async function toDataUrl(url: string) {
  let pending = embedded.get(url);
  if (!pending) {
    pending = fetch(url).then(response => { if (!response.ok) throw new Error("font " + response.status); return response.blob(); })
      .then(blob => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); }));
    pending.catch(() => embedded.delete(url));
    embedded.set(url, pending);
  }
  return pending;
}

function fontFaceRules(): Array<{ rule: CSSFontFaceRule; base: string }> {
  const found: Array<{ rule: CSSFontFaceRule; base: string }> = [];
  const visit = (rules: CSSRuleList, base: string) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSFontFaceRule) found.push({ rule, base });
      else if (rule instanceof CSSImportRule && rule.styleSheet) { try { visit(rule.styleSheet.cssRules, rule.styleSheet.href ?? base); } catch { /* cross-origin */ } }
      else if ("cssRules" in rule) visit((rule as CSSGroupingRule).cssRules, base);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try { visit(sheet.cssRules, sheet.href ?? location.href); } catch { /* cross-origin stylesheet: not ours */ }
  }
  return found;
}

/** The @font-face CSS (with inlined font data) needed to draw exactly this card. */
export async function fontEmbedCssFor(card: HTMLElement): Promise<string> {
  const families = new Set<string>();
  for (const element of [card, ...Array.from(card.querySelectorAll<HTMLElement>("*"))]) {
    for (const family of getComputedStyle(element).fontFamily.split(",")) families.add(normalizeFamily(family));
  }
  const codePoints = new Set<number>();
  for (const char of card.textContent ?? "") codePoints.add(char.codePointAt(0)!);
  const faces = fontFaceRules().filter(({ rule }) => families.has(normalizeFamily(rule.style.getPropertyValue("font-family")))
    && rangeCovers(parseUnicodeRange(rule.style.getPropertyValue("unicode-range")), codePoints));
  const css = await Promise.all(faces.map(async ({ rule, base }) => {
    const source = rule.style.getPropertyValue("src");
    const match = /url\(\s*["']?([^"')]+?\.woff2[^"')]*)["']?\s*\)/i.exec(source) ?? /url\(\s*["']?([^"')]+)["']?\s*\)/i.exec(source);
    if (!match || match[1].startsWith("data:")) return rule.cssText;
    try {
      const data = await toDataUrl(new URL(match[1], base).href);
      const declarations = ["font-family", "font-style", "font-weight", "font-stretch", "unicode-range", "font-display"]
        .map(name => [name, rule.style.getPropertyValue(name)] as const).filter(([, value]) => value).map(([name, value]) => `${name}:${value}`);
      return `@font-face{${declarations.join(";")};src:url(${data}) format("woff2")}`;
    } catch { return ""; }
  }));
  return css.filter(Boolean).join("\n");
}
