import Link from "next/link";
import type { Guide } from "./guides";

const Code = ({ children }: { children: string }) => <pre><code>{children}</code></pre>;

/** Task guides added October 2026. Each one documents a real workflow in the tool; none repeats another. */
export const moreGuides: Guide[] = [
  {
    slug: "chatgpt-to-image",
    group: "Sources",
    title: "Turn a ChatGPT or Claude answer into an image",
    description: "Copy an answer from ChatGPT, Claude or Gemini and turn it into a clean image, with its headings, tables, code and math intact.",
    template: "note",
    summary: "Paste an AI answer and keep its structure, tables and formulas.",
    body: <>
      <p>AI assistants answer in Markdown, which is exactly what MarkdownPic renders. An answer that looks cramped in a chat window becomes a readable card or long image you can share.</p>
      <h2>Copy the answer the right way</h2>
      <ul>
        <li>Use the assistant’s own <strong>copy</strong> button. It copies the Markdown source, so headings, lists, tables and code blocks arrive exactly as written.</li>
        <li>If you select the text with the mouse instead, MarkdownPic converts the formatted text back into Markdown when you paste.</li>
        <li>Paste with <strong>Ctrl/⌘ Shift V</strong> when you want plain text without any formatting.</li>
      </ul>
      <h2>Formulas render as math</h2>
      <p>ChatGPT, Claude and Gemini write math as <code>{"\\( … \\)"}</code> inline and <code>{"\\[ … \\]"}</code> for display formulas. MarkdownPic recognizes both and renders them with KaTeX, the same as <code>$…$</code> and <code>$$…$$</code>. Code blocks are left untouched.</p>
      <h2>Make long answers readable</h2>
      <ul>
        <li>Choose <strong>Long image</strong> for a full answer, or <strong>Pages</strong> and <strong>Auto split</strong> to turn it into a carousel.</li>
        <li>Delete the parts your reader does not need before exporting; an image is read in seconds.</li>
        <li>Keep tables to three or four columns, or choose a wider canvas.</li>
      </ul>
      <h2>Be clear about the source</h2>
      <p>If you share AI-generated content, say so in the text or caption. Check facts, numbers and code before publishing; the image will be read as your statement.</p>
    </>,
  },
  {
    slug: "markdown-to-png",
    group: "Formats",
    title: "Markdown to PNG: sharp text at any resolution",
    description: "Export Markdown as a PNG with crisp text, choose 1×, 2× or 3× resolution, and copy the PNG straight to the clipboard.",
    template: "note",
    summary: "Why PNG is the default for text, and how to pick the resolution.",
    body: <>
      <p>PNG is lossless: every pixel of every letter is stored exactly. That keeps small text, thin table lines and code sharp, which is why it is the default format in MarkdownPic.</p>
      <h2>Export a PNG</h2>
      <ol>
        <li>Write or paste your Markdown and choose Long image, Card or Pages.</li>
        <li>Open the <strong>···</strong> menu beside Export and keep <strong>PNG</strong> selected.</li>
        <li>Choose the resolution, then <strong>Export PNG</strong> and <strong>Download</strong>.</li>
      </ol>
      <h2>Which resolution?</h2>
      <ul>
        <li><strong>1×</strong>: the smallest file. Fine for quick previews, blurry on high-density screens.</li>
        <li><strong>2×</strong>: the recommended default. A Long image is 1200 pixels wide and stays sharp on phones and laptops.</li>
        <li><strong>3×</strong>: 1800 pixels wide for print, zooming in, or very small text.</li>
      </ul>
      <p>The preview corner shows the exact pixel size before you export.</p>
      <h2>Copy instead of saving</h2>
      <p>The copy button beside Export places a PNG on the clipboard, ready to paste into chat apps, documents and social posts. Nothing is saved to disk.</p>
      <h2>PNG or something else?</h2>
      <p>Choose JPEG when the image is mostly photos and file size matters, and WebP when the destination supports it and you want the smallest file. For text, PNG is the safe choice almost everywhere.</p>
    </>,
  },
  {
    slug: "markdown-to-jpg",
    group: "Formats",
    title: "Markdown to JPEG: smaller files for photo-heavy images",
    description: "When to export Markdown as JPEG instead of PNG, what quality to expect, and how to keep text readable in a JPEG image.",
    template: "note",
    summary: "When JPEG makes sense, and how to keep its text clean.",
    body: <>
      <p>JPEG compresses images by discarding detail the eye rarely notices in photographs. For cards that contain photos, it can produce noticeably smaller files than PNG.</p>
      <h2>When to choose JPEG</h2>
      <ul>
        <li>The image includes large photos you inserted with <strong>Add image</strong>.</li>
        <li>A platform or form limits the upload size.</li>
        <li>The destination does not accept PNG or WebP.</li>
      </ul>
      <p>For text-only cards, PNG is usually as small or smaller and keeps edges perfectly sharp.</p>
      <h2>Export a JPEG</h2>
      <ol>
        <li>Open the <strong>···</strong> menu beside Export and choose <strong>JPEG</strong>.</li>
        <li>Pick 2× for most uses. The Export button now reads <strong>Export JPEG</strong>.</li>
        <li>Check the result at full size with <strong>Open in a new tab</strong>, then download it.</li>
      </ol>
      <p>MarkdownPic encodes JPEGs at high quality, which keeps compression artifacts around text faint.</p>
      <h2>Keep text readable</h2>
      <ul>
        <li>Prefer themes with solid backgrounds; fine gradients show banding in JPEG.</li>
        <li>Avoid very small text sizes, where compression is most visible.</li>
        <li><strong>Copy image</strong> still works: MarkdownPic converts the image to PNG for the clipboard.</li>
      </ul>
    </>,
  },
  {
    slug: "quote-card-maker",
    group: "Content",
    title: "Make a quote card from text",
    description: "Turn a quote into a typographic image card: serif type, curly quotation marks, a balanced layout and your name, in under a minute.",
    template: "quote",
    summary: "Typography, sizing and attribution for quote images.",
    body: <>
      <p>A good quote card is mostly typography: one strong sentence, generous space, and a clear attribution. The Quote template starts there.</p>
      <h2>Write it as Markdown</h2>
      <Code>{"# Clarity is a form of respect.\n\nGive the reader the conclusion, the reason, and enough space to think.\n\n— **Your name**"}</Code>
      <p>The heading is the quote; a short line under it adds context; the bold name uses your accent color.</p>
      <h2>Details that make it look designed</h2>
      <ul>
        <li>The <strong>Noir</strong> theme (serif on warm black, with gold) or <strong>Editorial</strong> (serif headlines on cream) give a quote an editorial feel; <strong>Swiss</strong> makes it a bold poster.</li>
        <li>Straight quotes and dashes become typographic quotation marks and em dashes automatically.</li>
        <li>On a fixed canvas, the text is balanced vertically. Use <strong>Fit text</strong> to pick the largest size that still fits.</li>
        <li>Add a <strong>Frame</strong> in Customize to set the card on a gradient backdrop.</li>
      </ul>
      <h2>Attribution and your brand</h2>
      <p>Quote people accurately and name them. To sign every card you make, set up <strong>My brand</strong> in Customize; your avatar and handle appear on each image.</p>
      <h2>Many quotes at once</h2>
      <p>Put one quote per row in a spreadsheet and use <Link href="/guides/csv-to-images">batch generation</Link> to create a card for each.</p>
    </>,
  },
  {
    slug: "social-media-image-sizes",
    group: "Platforms & sizes",
    title: "Social media image sizes for text posts",
    description: "Which canvas to use for Instagram, LinkedIn, X, YouTube thumbnails, Xiaohongshu and link previews, with exact pixel sizes.",
    template: "steps",
    summary: "The right canvas for each platform, with exact pixel sizes.",
    body: <>
      <p>Every platform crops and scales images differently. Choosing the right canvas before you design saves the edges of your text from being cut off. Sizes below are at the default 2× resolution.</p>
      <h2>Canvas sizes in MarkdownPic</h2>
      <ul>
        <li><strong>Square</strong>, 1080 × 1080: safe everywhere; Instagram and LinkedIn feeds.</li>
        <li><strong>Portrait</strong>, 1080 × 1350 (4:5): the tallest image Instagram shows in the feed; strong for LinkedIn too.</li>
        <li><strong>Tall 3:4</strong>, 1080 × 1440: the common shape for Xiaohongshu posts.</li>
        <li><strong>Story</strong>, 1080 × 1920 (9:16): Instagram and Facebook Stories, full-screen vertical posts.</li>
        <li><strong>Wide 16:9</strong>, 1280 × 720: YouTube thumbnails, slides, and wide images on X.</li>
        <li><strong>Landscape</strong>, 1200 × 630: link previews on X, LinkedIn, Facebook and Slack.</li>
        <li><strong>Long image</strong>, 1200 wide: one tall image for chat apps and articles.</li>
      </ul>
      <h2>Choose the size</h2>
      <p>Open <strong>Card</strong> or <strong>Pages</strong>, then choose the canvas in <strong>Customize → Canvas size</strong>. The preview shows the exact output size in the corner.</p>
      <h2>Keep text inside the safe area</h2>
      <ul>
        <li>Leave generous padding; some apps overlay buttons near the edges.</li>
        <li>On Stories, keep important text away from the top and bottom fifth.</li>
        <li>If text overflows, use <strong>Fit text</strong> or split it into pages.</li>
      </ul>
      <p>Platforms change their recommendations from time to time; check the platform’s own help pages for the latest specifications.</p>
    </>,
  },
  {
    slug: "open-graph-image",
    group: "Platforms & sizes",
    title: "Create a social preview (Open Graph) image from text",
    description: "Make a 1200 × 630 link-preview image for your article, project or page, and add it with the og:image tag.",
    template: "note",
    summary: "A 1200 × 630 preview image for links you share.",
    body: <>
      <p>When a link is shared on X, LinkedIn, Slack or Facebook, the platform shows the page’s Open Graph image. A clear title card makes the link far more likely to be noticed.</p>
      <h2>Design it</h2>
      <ol>
        <li>Choose <strong>Card</strong>, then <strong>Customize → Canvas size → Landscape</strong> (1200 × 630 at 2×).</li>
        <li>Write a short heading, the title of your page, and one line of context.</li>
        <li>Use a strong theme and <strong>Fit text</strong> so the title fills the card. Add your byline from <strong>My brand</strong> if you want your name on it.</li>
      </ol>
      <Code>{"# Small changes compound\n\nWhat a year of 1% improvements looked like."}</Code>
      <h2>Add it to your page</h2>
      <p>Export as PNG, upload the image with your page, and reference it in the page’s <code>{"<head>"}</code>:</p>
      <Code>{"<meta property=\"og:image\" content=\"https://example.com/preview.png\" />\n<meta property=\"og:image:width\" content=\"1200\" />\n<meta property=\"og:image:height\" content=\"630\" />\n<meta name=\"twitter:card\" content=\"summary_large_image\" />"}</Code>
      <h2>Tips</h2>
      <ul>
        <li>Keep the title large; previews are often shown at a few hundred pixels wide.</li>
        <li>Avoid text near the edges; some platforms crop slightly.</li>
        <li>Platforms cache previews. After changing the image, use the platform’s preview or debugging tool to refresh it.</li>
      </ul>
    </>,
  },
  {
    slug: "csv-to-images",
    group: "Workflows",
    title: "Generate images from a spreadsheet or CSV",
    description: "Make one image per row of a spreadsheet: design a template with {{placeholders}}, paste your rows, and export every image as a ZIP.",
    template: "quote",
    summary: "One template, one image per row, exported together.",
    body: <>
      <p>Batch generation turns a table into a set of images that share one design: quotes, product highlights, event speakers, tips of the day. You design once and fill the rest from your data.</p>
      <h2>1. Make a template</h2>
      <p>Write the page as usual and put column names in double braces where values should go:</p>
      <Code>{"# {{quote}}\n\n— **{{author}}**  ·  {{n}}/{{total}}"}</Code>
      <p><code>{"{{n}}"}</code> is the row number and <code>{"{{total}}"}</code> the number of rows. Without any placeholders, each row simply becomes the whole text of a card.</p>
      <h2>2. Add your rows</h2>
      <p>Open the <strong>···</strong> menu beside Export and choose <strong>Create a batch from a table</strong>. Copy rows from Excel or Google Sheets and paste them, or open a CSV file. The first row should contain the column names.</p>
      <ul>
        <li>Tab-, comma- and semicolon-separated files are detected automatically.</li>
        <li>Quoted cells may contain commas and line breaks.</li>
        <li>Up to 100 rows are used per batch.</li>
      </ul>
      <h2>3. Check and export</h2>
      <p>Step through the preview to check long rows. Choose a column for file names, then <strong>Export</strong> and download every image in one ZIP, or <strong>Open as pages</strong> (up to 20) to adjust individual images before exporting.</p>
      <h2>Tips</h2>
      <ul>
        <li>Use <strong>Fit text</strong> on the template with your longest row to choose a size that suits all of them.</li>
        <li>A brand byline appears on every image in the batch.</li>
      </ul>
    </>,
  },
  {
    slug: "add-watermark-to-text-image",
    group: "Workflows",
    title: "Add a watermark or signature to text images",
    description: "Sign every image you make: a text watermark with adjustable position and opacity, or a byline with your avatar, name and handle.",
    template: "note",
    summary: "Text watermarks, bylines and when to use each.",
    body: <>
      <p>Images travel without their source. A watermark or byline keeps your name attached when a card is reposted or screenshotted.</p>
      <h2>Byline: your avatar, name and handle</h2>
      <p>In <strong>Customize → My brand</strong>, add an avatar, your name and handle once. From then on every image carries a byline. For each project you can place it at the top or bottom, align it left, center or right, add a divider line above it, or hide it.</p>
      <h2>Watermark: a line of text over the image</h2>
      <p>Open <strong>Customize → Watermark & finishing touches</strong>:</p>
      <ul>
        <li><strong>Watermark text</strong>: a handle, website or copyright line, up to 80 characters.</li>
        <li><strong>Position</strong>: bottom right, top right, or centered and angled across the card.</li>
        <li><strong>Opacity</strong>: from barely visible to clearly readable.</li>
      </ul>
      <h2>Which one to use</h2>
      <ul>
        <li>Use the <strong>byline</strong> for social posts: it reads as authorship and looks intentional.</li>
        <li>Use a <strong>centered watermark</strong> when you share drafts or previews and want to discourage reuse.</li>
        <li>Use a <strong>corner watermark</strong> for a subtle source line on finished work.</li>
      </ul>
      <p>Your brand is stored only in this browser. Share links and project backups do not include it.</p>
    </>,
  },
  {
    slug: "readme-to-image",
    group: "Sources",
    title: "Turn a GitHub README section into an image",
    description: "Share part of a README as an image: install steps, a feature list or a code sample, with syntax highlighting and clean tables.",
    template: "code",
    summary: "Install steps, feature lists and code from a README.",
    body: <>
      <p>A README is already Markdown. Copying a section into MarkdownPic gives you an image for a launch post, a slide or a social preview.</p>
      <h2>Copy the source, not the rendered page</h2>
      <p>Open the README file on GitHub, choose <strong>Raw</strong> or the copy button, and paste the Markdown. Remove sections your reader does not need; one idea per image works best.</p>
      <h2>What renders</h2>
      <ul>
        <li>Fenced code blocks with a language get syntax highlighting and a title bar showing the language.</li>
        <li>Tables, task lists, headings and emphasis render as in GitHub-flavored Markdown.</li>
        <li>Raw HTML, such as <code>{"<p align=\"center\">"}</code> or <code>{"<details>"}</code>, is not rendered. Replace it with Markdown.</li>
      </ul>
      <h2>Images and badges</h2>
      <p>Images from other servers appear only if those servers allow cross-origin access. If a logo or badge is missing, download it and add it with <strong>Add image</strong>. Relative paths such as <code>./docs/screenshot.png</code> need to be inserted the same way.</p>
      <h2>A good layout</h2>
      <Code>{"# Install in one line\n\n```bash\nnpm install your-package\n```\n\nThen import it and you’re done."}</Code>
      <p>The <strong>Terminal</strong> and <strong>Midnight</strong> themes suit code; <strong>Clean</strong> keeps it neutral for documentation.</p>
    </>,
  },
  {
    slug: "notion-google-docs-to-image",
    group: "Sources",
    title: "Convert Notion or Google Docs text to an image",
    description: "Copy formatted text from Notion, Google Docs, Word or a web page and turn it into an image without retyping headings, lists or links.",
    template: "note",
    summary: "Paste formatted text and keep its structure.",
    body: <>
      <p>Most writing starts in a document editor, not in Markdown. MarkdownPic converts formatted text to Markdown as you paste, so the structure survives.</p>
      <h2>How it works</h2>
      <ol>
        <li>Select the text in Notion, Google Docs, Word or a web page and copy it.</li>
        <li>Paste into the MarkdownPic editor.</li>
        <li>Headings, bold and italic text, links, lists, quotes and tables arrive as Markdown. A message confirms the conversion.</li>
      </ol>
      <p>Undo returns to the text before the paste. To paste plain text instead, use <strong>Ctrl/⌘ Shift V</strong>.</p>
      <h2>What does not carry over</h2>
      <ul>
        <li>Fonts, colors and highlights from the document; the image uses your theme instead.</li>
        <li>Comments, suggestions and embedded content such as videos.</li>
        <li>Images inside copied documents. Add them with <strong>Add image</strong>.</li>
      </ul>
      <h2>Tidy up before exporting</h2>
      <p>Documents are written for scrolling; images are read at a glance. Keep the heading, the key points and one takeaway. The editor’s outline and find & replace help with longer pastes.</p>
    </>,
  },
  {
    slug: "chinese-markdown-to-image",
    group: "Content",
    title: "Markdown to image with Chinese text",
    description: "Export Markdown that contains Chinese (or mixed Chinese and English) as images with consistent fonts on every computer.",
    template: "note",
    summary: "Consistent Chinese fonts, mixed text and punctuation.",
    body: <>
      <p>Chinese text often looks different from computer to computer because each system has its own fonts. MarkdownPic draws Chinese with its own fonts, so an image looks the same wherever it is exported.</p>
      <h2>Fonts</h2>
      <ul>
        <li><strong>Sans</strong> uses Noto Sans SC for Chinese and Geist for Latin letters.</li>
        <li><strong>Serif</strong> uses Noto Serif SC with Newsreader, for an editorial look.</li>
        <li>Font files load only when your text contains Chinese characters, and only the parts needed.</li>
      </ul>
      <Code>{"# 好的想法，值得一张好图\n\n把笔记、解释和**有用的发现**，变成值得分享的图片。"}</Code>
      <h2>Mixed Chinese and English</h2>
      <p>Each character is drawn with the font made for it: Chinese with Noto, English and numbers with the Latin typeface. Bold text and headings use real bold weights for both.</p>
      <h2>Details</h2>
      <ul>
        <li>Chinese has no italics. Quotes and emphasis stay upright instead of being slanted artificially.</li>
        <li>File names keep Chinese characters, taken from the first heading when the project has no name.</li>
        <li>Japanese kana are included in the same fonts. Korean currently uses the system font.</li>
      </ul>
    </>,
  },
  {
    slug: "release-notes-image",
    group: "Content",
    title: "Share release notes as an image",
    description: "Turn a changelog or release notes into an image for social posts and announcements: what shipped, why it matters, and what is next.",
    template: "release",
    summary: "A changelog that people actually read.",
    body: <>
      <p>Release notes in a repository are written for completeness. An announcement image is written for attention: the one change people care about, and where to learn more.</p>
      <h2>A structure that works</h2>
      <Code>{"# A better way to work\n\n## What’s new\n\n- A simpler first step\n- Clearer feedback when something goes wrong\n- Less time adjusting, more time creating\n\n**Available today.**"}</Code>
      <ul>
        <li>Lead with the benefit, not the version number.</li>
        <li>Keep three to five items; link to the full changelog in your post.</li>
        <li>End with availability: today, in beta, or for which plan.</li>
      </ul>
      <h2>Make it match your product</h2>
      <p>Save your product’s accent color, theme and typeface as your <strong>brand style</strong> in Customize, and apply it to every release image with one click.</p>
      <h2>One image per change</h2>
      <p>For a bigger release, use <strong>Pages</strong> to give each feature its own slide, or keep your changelog in a spreadsheet and generate cards with <Link href="/guides/csv-to-images">batch generation</Link>.</p>
    </>,
  },
  {
    slug: "alt-text-for-text-images",
    group: "Workflows",
    title: "Write alt text for images of text",
    description: "Images of text are invisible to screen readers without a description. Copy ready-made alt text for X, LinkedIn, Mastodon and Bluesky.",
    template: "note",
    summary: "Make text images accessible when you post them.",
    body: <>
      <p>When you post text as an image, people using screen readers, and anyone on a slow connection, see nothing unless the image has a description. Social platforms let you add one; most people skip it because typing it again is tedious.</p>
      <h2>Copy it in one click</h2>
      <p>After exporting, choose <strong>Copy alt text</strong> in the result window. MarkdownPic writes a plain-text description from your Markdown: headings, paragraphs, list items and table cells, without formatting symbols. Paste it into the image description field when you post.</p>
      <h2>What the description contains</h2>
      <ul>
        <li>The text of the image, in reading order.</li>
        <li>Image descriptions you wrote in Markdown, such as <code>{"![Chart of monthly growth](...)"}</code>.</li>
        <li>Code blocks, introduced with “Code:” and their language; diagrams are described simply as “Diagram.”</li>
      </ul>
      <p>Descriptions are kept within 1,000 characters, the limit on X. For a carousel, each page has its own description.</p>
      <h2>Write good descriptions</h2>
      <ul>
        <li>Give every image you insert meaningful alt text in Markdown; it is reused in the description.</li>
        <li>For charts, state the takeaway, not just the chart type.</li>
        <li>Keep images of text short. If a post needs paragraphs of text, consider posting the text itself.</li>
      </ul>
    </>,
  },
  {
    slug: "checklist-to-image",
    group: "Content",
    title: "Turn a checklist into an image",
    description: "Share a checklist, to-do list or step-by-step process as a clear image with real checkboxes, numbered steps and highlighted key points.",
    template: "steps",
    summary: "Task lists, numbered steps and emphasis that reads well.",
    body: <>
      <p>Checklists are some of the most saved and shared images. Markdown makes them quick to write and easy to update.</p>
      <h2>Task lists</h2>
      <Code>{"# Before you publish\n\n- [x] Headline states the takeaway\n- [x] One idea per image\n- [ ] Alt text added\n- [ ] Link in the first comment"}</Code>
      <p>Checked and unchecked items render as checkboxes in your accent color.</p>
      <h2>Numbered steps</h2>
      <p>Use a numbered list for a process. Numbers appear in your accent color, and pressing Enter at the end of a step starts the next number automatically.</p>
      <h2>Make it scannable</h2>
      <ul>
        <li>Keep each item to one line; move detail into a follow-up page.</li>
        <li>Bold the words people should remember; bold text uses your accent color.</li>
        <li>End with a quote or a single sentence that states why the list matters.</li>
      </ul>
      <h2>Long checklists</h2>
      <p>Choose <strong>Pages</strong> and <strong>Auto split</strong>: lists are divided between items, never in the middle of one, and headings stay with the items that follow.</p>
    </>,
  },
];
