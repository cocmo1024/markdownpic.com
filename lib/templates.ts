import { exampleMarkdown, PAGE_BREAK_MARKER, themeLook, type Design, type FontFamily, type ThemeId } from "./studio-model.ts";

export type TemplateCategory = "short" | "long" | "carousel" | "lists" | "work";

/** The ways people post text as images on social platforms, in the order they are shown. */
export const templateCategories: Array<{ id: TemplateCategory; label: string; note: string }> = [
  { id: "short", label: "Short posts", note: "One line that stops the scroll: quotes, statements, tips, questions." },
  { id: "long", label: "Long posts", note: "Essays, threads and notes as one readable image." },
  { id: "carousel", label: "Carousels", note: "Swipeable slides for Instagram and LinkedIn." },
  { id: "lists", label: "Lists & comparisons", note: "Steps, checklists, pros and cons, do and don’t." },
  { id: "work", label: "Work & tech", note: "Release notes, code, diagrams, formulas, summaries." },
];

export interface Template {
  /** Stable: guides link to /?template=<id>. */
  id: string;
  category: TemplateCategory;
  name: string;
  description: string;
  markdown: string;
  theme: ThemeId;
  size: string;
  font?: FontFamily;
  accent?: string;
  /** Other design settings, such as centered text or a larger type size. */
  design?: Partial<Design>;
}

const pages = (...parts: string[]) => parts.join(`\n\n${PAGE_BREAK_MARKER}\n\n`);
const centered: Partial<Design> = { textAlign: "center" };

export const templates: Template[] = [
  // Short posts
  { id: "quote", category: "short", name: "Quote card", description: "A short thought with an attribution.", theme: "ink", size: "square", design: { ...centered, fontScale: 112, frame: "gradient" },
    markdown: "# Clarity is a form of respect.\n\nGive the reader the conclusion, the reason, and enough space to think.\n\n— **Your name**" },
  { id: "statement", category: "short", name: "Bold statement", description: "One strong opinion, set like a poster.", theme: "swiss", size: "portrait", design: { fontScale: 160 },
    markdown: "# Ship the smaller version first.\n\nA real reader teaches you more than a perfect plan.\n\n**— Your name**" },
  { id: "number", category: "short", name: "One number", description: "A single figure with what it measures and its source.", theme: "harbor", size: "square", design: { ...centered, fontScale: 150 },
    markdown: "### Your headline figure\n\n# 3×\n\nSay what the number measures, in one sentence.\n\n*Source: name where it comes from*" },
  { id: "tip", category: "short", name: "Tip of the day", description: "One practical tip people will save.", theme: "citrus", size: "square", design: { fontScale: 146 },
    markdown: "### Tip #12\n\n# Write the headline last.\n\nOnce the draft is done, you finally know what it says. **Save this for your next post.**" },
  { id: "question", category: "short", name: "Question", description: "Invite replies with one open question.", theme: "plum", size: "square", design: { ...centered, fontScale: 140, frame: "gradient" },
    markdown: "# What’s one habit that changed how you work?\n\nTell me in the comments." },
  { id: "word", category: "short", name: "Word card", description: "A word, its meaning and an example.", theme: "linen", size: "square", design: { fontScale: 150 },
    markdown: "# Serendipity\n\n*noun*\n\nFinding something good without looking for it.\n\n*Example:* finding your favourite café after a wrong turn." },
  { id: "announcement", category: "short", name: "Announcement", description: "News in one line, ready for a link preview.", theme: "midnight", size: "social", design: { ...centered, fontScale: 100 },
    markdown: "### Coming soon\n\n# Something new is on the way\n\nJoin the list to hear first." },

  // Long posts
  { id: "note", category: "long", name: "A clear idea", description: "A headline, useful detail, and one takeaway.", theme: "editorial", size: "long", markdown: exampleMarkdown },
  { id: "essay", category: "long", name: "Essay", description: "A long read with sections and a pull quote.", theme: "editorial", size: "long",
    markdown: "### Essay\n\n# Why the first draft should be short\n\nMost writing gets better by getting smaller. A short first draft is easier to judge, easier to fix and easier to finish.\n\n## Start with the point\n\nWrite the one sentence you want readers to remember. Everything else has to earn its place next to it.\n\n> If you can’t say it simply, you don’t understand it yet.\n\n## Then add only what helps\n\nOne example. One piece of evidence. One step the reader can take today. Stop there and read it out loud.\n\n## Finish on purpose\n\nEnd with the action, not a summary. The reader already knows what you said.\n\n**Thanks for reading.** Share it with someone who writes." },
  { id: "thread", category: "long", name: "Thread in one image", description: "A numbered thread people can read without tapping.", theme: "mono", size: "long",
    markdown: "# Five things I wish I knew before I started writing online 🧵\n\n**1/** Consistency beats intensity. One post a week for a year beats ten posts in a week.\n\n**2/** Your first line is the whole pitch. Rewrite it more than anything else.\n\n**3/** Specific beats clever. Name the tool, the number, the mistake.\n\n**4/** Reply to every comment early on. Conversations are how people find you.\n\n**5/** Keep a file of ideas. You will never run out if you write them down.\n\n*Follow for more. Repost if it helped.*" },
  { id: "lessons", category: "long", name: "Lessons learned", description: "A numbered list of hard-won lessons.", theme: "rose", size: "long",
    markdown: "# Seven lessons from my first year of freelancing\n\n1. **Say the price first.** It saves everyone a week.\n2. **Write things down.** Scope, dates and who decides.\n3. **Charge for changes.** Small requests add up.\n4. **Keep one day free.** Something always comes up.\n5. **Send updates before you’re asked.** Silence feels like trouble.\n6. **Fire the worst client.** It makes room for better ones.\n7. **Rest is part of the work.**\n\n> Replace these with your own lessons. Real ones are what people share." },
  { id: "study", category: "long", name: "Study notes", description: "Definitions, key points and a summary.", theme: "linen", size: "long",
    markdown: "# Topic: the forgetting curve\n\n## Key idea\n\nMemories fade quickly unless they are reviewed. Each review slows the next round of forgetting.\n\n## What to do\n\n- Review new material **the next day**\n- Review again after a few days, then a week\n- Test yourself instead of rereading\n\n## Summary\n\n*Spaced, active review keeps what you learn.*" },
  { id: "notecard", category: "long", name: "Note card 3:4", description: "The tall note format of Xiaohongshu and Pinterest.", theme: "citrus", size: "tall", design: { fontScale: 122 },
    markdown: "# 3 ways to read more this year 📚\n\n**① Carry a book everywhere.** Ten pages while you wait adds up.\n\n**② Quit books you don’t enjoy.** Life is short, the list is long.\n\n**③ Read before your phone.** Ten minutes in the morning sets the tone.\n\nWhich one will you try first?\n\n#reading #habits #selfimprovement" },
  { id: "newsletter", category: "long", name: "Newsletter excerpt", description: "Tease an issue with its best paragraph.", theme: "mist", size: "long",
    markdown: "### Issue 24 · Your newsletter\n\n# The quiet power of saying no\n\nEvery yes is a promise about your future time. This week: how to turn down good opportunities without burning bridges, and the one question I ask before every commitment.\n\n**Read the full issue** at your-site.com" },

  // Carousels
  { id: "carousel", category: "carousel", name: "Three-page story", description: "A beginning, the reasoning, and a next step.", theme: "rose", size: "portrait", design: { fontScale: 172 },
    markdown: pages("# One idea, three clear frames.\n\nStart with the conclusion your reader should remember.", "# Show the reasoning\n\n- One useful piece of evidence\n- One concrete example\n- No repeated explanation", "# Make it actionable\n\nGive the reader one clear next step.\n\n> Good carousels feel like progress, not fragments.") },
  { id: "tips-carousel", category: "carousel", name: "Tips carousel", description: "A cover, one tip per slide, and a closing call to action.", theme: "swiss", size: "portrait", design: { fontScale: 180 },
    markdown: pages("### Swipe →\n\n# Five rules for clearer slides", "# 01\n\n## One idea per slide\n\nIf you need two headlines, you need two slides.", "# 02\n\n## Big type, few words\n\nPeople read slides on a phone, at arm’s length.", "# 03\n\n## Show, then tell\n\nLead with the example. Explain it after.", "# 04\n\n## Same layout every time\n\nRepetition lets people focus on the content.", "# 05\n\n## End with one action\n\nTell people exactly what to do next.", "# Save this for your next deck.\n\nFollow for more practical design tips.") },
  { id: "howto-carousel", category: "carousel", name: "How-to carousel", description: "Step-by-step slides with a recap at the end.", theme: "harbor", size: "portrait", design: { fontScale: 176 },
    markdown: pages("### How to\n\n# Plan a week in 15 minutes", "### Step 1\n\n# List everything\n\nDump every task, big and small, onto one page.", "### Step 2\n\n# Pick three priorities\n\nIf the week only allowed three things, which would they be?", "### Step 3\n\n# Block the time\n\nPut the three in your calendar before anything else.", "### Recap\n\n# List · Pick · Block\n\n- Everything on one page\n- Three priorities\n- Time reserved first") },
  { id: "myth-carousel", category: "carousel", name: "Myth vs fact", description: "Correct common misconceptions, one per slide.", theme: "midnight", size: "square", design: { ...centered, fontScale: 142 },
    markdown: pages("# Myth vs fact\n\nThree things people get wrong about writing.", "### Myth\n\n# “Good writers don’t need to edit.”\n\n### Fact\n\nEditing is most of the work.", "### Myth\n\n# “Longer means more valuable.”\n\n### Fact\n\nClear and short is harder, and more useful.", "### Myth\n\n# “You need inspiration first.”\n\n### Fact\n\nStarting is what brings the ideas.") },

  // Lists & comparisons
  { id: "steps", category: "lists", name: "Step-by-step", description: "An easy-to-follow process.", theme: "harbor", size: "portrait", design: { fontScale: 135 },
    markdown: "# From rough idea to useful post\n\n1. Start with the conclusion.\n2. Add one piece of evidence.\n3. Remove anything that repeats the point.\n4. End with a clear next action.\n\n> Structure makes ideas easier to share." },
  { id: "checklist", category: "lists", name: "Checklist", description: "A checklist people save and come back to.", theme: "mist", size: "portrait", design: { fontScale: 146 },
    markdown: "# Before you hit publish\n\n- [x] The first line states the takeaway\n- [x] One idea, not three\n- [ ] Every claim has a source\n- [ ] Read it out loud once\n- [ ] Alt text added to images\n\n**Save this for your next post.**" },
  { id: "table", category: "lists", name: "Comparison table", description: "A readable table with context.", theme: "mono", size: "long",
    markdown: "# Choose the right format\n\n| Format | Best for | Trade-off |\n| --- | --- | --- |\n| PNG | Text and diagrams | Larger file |\n| JPEG | Photos | Lossy compression |\n| WebP | Compact images | Check platform support |\n\n**Tip:** keep your Markdown source for future edits." },
  { id: "pros-cons", category: "lists", name: "Pros and cons", description: "Both sides of a decision, side by side.", theme: "mono", size: "portrait", design: { fontScale: 110 },
    markdown: "# Working from home\n\n### Pros\n\n- No commute\n- Fewer interruptions\n- Flexible hours\n\n### Cons\n\n- Harder to switch off\n- Less spontaneous help\n- Home becomes the office\n\n**Verdict:** great for focus, plan for connection." },
  { id: "do-dont", category: "lists", name: "Do and don’t", description: "Clear rules in two columns of advice.", theme: "swiss", size: "portrait", design: { fontScale: 121 },
    markdown: "# Email etiquette\n\n## Do\n\n- Put the request in the first line\n- Use a subject that says what it is\n- Say when you need an answer\n\n## Don’t\n\n- Reply all by default\n- Bury the deadline\n- Send without rereading" },

  // Work & tech
  { id: "release", category: "work", name: "Release note", description: "What shipped, what changed, and what is next.", theme: "plum", size: "portrait", design: { fontScale: 116 },
    markdown: "# A better way to work\n\n## What’s new\n\n- A simpler first step\n- Clearer feedback when something goes wrong\n- Less time adjusting, more time creating\n\n**Available today.**\n\nReplace this example with your own update." },
  { id: "summary", category: "work", name: "Summary card", description: "TL;DR of a meeting, report or long thread.", theme: "harbor", size: "long",
    markdown: "### TL;DR\n\n# Weekly product review\n\n**Decisions**\n\n- Launch moves to the second week of the month\n- Onboarding copy gets one more round\n\n**Next steps**\n\n- [ ] Final design review · Alex\n- [ ] Update the help page · Sam\n\n> Questions? Reply in the thread." },
  { id: "code", category: "work", name: "Code + context", description: "Explain a snippet, not just the syntax.", theme: "terminal", size: "long",
    markdown: "# Small, readable functions\n\nGive each function one job and a name that explains it.\n\n~~~javascript\nfunction readingMinutes(words) {\n  return Math.max(1, Math.ceil(words / 200));\n}\n~~~\n\nThe result is always **at least one minute**.\n\n> Code travels better with context." },
  { id: "diagram", category: "work", name: "Flowchart", description: "A Mermaid diagram that stays editable.", theme: "mist", size: "long",
    markdown: "# A simple publishing flow\n\n~~~mermaid\nflowchart TD\n  A[Write] --> B[Preview]\n  B --> C{Ready?}\n  C -->|Yes| D[Export]\n  C -->|Not yet| A\n~~~\n\nKeep the source. Improve the explanation." },
  { id: "math", category: "work", name: "Formula", description: "Math with a clear explanation.", theme: "linen", size: "square",
    markdown: "# Small improvements compound\n\n$$\nA = P(1 + r)^t\n$$\n\n- **P** — starting value\n- **r** — rate of improvement\n- **t** — time\n\nSmall changes become meaningful when they accumulate." },
];

/** A template opens in its theme's full look (accent and typeface) plus its own settings. */
export const templateDesign = (base: Design, template: Template): Design => ({
  ...base, ...themeLook(template.theme), presetId: template.size,
  ...(template.font ? { fontFamily: template.font } : {}), ...(template.accent ? { accent: template.accent } : {}),
  textAlign: "left", fontScale: 100, ...template.design,
});
