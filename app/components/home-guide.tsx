import { CaptureCard } from "./capture-card";
import { AdSlot } from "./ad-slot";
import { Icon } from "./icons";
import { SiteFooter } from "./info-shell";
import { splitMarkdownPages } from "@/lib/markdown-document";
import { defaultDesign, presetFor } from "@/lib/studio-model";
import { templateDesign, templates } from "@/lib/templates";

const GALLERY = ["quote", "steps", "math", "release"];
const GALLERY_WIDTH = 248;

const features = [
  { title: "Private by design", text: "Your Markdown and images are rendered on your device and saved in this browser. Nothing is uploaded to an account." },
  { title: "Math and diagrams", text: "KaTeX formulas and Mermaid flowcharts render as crisp vector art, then export at 1×, 2×, or 3×." },
  { title: "Carousels that fit", text: "Auto split measures real content and breaks pages at safe boundaries — headings stay with their paragraphs." },
  { title: "What you see is the file", text: "Every export is checked for clipped or missing content first. The result screen shows the actual image." },
  { title: "Images without clutter", text: "Paste or drop PNG, JPEG, or WebP. The source keeps a short reference instead of a wall of base64." },
  { title: "Portable projects", text: "Back up a project as one .mdpic file — Markdown, styles, and images — and restore it anywhere." },
];

const faq = [
  { q: "How do I convert Markdown to an image?", a: "Paste or type Markdown in the editor, pick a canvas and theme under Customize, then choose Export PNG. JPEG and WebP are under Options." },
  { q: "Is MarkdownPic free?", a: "Yes. It is free to use without an account and is supported by clearly labelled ads that never appear inside your image." },
  { q: "Are my notes uploaded?", a: "No. Rendering and export happen in your browser, and drafts are stored locally on your device. Back up important work as a .mdpic file." },
  { q: "Which Markdown features are supported?", a: "GitHub Flavored Markdown — headings, emphasis, lists, task lists, tables, quotes, and code — plus KaTeX math and Mermaid diagrams." },
  { q: "Can I make an Instagram or LinkedIn carousel?", a: "Yes. Switch to Pages, choose Square, Portrait, or Story, and use Auto split. Multiple pages download as a ZIP with your Markdown source." },
];

export function HomeGuide() {
  return <div className="home-guide">
    <section className="guide-hero" aria-labelledby="gallery-title">
      <p className="eyebrow">Made with MarkdownPic</p>
      <h2 id="gallery-title">Plain text in. <em>A picture worth sharing</em> out.</h2>
      <p className="guide-lede">Every card below is plain Markdown. Pick one to open it in the editor and make it yours.</p>
      <div className="gallery">{GALLERY.map(id => {
        const template = templates.find(item => item.id === id)!;
        const design = templateDesign(defaultDesign, template);
        const preset = presetFor(design);
        const scale = GALLERY_WIDTH / preset.width;
        return <a key={id} className="gallery-item" href={"#use-" + id}>
          <span className="gallery-frame" style={{ width: GALLERY_WIDTH, height: Math.round((preset.height ?? preset.width) * scale) }} aria-hidden="true"><span style={{ transform: `scale(${scale})` }}><CaptureCard markdown={splitMarkdownPages(template.markdown)[0].markdown} design={design} assetUrls={{}} /></span></span>
          <span className="gallery-caption"><strong>{template.name}</strong><span>{preset.label} · Open template<Icon name="arrow" size={14} /></span></span>
        </a>;
      })}</div>
    </section>

    <section className="guide-steps" aria-labelledby="how-title">
      <h2 id="how-title">Markdown to image in three steps</h2>
      <ol>
        <li><span>01</span><strong>Write or paste</strong><p>Type Markdown, open a .md file, or start from a template. Drop images straight into the editor.</p></li>
        <li><span>02</span><strong>Shape the canvas</strong><p>Choose Auto height, Square, Portrait, Story, or Landscape. Set the theme, accent, typeface, and spacing.</p></li>
        <li><span>03</span><strong>Export and share</strong><p>Download PNG, JPEG, or WebP up to 3× resolution — or a ZIP of every page for a carousel.</p></li>
      </ol>
    </section>

    <section className="guide-features" aria-labelledby="features-title">
      <h2 id="features-title">Built for words that matter</h2>
      <div className="feature-grid">{features.map(item => <div key={item.title}><h3>{item.title}</h3><p>{item.text}</p></div>)}</div>
    </section>

    <AdSlot slot="inline" className="guide-ad" />

    <section className="guide-faq" aria-labelledby="faq-title">
      <h2 id="faq-title">Questions</h2>
      {faq.map(item => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}
    </section>
    <SiteFooter />
  </div>;
}
