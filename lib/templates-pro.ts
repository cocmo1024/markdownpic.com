import { PAGE_BREAK_MARKER, type Design } from "./studio-model.ts";
import type { Template } from "./templates.ts";

/*
 * Professional templates by field. Facts are either accurate (shortcuts, commands, a recipe)
 * or clearly marked placeholders; nothing here should read as a real claim, review or result.
 */
const pages = (...parts: string[]) => parts.join(`\n\n${PAGE_BREAK_MARKER}\n\n`);
const centered: Partial<Design> = { textAlign: "center" };

const ROW = /^\s*\|/, ITEM = /^\s*([-*+]|\d+\.)\s/, FENCE = /^\s*(~~~|```)/;
/** Written one block per line for readability; blank lines are added between blocks, not inside fences, tables or lists. */
function spaced(markdown: string) {
  const out: string[] = [];
  let fenced = false, previous = "";
  for (const line of markdown.split("\n")) {
    const tight = fenced || !out.length || line === PAGE_BREAK_MARKER || previous === PAGE_BREAK_MARKER || !line.trim() || !previous.trim() || (ROW.test(previous) && ROW.test(line)) || (ITEM.test(previous) && ITEM.test(line));
    out.push(tight ? line : "\n" + line);
    if (FENCE.test(line)) fenced = !fenced;
    previous = line;
  }
  return out.join("\n");
}

const raw: Template[] = [
  // Short posts
  { id: "countdown", category: "short", name: "Countdown", description: "Days to a launch, event or deadline.", theme: "midnight", size: "square", design: { ...centered, fontScale: 198 },
    markdown: `### Launch day
# 3
days to go. Set a reminder.` },
  { id: "poll", category: "short", name: "This or that", description: "A two-option poll that invites replies.", theme: "citrus", size: "square", design: { ...centered, fontScale: 132 },
    markdown: `### Quick poll
# Morning or night?
When do you do your best work?
**A** · Early morning
**B** · Late at night
Reply with A or B.` },

  // Carousels
  { id: "insight-carousel", category: "carousel", name: "Insight carousel", description: "A strong hook, three insights and a question.", theme: "editorial", size: "portrait", design: { fontScale: 167 },
    markdown: pages(`### A lesson from this year
# What changed when I stopped saying yes to everything`, `### 01
## Fewer projects, better work
Saying no to good projects made room for great ones.`, `### 02
## Clear priorities are kind
People knew what to expect, and when.`, `### 03
## Rest is a strategy
The best ideas came after a real weekend.`, `# What would you say no to this month?
Tell me in the comments.`) },
  { id: "before-after", category: "carousel", name: "Before and after", description: "Show an improvement in three slides.", theme: "mono", size: "square", design: { fontScale: 176 },
    markdown: pages(`### Rewrite
# Before and after: one confusing email`, `### Before
## “Hi, just following up on the thing from last week, let me know what you think when you get a chance.”`, `### After
## “Can you approve the budget by Friday? If yes, I’ll book the venue Monday.”`, `# What changed
- The request comes first
- One clear deadline
- The next step is visible`) },

  // Lists & comparisons
  { id: "versus", category: "lists", name: "X versus Y", description: "Compare two options point by point.", theme: "harbor", size: "portrait", design: { fontScale: 128 },
    markdown: `### Comparison
# Email vs chat
| | Email | Chat |
|---|---|---|
| Best for | Decisions, records | Quick questions |
| Speed | Hours | Minutes |
| Searchable | Yes | Often |
| Focus cost | Low | High |
**Rule of thumb:** decide in email, coordinate in chat.` },
  { id: "faq", category: "lists", name: "FAQ", description: "Answer the questions people ask most.", theme: "mist", size: "long",
    markdown: `### FAQ
# Questions we hear every week
### Do I need an account?
No. Everything stays in your browser.
### Can I use it for work?
Yes. Add your own logo and colours.
### How do I get help?
Write to us at hello@your-site.com.` },

  // Business & marketing
  { id: "launch", category: "business", name: "Product launch", description: "Introduce a product in one confident card.", theme: "plum", size: "square", design: { ...centered, frame: "gradient", fontScale: 130 },
    markdown: `### Introducing
# Your product name
The one-line promise of what it does for people.
**Available today** · your-site.com` },
  { id: "results", category: "business", name: "Results at a glance", description: "Key numbers for an update or report.", theme: "harbor", size: "portrait", design: { fontScale: 115 },
    markdown: `### Quarterly update
# Results at a glance
| Metric | This quarter | Change |
|---|---|---|
| Revenue | 1.2M | +12% |
| New customers | 340 | +8% |
| Churn | 2.1% | −0.4 pt |
**Next:** expand the partner programme.
*Example figures. Replace them with your own.*` },
  { id: "testimonial", category: "business", name: "Customer quote", description: "A customer’s words, with name and role.", theme: "mono", size: "square", design: { ...centered, fontScale: 134 },
    markdown: `# “Their words go here, exactly as they said them.”
**Customer name**
Role, Company
*Use real quotes, with permission.*` },
  { id: "hiring", category: "business", name: "We’re hiring", description: "A job post people want to share.", theme: "swiss", size: "portrait", design: { fontScale: 112 },
    markdown: `### We’re hiring
# Senior Product Designer
Remote · Full-time
## You will
- Shape the product from first sketch to launch
- Work closely with engineering and research
- Raise the bar for craft across the team
**Apply:** your-site.com/jobs` },
  { id: "event", category: "business", name: "Event invitation", description: "Date, time, place and how to reply.", theme: "ink", size: "portrait", design: { ...centered, frame: "gradient", fontScale: 110 },
    markdown: `### You’re invited
# An evening of design and conversation
**Thursday, 14 November · 7 pm**
Your venue, Your city
Drinks, short talks and good company.
RSVP at your-site.com/rsvp` },
  { id: "agenda", category: "business", name: "Event agenda", description: "A clear schedule for a conference or workshop.", theme: "editorial", size: "long",
    markdown: `### Programme
# Workshop day
| Time | Session |
|---|---|
| 09:00 | Welcome and coffee |
| 09:30 | Opening talk |
| 10:30 | Hands-on session |
| 12:30 | Lunch |
| 13:30 | Panel and questions |
| 15:00 | Close |
*Times may change on the day.*` },
  { id: "okrs", category: "business", name: "Goals and key results", description: "Objectives with measurable results.", theme: "harbor", size: "long",
    markdown: `### Q1 goals
# Make onboarding effortless
## Key results
1. New users finish setup in under five minutes
2. Support questions about setup halve
3. Nine in ten new users return in week two
## Not this quarter
- New pricing
- A mobile app` },
  { id: "case-study", category: "business", name: "Case study", description: "Challenge, approach and result.", theme: "editorial", size: "long",
    markdown: `### Case study
# How a small team cut reporting time
## The challenge
Every Monday, two people spent the morning copying numbers into slides.
## What we did
- Connected the data once
- Built one reusable template
- Sent the report automatically
## The result
Monday mornings went back to real work.
*Replace with your own client story, with permission.*` },
  { id: "milestone", category: "business", name: "Milestone", description: "Celebrate a number with your audience.", theme: "citrus", size: "square", design: { ...centered, fontScale: 180 },
    markdown: `### Thank you
# 1,000
readers. Thank you for being here from the start.` },

  // Education & research
  { id: "flashcards", category: "learning", name: "Flashcards", description: "Question on one slide, answer on the next.", theme: "linen", size: "square", design: { ...centered, fontScale: 143 },
    markdown: pages(`### Question 1
# What does a mitochondrion do?`, `### Answer
# It produces most of the cell’s energy.
Through cellular respiration, it makes ATP.`, `### Question 2
# What is the boiling point of water at sea level?`, `### Answer
# 100 °C
That is 212 °F.`) },
  { id: "quiz", category: "learning", name: "Quiz question", description: "A multiple-choice question with the answer next.", theme: "plum", size: "square", design: { fontScale: 116 },
    markdown: pages(`### Quiz
# Which planet is closest to the Sun?
**A** · Venus
**B** · Mercury
**C** · Mars
**D** · Earth`, `### Answer
# B · Mercury
It orbits the Sun about once every 88 days.`) },
  { id: "vocabulary", category: "learning", name: "Vocabulary list", description: "Words, meanings and examples in a table.", theme: "linen", size: "long",
    markdown: `### Word list
# Words for clear writing
| Word | Meaning | Example |
|---|---|---|
| concise | brief but complete | A concise summary. |
| candid | honest and direct | A candid review. |
| coherent | logical and consistent | A coherent plan. |
| succinct | expressed in few words | A succinct reply. |` },
  { id: "paper", category: "learning", name: "Paper summary", description: "Question, method, findings and limits of a study.", theme: "mono", size: "long",
    markdown: `### Paper summary
# Title of the paper
*Authors (Year). Journal or conference.*
## Question
What did the study set out to learn?
## Method
Who or what was studied, and how.
## Findings
- The main result, in plain words
- A second result worth knowing
## Limits
What the study cannot tell us.` },
  { id: "lesson", category: "learning", name: "Lesson plan", description: "Objectives, materials and a timed outline.", theme: "mist", size: "long",
    markdown: `### Lesson plan · 45 minutes
# Writing a strong opening line
## Objectives
- Recognise three kinds of openings
- Rewrite a weak opening
## Materials
Printed examples, timer, sticky notes
## Outline
| Time | Activity |
|---|---|
| 5 min | Warm-up: favourite first lines |
| 15 min | Three types of openings |
| 20 min | Rewrite in pairs |
| 5 min | Share and reflect |` },
  { id: "cheatsheet", category: "learning", name: "Cheat sheet", description: "Commands or rules in a scannable table.", theme: "terminal", size: "long",
    markdown: `### Cheat sheet
# Everyday Git
| Command | What it does |
|---|---|
| \`git status\` | Show changed files |
| \`git add -p\` | Stage changes piece by piece |
| \`git commit -m "msg"\` | Save staged changes |
| \`git switch -c name\` | Create and switch to a branch |
| \`git log --oneline\` | Compact history |
| \`git restore file\` | Discard unstaged changes |` },
  { id: "timeline", category: "learning", name: "Timeline", description: "Milestones in order, with what happened.", theme: "editorial", size: "long",
    markdown: `### Project timeline
# From idea to launch
**Week 1** · Research
Interviews with ten people who have the problem.
**Week 3** · Prototype
A clickable version, tested every day.
**Week 6** · Beta
Fifty early users and weekly fixes.
**Week 8** · Launch
Public release and the first announcement.` },

  // Lifestyle
  { id: "recipe", category: "life", name: "Recipe card", description: "Ingredients, method, time and servings.", theme: "rose", size: "long",
    markdown: `### 20 minutes · Serves 2
# Lemon and garlic spaghetti
## Ingredients
- 200 g spaghetti
- 3 tbsp olive oil
- 2 garlic cloves, thinly sliced
- 1 lemon, zest and juice
- 40 g grated parmesan
- Salt and black pepper
## Method
1. Cook the spaghetti in well-salted water.
2. Warm the oil and garlic gently until fragrant.
3. Add the zest, juice and a splash of pasta water.
4. Toss with the pasta and parmesan. Season and serve.` },
  { id: "workout", category: "life", name: "Workout plan", description: "Exercises, sets and reps at a glance.", theme: "swiss", size: "portrait", design: { fontScale: 109 },
    markdown: `### 25 minutes · No equipment
# Full-body basics
| Exercise | Sets × reps |
|---|---|
| Squats | 3 × 12 |
| Push-ups | 3 × 10 |
| Lunges | 3 × 10 each leg |
| Glute bridges | 3 × 12 |
| Plank | 3 × 30 s |
Rest 60 seconds between sets.
*New to exercise? Check with a professional first.*` },
  { id: "itinerary", category: "life", name: "Travel itinerary", description: "A day-by-day plan for a trip.", theme: "mist", size: "long",
    markdown: `### 3 days
# Lisbon, slowly
## Day 1 · Alfama
Morning walk through the old streets, lunch near the castle, sunset at a miradouro.
## Day 2 · Belém
Jerónimos Monastery, the riverside, and a custard tart.
## Day 3 · Sintra
Day trip by train. Start early to beat the queues.
**Pack:** comfortable shoes and a light jacket.` },
  { id: "book-notes", category: "life", name: "Book notes", description: "The big idea, a quote and what you’ll change.", theme: "linen", size: "long",
    markdown: `### Book notes
# Book title
*Author name*
## The big idea
One sentence that captures the whole book.
## What stayed with me
- An idea you keep thinking about
- A story that made it real
## What I’ll do differently
One concrete change, starting this week.` },
  { id: "review", category: "life", name: "Review card", description: "A rating and a one-paragraph verdict.", theme: "ink", size: "square", design: { ...centered, fontScale: 138 },
    markdown: `### Film review
# Title of the film
★★★★☆
Your verdict in two sentences: what worked, and who will love it.` },
  { id: "reflection", category: "life", name: "Monthly reflection", description: "Wins, lessons and next month’s focus.", theme: "rose", size: "portrait", design: { fontScale: 112 },
    markdown: `### October
# Looking back
## Wins
- Finished the first draft
- Ran three times a week
## Lessons
- Mornings are for deep work
## Next month
One focus: **ship it.**` },
  { id: "career", category: "life", name: "Career update", description: "Share news like a new role or graduation.", theme: "mono", size: "square", design: { ...centered, frame: "solid", fontScale: 144 },
    markdown: `### Career update
# I’m starting a new role
as **Your title** at **Company**.
Grateful to everyone who helped along the way.` },

  // Work & tech
  { id: "shortcuts", category: "work", name: "Keyboard shortcuts", description: "The shortcuts worth learning, in one table.", theme: "midnight", size: "long",
    markdown: `### VS Code · Windows and Linux
# Shortcuts worth learning
| Shortcut | Action |
|---|---|
| \`Ctrl+P\` | Quick open a file |
| \`Ctrl+Shift+P\` | Command palette |
| \`Ctrl+D\` | Select next match |
| \`Alt+↑\` / \`Alt+↓\` | Move line up or down |
| \`F2\` | Rename symbol |
| \`Ctrl+/\` | Toggle comment |
On macOS, use **Cmd** instead of Ctrl and **Option** instead of Alt.` },
  { id: "api", category: "work", name: "API endpoint", description: "Request and response for one endpoint.", theme: "terminal", size: "long",
    markdown: `### API reference
# Create a project
\`POST /v1/projects\`
## Request
~~~json
{
  "name": "Launch plan",
  "visibility": "private"
}
~~~
## Response · 201
~~~json
{
  "id": "prj_123",
  "name": "Launch plan",
  "created_at": "2026-10-08T09:00:00Z"
}
~~~` },
  { id: "standup", category: "work", name: "Standup update", description: "Yesterday, today and blockers.", theme: "harbor", size: "portrait", design: { fontScale: 110 },
    markdown: `### Standup · Tuesday
# Where things stand
## Yesterday
- Finished the signup flow
## Today
- Write tests for payments
- Review two pull requests
## Blockers
Waiting on the new API key.` },
  { id: "diff", category: "work", name: "Code change", description: "A before-and-after diff with an explanation.", theme: "midnight", size: "long",
    markdown: `### Refactor
# Return early, nest less
~~~diff
- function price(user) {
-   if (user) {
-     if (user.member) {
-       return 8;
-     }
-   }
-   return 10;
- }
+ function price(user) {
+   if (user?.member) return 8;
+   return 10;
+ }
~~~
Same behaviour, half the lines, one level of nesting.` },
];

export const proTemplates: Template[] = raw.map(template => ({ ...template, markdown: spaced(template.markdown) }));
