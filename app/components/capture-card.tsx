"use client";

import { isValidElement, memo, useEffect, useState, type CSSProperties, type ImgHTMLAttributes, type ReactNode, type Ref } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { foregroundOn, presetFor, readableAccent, themeFor, type Design } from "@/lib/studio-model";

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

function CodeBlock({ children, dark }: { children?: ReactNode; dark: boolean }) {
  if (isValidElement<{ className?: string; children?: ReactNode }>(children) && children.props.className?.split(" ").includes("language-mermaid")) {
    const source = String(children.props.children).replace(/\n$/, "");
    return <Diagram key={`${dark}:${source}`} source={source} dark={dark} />;
  }
  const language = isValidElement<{ className?: string }>(children) ? children.props.className?.replace("language-", "") : "";
  return <div className="code-block"><div className="code-chrome" aria-hidden="true"><i /><i /><i />{language && <span>{language}</span>}</div><pre>{children}</pre></div>;
}

export interface CaptureProps {
  markdown: string;
  design: Design;
  assetUrls: Record<string, string>;
  label?: string;
  articleRef?: Ref<HTMLElement>;
}

export const CaptureCard = memo(function CaptureCard({ markdown, design, assetUrls, label = "", articleRef }: CaptureProps) {
  const preset = presetFor(design);
  const theme = themeFor(design.theme);
  const accent = readableAccent(design.accent, theme.background);
  const style = {
    "--card-accent": accent, "--card-on-accent": foregroundOn(accent),
    "--card-bg": theme.background, "--card-ink": theme.color,
    "--card-padding": `${design.padding}px`, "--card-scale": design.fontScale / 100,
    "--image-max-height": `${design.imageMaxHeight}px`,
    width: preset.width, height: preset.height ?? undefined,
    backgroundColor: theme.background, color: theme.color,
  } as CSSProperties;
  return <article ref={articleRef} className={`capture-card theme-${design.theme} font-${design.fontFamily}${theme.dark ? " is-dark" : ""}`} style={style}>
    {design.showHeader && <div className="card-rule"><span className="card-rule-mark" /><span>Markdown / Picture</span><span>{label}</span></div>}
    <div className="capture-content">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}
        urlTransform={url => url.startsWith("asset:") ? assetUrls[url.slice(6)] ?? "" : defaultUrlTransform(url)}
        components={{
          img: props => <MarkdownImage key={String(props.src)} {...props} />,
          pre: ({ children }) => <CodeBlock dark={theme.dark}>{children}</CodeBlock>,
          a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
        }}>
        {markdown}
      </ReactMarkdown>
    </div>
    {design.showBrand && <div className="card-brand"><span className="card-brand-mark" />Made with MarkdownPic</div>}
    {design.watermarkText && <div className={`card-watermark watermark-${design.watermarkPosition}`} style={{ opacity: design.watermarkOpacity / 100 }}>{design.watermarkText}</div>}
  </article>;
});
