import type { ReactNode } from "react";

/** Task guides: each one documents a real workflow in the tool and opens the matching template. */
export interface Guide { slug: string; title: string; description: string; template: string; summary: string; body: ReactNode }

const Code = ({ children }: { children: string }) => <pre><code>{children}</code></pre>;

export const guides: Guide[] = [
  {
    slug: "markdown-to-image",
    title: "How to convert Markdown to an image (PNG, JPEG or WebP)",
    description: "Turn Markdown into a clean PNG, JPEG or WebP in your browser: choose a long image, a fixed-size card or a carousel, set the resolution, and export.",
    template: "note",
    summary: "The complete workflow: write, choose an output, export at the right resolution.",
    body: <>
      <p>MarkdownPic renders Markdown on your own device and saves the result as an image. Nothing is uploaded. The same renderer draws the preview and the exported file, so what you see is what you get.</p>
      <h2>1. Write or paste your Markdown</h2>
      <p>Type in the editor, paste from a note app, or use <strong>Open file</strong> for a <code>.md</code>, <code>.markdown</code> or <code>.txt</code> file. Headings, emphasis, lists, task lists, tables, quotes, code blocks, KaTeX math and Mermaid diagrams are supported. Raw HTML is not rendered.</p>
      <h2>2. Choose what kind of image you need</h2>
      <ul>
        <li><strong>Long image</strong>: one image that grows with your content. Best for notes, articles and documentation excerpts.</li>
        <li><strong>Card</strong>: one fixed canvas, Square (1080 × 1080), Portrait (1080 × 1350), Story (1080 × 1920) or Landscape (1200 × 630) at 2×.</li>
        <li><strong>Pages</strong>: several fixed canvases for a carousel, exported together as a ZIP.</li>
      </ul>
      <h2>3. Style it</h2>
      <p>Open <strong>Customize</strong> to choose one of eight themes, an accent color, a sans, serif or mono typeface, text size and padding. Text contrast is adjusted automatically so accent-colored words stay readable on every theme.</p>
      <h2>4. Export</h2>
      <p>Choose <strong>Export PNG</strong>. The <strong>···</strong> menu next to it sets the format and resolution:</p>
      <ul>
        <li><strong>PNG</strong> keeps text perfectly sharp and can be copied to the clipboard.</li>
        <li><strong>JPEG</strong> is smaller for photo-heavy images.</li>
        <li><strong>WebP</strong> is compact but limited to 16,383 pixels per side.</li>
        <li><strong>1×, 2× or 3×</strong> sets the pixel density. 2× suits most screens; 3× is for print or zooming in.</li>
      </ul>
      <p>Before anything downloads, every page is checked for clipped, overflowing or missing content. If something does not fit, the export stops and tells you which page needs attention.</p>
      <h2>Copy instead of download</h2>
      <p>The copy button beside Export renders a PNG and puts it on the clipboard, ready to paste into a chat, email or document. In Pages mode it copies the current page.</p>
    </>,
  },
  {
    slug: "long-image",
    title: "Export a high-resolution long image from Markdown",
    description: "Create one tall, sharp image from a long Markdown document: Long image mode, 3× resolution, the real size limits per browser, and what to do when a file is too large.",
    template: "note",
    summary: "One tall, sharp image from a long document, and the limits that apply.",
    body: <>
      <p>A long image keeps a whole document in a single file, which is easier to share in chat apps than a carousel. MarkdownPic measures your content and sizes the image to fit it exactly.</p>
      <h2>Three steps</h2>
      <ol>
        <li>Select <strong>Long image</strong> in the preview toolbar. The canvas is 600 logical pixels wide and grows with your content.</li>
        <li>Open the <strong>···</strong> menu beside Export and choose <strong>3×</strong> for an 1800-pixel-wide file, or 2× for 1200 pixels.</li>
        <li>Choose <strong>Export PNG</strong>. The preview corner shows the final pixel size before you export.</li>
      </ol>
      <h2>How long can it be?</h2>
      <p>Browsers limit how large an image they can draw. MarkdownPic tests the browser you are using before it renders:</p>
      <ul>
        <li>On desktop Chrome, Edge and Firefox, images can be up to 32,767 pixels on each side and 120 megapixels.</li>
        <li>Elsewhere, including most phones, the limit is 16,384 pixels per side and 24 megapixels.</li>
        <li>WebP files are limited to 16,383 pixels per side by the format itself. Use PNG or JPEG for very long images.</li>
      </ul>
      <p>For example, at 3× (1800 pixels wide) a desktop browser can export an image up to 32,767 pixels tall, which holds roughly 3,000 to 4,000 words of plain text at the default size. At 2× it holds about half as much again.</p>
      <h2>If the image is too large</h2>
      <ul>
        <li>Use 2× instead of 3×. Text at 2× is still crisp on phones and most screens.</li>
        <li>Lower <strong>Image text size</strong> in Customize to fit more text per pixel.</li>
        <li>Switch to <strong>Pages</strong> and use <strong>Auto split</strong> to divide the document into fixed-size images.</li>
      </ul>
      <h2>Keeping long images readable</h2>
      <p>Use headings every few paragraphs so readers can scan. Keep tables narrow; a long image is still only 600 logical pixels wide. Large images inside the document are limited by <strong>Maximum image height</strong> in Customize.</p>
    </>,
  },
  {
    slug: "markdown-table-to-image",
    title: "Turn a Markdown table into an image",
    description: "Export a GitHub-flavored Markdown table as a readable PNG: table syntax, alignment, line breaks in cells, and how to fix tables that are too wide.",
    template: "table",
    summary: "Pipe-table syntax, alignment, and fixes for wide tables.",
    body: <>
      <p>Tables are hard to share as text: chat apps and social posts break the columns. Rendering the table as an image keeps rows and columns intact.</p>
      <h2>Table syntax</h2>
      <p>MarkdownPic supports GitHub-flavored Markdown pipe tables. The second line separates the header from the body:</p>
      <Code>{"| Format | Best for | Trade-off |\n| :--- | :--- | ---: |\n| PNG | Text and diagrams | Larger file |\n| JPEG | Photos | Lossy |"}</Code>
      <p>Colons set alignment: <code>:---</code> left, <code>:---:</code> center, <code>---:</code> right. Every row should have the same number of cells. A table without the separator line is shown as plain text.</p>
      <h2>Line breaks and special characters in cells</h2>
      <ul>
        <li>A cell cannot contain a real line break. Keep cells short, or split long text into another row.</li>
        <li>To show a literal pipe inside a cell, escape it as <code>\|</code>.</li>
        <li>Inline formatting such as <code>**bold**</code>, <code>`code`</code> and links works inside cells.</li>
      </ul>
      <h2>When a table is too wide</h2>
      <p>Columns share the canvas width and long words wrap. If a table still cannot fit, export stops with “A table, formula, or diagram is too wide” rather than cutting it off. To fix it:</p>
      <ul>
        <li>Choose <strong>Landscape</strong> or Long image, which are wider than portrait cards.</li>
        <li>Reduce <strong>Image text size</strong> or <strong>Canvas padding</strong> in Customize.</li>
        <li>Shorten headers, or move a long column into a note under the table.</li>
      </ul>
      <h2>Making tables easy to read</h2>
      <p>The header row uses your accent color, and body rows alternate a subtle tint. Put the column people compare first, keep numbers right-aligned, and add one sentence under the table that states the takeaway.</p>
    </>,
  },
  {
    slug: "mermaid-to-png",
    title: "Convert a Mermaid diagram to PNG",
    description: "Render Mermaid flowcharts, sequence diagrams and more to a PNG in your browser, with syntax examples and fixes for diagrams that do not render.",
    template: "diagram",
    summary: "Write a Mermaid block, preview it, and export a crisp diagram.",
    body: <>
      <p>Mermaid draws diagrams from text. MarkdownPic renders any fenced code block marked <code>mermaid</code> as a diagram, then exports it with the rest of your Markdown.</p>
      <h2>A minimal flowchart</h2>
      <Code>{"~~~mermaid\nflowchart TD\n  A[Write] --> B[Preview]\n  B --> C{Ready?}\n  C -->|Yes| D[Export]\n  C -->|Not yet| A\n~~~"}</Code>
      <p>Use three backticks or three tildes, and put <code>mermaid</code> right after the opening fence. Text before and after the block becomes the caption and explanation around the diagram.</p>
      <h2>Other diagram types</h2>
      <p>Sequence diagrams (<code>sequenceDiagram</code>), class diagrams, state diagrams, Gantt charts, pie charts and mind maps also work, using standard Mermaid syntax. Dark themes switch the diagram to Mermaid’s dark palette automatically.</p>
      <h2>If the diagram does not render</h2>
      <ul>
        <li><strong>“This Mermaid diagram has a syntax error”</strong>: check arrows (<code>--&gt;</code>), brackets and quotes. Labels containing parentheses or special characters need quotes, for example <code>{'A["Plan (draft)"]'}</code>.</li>
        <li><strong>The diagram is too wide</strong>: use <code>flowchart TD</code> (top to bottom) instead of <code>LR</code>, shorten labels, or choose a wider canvas.</li>
        <li><strong>Nothing appears at first</strong>: the diagram engine loads the first time you use a diagram. Export waits until every diagram has finished rendering.</li>
      </ul>
      <p>For safety, diagrams render in Mermaid’s strict mode: click handlers and embedded HTML are disabled.</p>
      <h2>Getting a sharp result</h2>
      <p>Diagrams are vector graphics, so a 2× or 3× export stays crisp at any zoom. Export as PNG to keep thin lines and small labels clean.</p>
    </>,
  },
  {
    slug: "latex-math-to-image",
    title: "Render LaTeX math from Markdown as an image",
    description: "Write inline and display LaTeX formulas in Markdown and export them as a PNG with KaTeX: syntax, common errors, and tips for readable equations.",
    template: "math",
    summary: "Inline and display formulas with KaTeX, and why some math does not render.",
    body: <>
      <p>MarkdownPic renders math with KaTeX, the same typesetting used by many documentation sites. Formulas are drawn as real text, so they stay sharp at 3×.</p>
      <h2>Inline and display math</h2>
      <p>Wrap inline math in single dollar signs: <code>$E = mc^2$</code>. For a centered, larger formula, put double dollar signs on their own lines:</p>
      <Code>{"$$\nA = P(1 + r)^t\n$$"}</Code>
      <p>Writing <code>$$...$$</code> on a single line inside a paragraph produces inline math, not a centered block.</p>
      <h2>Common reasons math does not render</h2>
      <ul>
        <li><strong>Unsupported commands</strong>: KaTeX covers most of standard LaTeX math, but not every package. Unknown commands appear in red inside the formula.</li>
        <li><strong>Prices and currency</strong>: two dollar amounts in one paragraph can be read as a formula. Escape them as <code>\$5</code>.</li>
        <li><strong>A formula that is too wide</strong> stops the export. Break it across lines with <code>\\</code> inside an <code>aligned</code> environment, or choose a wider canvas.</li>
      </ul>
      <h2>Readable equations</h2>
      <p>Put the formula first and explain each variable in a short list underneath, as the Formula template does. The serif typeface pairs well with math for an academic look.</p>
    </>,
  },
  {
    slug: "code-to-image",
    title: "Share code snippets as images",
    description: "Turn a code snippet and its explanation into a clean, readable image: fenced code blocks, language labels, long lines, and themes that work for code.",
    template: "code",
    summary: "Code blocks with context, language labels and long-line handling.",
    body: <>
      <p>A screenshot of an editor shows code without the reason it matters. A Markdown card lets you put the explanation, the snippet and the takeaway in one image.</p>
      <h2>Fenced code blocks</h2>
      <Code>{"~~~javascript\nfunction readingMinutes(words) {\n  return Math.max(1, Math.ceil(words / 200));\n}\n~~~"}</Code>
      <p>The word after the opening fence appears as a label in the code block’s title bar. Inline code uses single backticks: <code>`npm install`</code>.</p>
      <h2>Long lines</h2>
      <p>Code wraps at the canvas edge instead of being cut off, so nothing is lost. For the cleanest result, keep lines under about 60 characters on a 600-pixel canvas, or lower the image text size. Tabs are shown two spaces wide.</p>
      <h2>Choosing a theme for code</h2>
      <ul>
        <li><strong>Midnight</strong> and <strong>Ink</strong> are dark themes with a deeper code panel.</li>
        <li><strong>Clean</strong> is best for printed documentation.</li>
        <li>The <strong>Mono</strong> typeface sets the whole card in Geist Mono for a technical look.</li>
      </ul>
      <h2>Explain, don’t just show</h2>
      <p>Lead with what the code does in one sentence, show the smallest snippet that proves it, and end with the one detail readers should remember. Bold text uses your accent color, which is useful for calling out a return value or a gotcha.</p>
    </>,
  },
  {
    slug: "markdown-carousel",
    title: "Make an Instagram or LinkedIn carousel from Markdown",
    description: "Create a multi-page carousel from one Markdown document: page breaks, Auto split, portrait and square sizes, per-page styles, and ZIP export.",
    template: "carousel",
    summary: "Page breaks, Auto split, sizes for each platform, and ZIP export.",
    body: <>
      <p>Carousels turn one idea into a short sequence of slides. With MarkdownPic you write the whole sequence as one Markdown document and export every slide at once.</p>
      <h2>Mark the page breaks</h2>
      <p>Put <code>{"<!-- page -->"}</code> on its own line wherever a new slide should start:</p>
      <Code>{"# One idea, three frames\n\n<!-- page -->\n\n# Show the reasoning\n\n<!-- page -->\n\n# Make it actionable"}</Code>
      <p>Opening a file that contains page markers starts in Pages mode. Markers inside code blocks are treated as code.</p>
      <h2>Or let Auto split do it</h2>
      <p><strong>Auto split</strong> measures your real content against the canvas and finds safe breaks. Headings stay with the paragraph that follows them, and long lists and tables split between items. If a single block is taller than a page, such as a large image or formula, it tells you instead of cutting it. Undo restores the original layout.</p>
      <h2>Sizes for each platform</h2>
      <ul>
        <li><strong>Portrait</strong> (1080 × 1350) fills the most space in Instagram and LinkedIn feeds.</li>
        <li><strong>Square</strong> (1080 × 1080) is the safe choice everywhere.</li>
        <li><strong>Story</strong> (1080 × 1920) is for full-screen stories.</li>
      </ul>
      <h2>Style one page differently</h2>
      <p>In Customize, choose <strong>This page only</strong> to give the cover or the last slide its own theme or size. Page styles stay in place when you change the project default.</p>
      <h2>Export</h2>
      <p>Export saves every page as numbered images in a ZIP, together with <code>source.md</code> so you can edit the carousel later. To export or copy a single slide, use Pages → Current page only in the export options.</p>
    </>,
  },
];

export const guideFor = (slug: string) => guides.find(guide => guide.slug === slug);
