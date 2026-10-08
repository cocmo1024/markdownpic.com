/**
 * Render-time Markdown refinements. The source text is never changed; only what is drawn.
 */

/** Splits Markdown into prose and code (fenced blocks and inline code spans), keeping every character. */
function mapProse(markdown: string, transform: (prose: string) => string) {
  const out: string[] = [];
  let fence = "", prose = "";
  const flush = () => { if (prose) { out.push(transformInline(prose, transform)); prose = ""; } };
  for (const line of markdown.split(/(?<=\n)/)) {
    const opener = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) { out.push(line); if (opener && opener[0] === fence[0] && opener.length >= fence.length) fence = ""; continue; }
    if (opener) { flush(); fence = opener; out.push(line); continue; }
    prose += line;
  }
  flush();
  return out.join("");
}

function transformInline(prose: string, transform: (prose: string) => string) {
  // Inline code spans are kept verbatim.
  return prose.split(/(`+[^`]*?`+)/).map((part, i) => i % 2 ? part : transform(part)).join("");
}

const ONE_LINE_DISPLAY = /^[ \t]*\$\$([^\n$][^\n]*?)\$\$[ \t]*$/gm;

/**
 * ChatGPT, Claude and Gemini write math as \( … \) and \[ … \]; the renderer expects $ … $ and $$ … $$.
 * Display math is moved onto its own lines so it renders centered.
 */
export function normalizeMathDelimiters(markdown: string) {
  if (!/\\[([]/.test(markdown) && !markdown.includes("$")) return markdown;
  return mapProse(markdown, prose => escapeCurrency(latexForKatex(prose
    // `$$ x $$` alone on a line is a display formula everywhere else (GitHub, AI chats); keep it one.
    .replace(ONE_LINE_DISPLAY, (_, body: string) => "\n$$\n" + body.trim() + "\n$$\n")
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, body: string) => "\n$$\n" + body.trim() + "\n$$\n")
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, body: string) => "$" + body.trim() + "$"))));
}

/**
 * LaTeX that KaTeX rejects but that means nothing in a picture: `\label` is dropped,
 * `\newcommand` becomes `\gdef` (so it may also replace a KaTeX built-in such as `\R`),
 * and `\DeclareMathOperator` becomes an `\operatorname` macro.
 */
export function latexForKatex(text: string) {
  if (!text.includes("\\")) return text;
  return text
    .replace(/\\label\s*\{[^{}]*\}/g, "")
    .replace(/\\(?:re|provide)?newcommand\*?\s*\{?\s*(\\[A-Za-z]+)\s*\}?\s*(?:\[(\d)\])?\s*(?=\{)/g, (_, name: string, count?: string) => "\\gdef" + name + Array.from({ length: Number(count ?? 0) }, (_, i) => "#" + (i + 1)).join(""))
    .replace(/\\DeclareMathOperator(\*?)\s*\{\s*(\\[A-Za-z]+)\s*\}\s*\{([^{}]*)\}/g, (_, star: string, name: string, label: string) => "\\gdef" + name + "{\\operatorname" + star + "{" + label + "}}");
}

/**
 * Prices are not math. Like Pandoc, a single `$` opens inline math only when the next `$`
 * can close it: the opener is followed by a non-space, the closer follows a non-space and is
 * not followed by a digit. Any other single `$` is escaped, so "$5 and $10" stays text.
 */
export function escapeCurrency(text: string) {
  if (!text.includes("$")) return text;
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "\\") { out += char + (text[i + 1] ?? ""); i++; continue; }
    if (char !== "$") { out += char; continue; }
    if (text[i + 1] === "$") {
      // Display math: copied through to its closing $$ untouched.
      const end = text.indexOf("$$", i + 2);
      const stop = end === -1 ? text.length : end + 2;
      out += text.slice(i, stop); i = stop - 1; continue;
    }
    const close = nextDollar(text, i + 1);
    const opens = /\S/.test(text[i + 1] ?? "");
    const closes = close !== -1 && text[close + 1] !== "$" && /\S/.test(text[close - 1]) && !/\d/.test(text[close + 1] ?? "") && !text.slice(i + 1, close).includes("\n\n");
    if (opens && closes) { out += text.slice(i, close + 1); i = close; continue; }
    out += "\\$";
  }
  return out;
}

function nextDollar(text: string, from: number) {
  for (let i = from; i < text.length; i++) {
    if (text[i] === "\\") { i++; continue; }
    if (text[i] === "$") return i;
  }
  return -1;
}

export const hasMath = (markdown: string) => markdown.includes("$") || /\\[([]/.test(markdown);

const OPENING_CONTEXT = /[\s([{—–-]/;

/**
 * Typographic punctuation for a run of prose text. `previous` is the character before this run
 * (from the preceding text node), so quotes are oriented correctly across formatting boundaries.
 */
export function smartenText(text: string, previous = "") {
  let result = "";
  const source = text.replace(/\.\.\./g, "…").replace(/---/g, "—").replace(/(?<=\s|\d)--(?=\s|\d)/g, "–").replace(/--/g, "—");
  for (let i = 0; i < source.length; i++) {
    const char = source[i], before = i ? source[i - 1] : previous, after = source[i + 1] ?? "";
    const opening = !before || OPENING_CONTEXT.test(before);
    if (char === "\"") result += opening && after && !/\s/.test(after) ? "“" : "”";
    else if (char === "'") result += opening && after && !/\s/.test(after) && !/\d/.test(after) ? "‘" : "’";
    else result += char;
  }
  return result;
}

type HastNode = { type: string; value?: string; tagName?: string; properties?: Record<string, unknown>; children?: HastNode[] };
const SKIP_TAGS = new Set(["code", "pre", "kbd", "samp", "script", "style", "math", "svg"]);
const skipElement = (node: HastNode) => node.tagName !== undefined && (SKIP_TAGS.has(node.tagName) || String((node.properties?.className as string[] | undefined)?.join(" ") ?? "").includes("katex"));

/** A rehype plugin applying smartenText to prose, skipping code, math and diagrams. */
export function rehypeSmartTypography() {
  return (tree: HastNode) => {
    let previous = "";
    const walk = (node: HastNode) => {
      if (node.type === "text" && typeof node.value === "string") {
        node.value = smartenText(node.value, previous);
        previous = node.value.slice(-1) || previous;
        return;
      }
      if (skipElement(node)) { previous = "x"; return; }
      for (const child of node.children ?? []) walk(child);
      if (node.tagName && /^(p|h[1-6]|li|blockquote|td|th|div)$/.test(node.tagName)) previous = "";
    };
    walk(tree);
  };
}

const textOf = (node: HastNode): string => node.type === "text" ? node.value ?? "" : (node.children ?? []).map(textOf).join("");
/** A figure has a digit ("87%", "3×", "01") or no letters at all (an emoji or symbol). */
const isFigure = (text: string) => /\d/.test(text) || !/\p{L}/u.test(text);
/** Longest top-level heading (in characters) still set as a display figure. */
export const DISPLAY_HEADING_MAX = 6;

/**
 * A very short top-level heading — a figure, a percentage, "01", an emoji — is a display
 * element, not a headline: it gets the `display` class and is set several times larger.
 */
export function rehypeDisplayHeadings() {
  return (tree: HastNode) => {
    for (const node of tree.children ?? []) {
      if (node.type !== "element" || node.tagName !== "h1") continue;
      const text = textOf(node).trim();
      if (!text || [...text].length > DISPLAY_HEADING_MAX || !isFigure(text)) continue;
      const existing = (node.properties?.className as string[] | undefined) ?? [];
      node.properties = { ...node.properties, className: [...existing, "display"] };
    }
  };
}
