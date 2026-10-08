"use client";

import { Fragment, isValidElement, memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ImgHTMLAttributes, type ReactNode, type Ref } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import ReactMarkdown, { defaultUrlTransform, type Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import { foregroundOn, presetFor, readableAccent, themeFor, type Design } from "@/lib/studio-model";
import { hasBrand, type BrandKit } from "@/lib/brand-kit";
import { hasMath, normalizeMathDelimiters, rehypeDisplayHeadings, rehypeSmartTypography } from "@/lib/render-markdown";

// KaTeX is the heaviest renderer, so it loads only for documents that contain math ($).
// Until it arrives the card carries a pending marker, which holds back measurement and export.
type Plugins = NonNullable<Options["remarkPlugins"]>;
type KatexPlugin = NonNullable<Options["rehypePlugins"]>[number];
let mathPlugins: { remark: Plugins; katex: KatexPlugin } | null = null;
let mathLoading: Promise<void> | null = null;
// mhchem adds \ce and \pu for chemistry; it registers itself on the same KaTeX that rehype-katex uses.
const loadMath = () => mathLoading ??= Promise.all([import("remark-math"), import("rehype-katex"), import("katex/contrib/mhchem")])
  .then(([math, katex]) => { mathPlugins = { remark: [remarkGfm, math.default], katex: katex.default as KatexPlugin }; })
  .catch(error => { mathLoading = null; throw error; });
const basePlugins: Plugins = [remarkGfm];
const MIN_FORMULA_SCALE = .55;

const diagramCache = new Map<string, string>();
let diagramQueue = Promise.resolve();

function Diagram({ source, dark }: { source: string; dark: boolean }) {
  const cacheKey = `${dark}:${source}`;
  const [state, setState] = useState({ svg: diagramCache.get(cacheKey) ?? "", error: "" });
  useEffect(() => {
    if (diagramCache.has(cacheKey)) return;
    let cancelled = false;
    const render = async () => {
      if (cancelled) return;
      try {
        const { default: mermaid } = await import("mermaid");
        // Our inline error owns recovery; Mermaid must remove its temporary error SVG.
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", suppressErrorRendering: true, theme: dark ? "dark" : "neutral", fontFamily: "Geist, Arial, sans-serif", maxTextSize: 30_000 });
        const { svg } = await mermaid.render(`diagram-${crypto.randomUUID().replaceAll("-", "")}`, source);
        if (diagramCache.size > 80) diagramCache.delete(diagramCache.keys().next().value!);
        diagramCache.set(cacheKey, svg);
        if (!cancelled) setState({ svg, error: "" });
      } catch {
        if (!cancelled) setState({ svg: "", error: "This Mermaid diagram has a syntax error. Edit the diagram or use a template to start." });
      }
    };
    diagramQueue = diagramQueue.then(render, render);
    return () => { cancelled = true; };
  }, [cacheKey, dark, source]);
  if (state.error) return <div className="capture-error" data-capture-error={state.error}>{state.error}</div>;
  if (!state.svg) return <div className="capture-loading" data-capture-pending="diagram">Rendering diagram…</div>;
  return <div className="mermaid-block" dangerouslySetInnerHTML={{ __html: state.svg }} />;
}

function MarkdownImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  if (!props.src || failed) return <span className="capture-error" data-capture-error="An image is missing or blocked. Replace it with a local PNG, JPEG, or WebP image.">Image unavailable · replace or remove this image</span>;
  // Remote Markdown images need CORS for local image export.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={props.alt ?? ""} crossOrigin="anonymous" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}

// Syntax highlighting loads only when a document contains a fenced block with a language.
type Highlighter = { highlight: (language: string, value: string) => Parameters<typeof toJsxRuntime>[0]; registered: (language: string) => boolean };
let highlighter: Highlighter | null = null;
let highlighterLoading: Promise<void> | null = null;
const loadHighlighter = () => highlighterLoading ??= import("lowlight")
  .then(({ createLowlight, common }) => { highlighter = createLowlight(common) as unknown as Highlighter; })
  .catch(error => { highlighterLoading = null; throw error; });

function HighlightedCode({ language, code }: { language: string; code: string }) {
  const [, setReady] = useState(Boolean(highlighter));
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (highlighter) return;
    let active = true;
    loadHighlighter().then(() => { if (active) setReady(true); }, () => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  if (!highlighter) return <><code>{code}</code>{!failed && <span hidden data-capture-pending="code" />}</>;
  if (!highlighter.registered(language)) return <code>{code}</code>;
  return <code className={"hljs language-" + language}>{toJsxRuntime(highlighter.highlight(language, code), { Fragment, jsx, jsxs })}</code>;
}

function CodeBlock({ children, dark }: { children?: ReactNode; dark: boolean }) {
  if (isValidElement<{ className?: string; children?: ReactNode }>(children) && children.props.className?.split(" ").includes("language-mermaid")) {
    const source = String(children.props.children).replace(/\n$/, "");
    return <Diagram key={`${dark}:${source}`} source={source} dark={dark} />;
  }
  const language = isValidElement<{ className?: string }>(children) ? children.props.className?.replace("language-", "") ?? "" : "";
  const code = isValidElement<{ children?: ReactNode }>(children) ? String(children.props.children ?? "").replace(/\n$/, "") : "";
  return <div className="code-block"><div className="code-chrome" aria-hidden="true"><i /><i /><i />{language && <span>{language}</span>}</div><pre>{language ? <HighlightedCode language={language.toLowerCase()} code={code} /> : children}</pre></div>;
}

export interface CaptureProps {
  markdown: string;
  design: Design;
  assetUrls: Record<string, string>;
  label?: string;
  articleRef?: Ref<HTMLElement>;
  /** The person’s brand kit; rendered as a byline when the design allows it. */
  brand?: BrandKit | null;
}

/** Avatar, name and handle: who this image is from. */
function Byline({ brand, position, align, divider }: { brand: BrandKit; position: "top" | "bottom"; align: Design["bylineAlign"]; divider: boolean }) {
  return <div className={`card-byline byline-${position} byline-align-${align}${divider ? " has-divider" : ""}`}>
    {/* The avatar is a local data URL, rendered as-is in preview and export. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {brand.avatar && <img src={brand.avatar} alt="" width={64} height={64} />}
    <span>{brand.name && <strong>{brand.name}</strong>}{brand.handle && <em>{brand.handle}</em>}</span>
  </div>;
}

export const CaptureCard = memo(function CaptureCard({ markdown, design, assetUrls, label = "", articleRef, brand }: CaptureProps) {
  const byline = hasBrand(brand) && design.byline !== "none" ? design.byline : null;
  const preset = presetFor(design);
  const theme = themeFor(design.theme);
  const accent = readableAccent(design.accent, theme.background);
  const framed = design.frame !== "none";
  const style = {
    "--card-accent": accent, "--card-on-accent": foregroundOn(accent),
    "--card-bg": theme.background, "--card-ink": theme.color,
    "--card-padding": `${design.padding}px`, "--card-scale": design.fontScale / 100,
    "--image-max-height": `${design.imageMaxHeight}px`,
    width: preset.width, height: preset.height ?? undefined,
    backgroundColor: framed ? undefined : theme.background, color: theme.color,
  } as CSSProperties;
  const source = useMemo(() => normalizeMathDelimiters(markdown), [markdown]);
  const wantsMath = hasMath(source);
  const [, setMathReady] = useState(Boolean(mathPlugins));
  const [mathError, setMathError] = useState(false);
  useEffect(() => {
    if (!wantsMath || mathPlugins) return;
    let active = true;
    loadMath().then(() => { if (active) setMathReady(true); }, () => { if (active) setMathError(true); });
    return () => { active = false; };
  }, [wantsMath]);
  const math = wantsMath ? mathPlugins : null;
  // One macro table per document: \newcommand in one formula works in the formulas after it.
  // `source` is a deliberate dependency: each new document gets a fresh macro table.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rehypePlugins = useMemo(() => [...(math ? [[math.katex, { macros: {}, globalGroup: true, strict: "ignore" }]] : []), rehypeDisplayHeadings, ...(design.smartTypography ? [rehypeSmartTypography] : [])], [math, design.smartTypography, source]);
  // A display formula wider than the card is set smaller to fit, as a typesetter would, down to
  // MIN_FORMULA_SCALE. Runs before measurement and export, and again once the math fonts load.
  const content = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = content.current;
    if (!root || !math) return;
    const fit = () => {
      for (const display of root.querySelectorAll<HTMLElement>(".katex-display")) {
        const formula = display.firstElementChild as HTMLElement | null;
        if (!formula) continue;
        formula.style.fontSize = "";
        const overflow = display.scrollWidth / Math.max(1, display.clientWidth);
        if (overflow > 1.001) formula.style.fontSize = Math.max(MIN_FORMULA_SCALE, 1 / overflow * .99) * 1.1 + "em";
      }
    };
    fit();
    let active = true;
    void document.fonts?.ready.then(() => { if (active) fit(); });
    return () => { active = false; };
  });
  const body = <>
    {design.showHeader && <div className="card-rule"><span className="card-rule-mark" /><span>Markdown / Picture</span><span>{label}</span></div>}
    {byline === "top" && <Byline brand={brand!} position="top" align={design.bylineAlign} divider={design.bylineDivider} />}
    {wantsMath && !math && (mathError
      ? <span className="capture-error" data-capture-error="The math renderer could not load. Check your connection and try again.">Math could not load · check your connection</span>
      : <span hidden data-capture-pending="math" />)}
    <div className="capture-content" ref={content}>
      <ReactMarkdown remarkPlugins={math?.remark ?? basePlugins} rehypePlugins={rehypePlugins as Plugins}
        urlTransform={url => url.startsWith("asset:") ? assetUrls[url.slice(6)] ?? "" : defaultUrlTransform(url)}
        components={{
          img: props => <MarkdownImage key={String(props.src)} {...props} />,
          pre: ({ children }) => <CodeBlock dark={theme.dark}>{children}</CodeBlock>,
          a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
        }}>
        {source}
      </ReactMarkdown>
    </div>
    {byline === "bottom" && <Byline brand={brand!} position="bottom" align={design.bylineAlign} divider={design.bylineDivider} />}
    {design.showBrand && <div className="card-brand"><span className="card-brand-mark" />Made with MarkdownPic</div>}
    {design.watermarkText && <div className={`card-watermark watermark-${design.watermarkPosition}`} style={{ opacity: design.watermarkOpacity / 100 }}>{design.watermarkText}</div>}
  </>;
  return <article ref={articleRef} className={`capture-card theme-${design.theme} font-${design.fontFamily}${theme.dark ? " is-dark" : ""}${framed ? " has-frame frame-" + design.frame : ""}${design.textAlign === "center" ? " align-center" : ""}`} style={style}>
    {framed ? <div className="card-sheet">{body}</div> : body}
  </article>;
});