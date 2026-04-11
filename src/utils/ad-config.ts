type Frontmatter = Record<string, unknown> | undefined;

type AdSlotPlan = {
	zone: string;
	headline: string;
	sizes: string[];
	audience?: string;
	note?: string;
};

type AdPlan = {
	summary: string;
	rail: AdSlotPlan[];
	footer: AdSlotPlan;
};

type AdProfile =
	| 'foundation'
	| 'policy'
	| 'fundamental'
	| 'guide'
	| 'syntax'
	| 'editor'
	| 'publishing'
	| 'workflow'
	| 'faq'
	| 'post'
	| 'comparison';

function inferProfile(routeId: string, frontmatter: Frontmatter): AdProfile {
	const explicit = frontmatter?.adProfile;
	if (typeof explicit === 'string') return explicit as AdProfile;
	if (routeId.startsWith('fundamentals/')) return 'fundamental';
	if (routeId.startsWith('guides/')) return 'guide';
	if (routeId.startsWith('syntax/')) return 'syntax';
	if (routeId.startsWith('editors/')) return 'editor';
	if (routeId.startsWith('publishing/')) return 'publishing';
	if (routeId.startsWith('workflows/')) return 'workflow';
	if (routeId.startsWith('faq/')) return 'faq';
	if (routeId.startsWith('posts/')) return 'post';
	if (routeId.startsWith('comparisons/')) return 'comparison';
	if (routeId === 'about' || routeId === 'contact' || routeId === 'index') return 'foundation';
	return 'policy';
}

const plans: Record<AdProfile, AdPlan> = {
	foundation: {
		summary:
			'Foundation pages keep inventory conservative while reserving room for future publisher-safe sponsor placements, Markdown tools, and workflow products.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'Markdown platform sponsor',
				sizes: ['300x250', '300x300'],
				audience: 'Fit for Markdown tools, documentation platforms, or developer workflow software.',
			},
			{
				zone: 'Right Rail B',
				headline: 'Newsletter or template placement',
				sizes: ['300x600', 'native card'],
				audience: 'Useful for low-pressure awareness inventory across broad Markdown research traffic.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Cross-site creator tools placement',
			sizes: ['728x90', '970x90', 'native strip'],
			audience: 'Useful for broad awareness across documentation, AI workflow, and creator-tool traffic.',
		},
	},
	policy: {
		summary:
			'Disclosure and policy pages should remain easy to trust, so the reserved commercial layout is intentionally restrained.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'Disclosure-safe brand placement',
				sizes: ['300x250', 'native card'],
				audience: 'Reserved for conservative trust-page inventory only.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Low-pressure network placement',
			sizes: ['728x90', 'native strip'],
			audience: 'Appropriate only when disclosure remains explicit.',
		},
	},
	fundamental: {
		summary:
			'Fundamentals pages attract broad search traffic and should lean toward low-friction sponsor inventory such as beginner tools, hosting, and documentation platforms.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'Markdown starter sponsor',
				sizes: ['300x250', '300x300'],
				audience: 'Fit for beginner-friendly Markdown apps, docs tools, and publishing utilities.',
			},
			{
				zone: 'Right Rail B',
				headline: 'Reference resource placement',
				sizes: ['300x600', 'native card'],
				audience: 'Good fit for directories, template packs, or knowledge products.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Beginner workflow placement',
			sizes: ['728x90', '970x90'],
			audience: 'Reserved for broad-funnel documentation traffic.',
		},
	},
	guide: {
		summary:
			'Guides usually attract high-intent traffic because readers are trying to solve a real Markdown, export, or publishing problem now.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'Problem-solution sponsor slot',
				sizes: ['300x250', '300x300'],
				audience: 'Fit for conversion tools, CMS products, screenshot tools, hosting, or editor vendors.',
			},
			{
				zone: 'Right Rail B',
				headline: 'Workflow sponsor placement',
				sizes: ['300x600', 'native card'],
				audience: 'Useful for readers moving from diagnosis into tool selection or workflow setup.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Guide-bottom sponsor slot',
			sizes: ['728x90', '970x90'],
			audience: 'Reserved for active research traffic with direct solution intent.',
		},
	},
	syntax: {
		summary:
			'Syntax pages are durable, high-volume assets. They should reserve space for lightweight inventory that does not interrupt fast problem solving.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'Syntax helper sponsor',
				sizes: ['300x250', '300x300'],
				audience: 'Fit for editor apps, documentation tools, or productivity utilities.',
			},
			{
				zone: 'Right Rail B',
				headline: 'Reference tool placement',
				sizes: ['300x600', 'native card'],
				audience: 'Best for readers who need a tool immediately after fixing the syntax problem.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Syntax page strip',
			sizes: ['728x90', '970x90', 'native strip'],
			audience: 'Designed for high-volume reference traffic.',
		},
	},
	editor: {
		summary:
			'Editor pages are among the strongest commercial surfaces because they naturally support software comparison intent and long purchase cycles.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'Editor comparison sponsor',
				sizes: ['300x250', '300x300'],
				audience: 'Fit for Markdown editors, PKM apps, hosted docs platforms, or collaboration suites.',
			},
			{
				zone: 'Right Rail B',
				headline: 'Migration or workflow placement',
				sizes: ['300x600', 'native card'],
				audience: 'Useful for readers comparing ecosystems before switching tools.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Editor shortlist strip',
			sizes: ['728x90', '970x90'],
			audience: 'Reserved for comparison-heavy traffic with software buying intent.',
		},
	},
	publishing: {
		summary:
			'Publishing pages attract builders trying to move Markdown into docs sites, blogs, newsletters, or social workflows, making them strong mid-to-high intent surfaces.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'Publishing stack sponsor',
				sizes: ['300x250', '300x300'],
				audience: 'Fit for static-site tools, headless CMS products, image/CDN vendors, and workflow software.',
			},
			{
				zone: 'Right Rail B',
				headline: 'Distribution partner placement',
				sizes: ['300x600', 'native card'],
				audience: 'Useful for newsletter, analytics, CDN, and developer workflow vendors.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Publishing workflow strip',
			sizes: ['728x90', '970x90'],
			audience: 'Reserved for publishing-intent traffic.',
		},
	},
	workflow: {
		summary:
			'Workflow pages are valuable because they connect Markdown to AI, research, documentation operations, and reusable content systems.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'Workflow stack sponsor',
				sizes: ['300x250', '300x300'],
				audience: 'Fit for AI tools, PKM systems, docs platforms, automation tools, and export utilities.',
			},
			{
				zone: 'Right Rail B',
				headline: 'Operations partner placement',
				sizes: ['300x600', 'native card'],
				audience: 'Useful for readers formalizing a repeatable Markdown workflow.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Workflow-bottom placement',
			sizes: ['728x90', '970x90'],
			audience: 'Reserved for operations-minded traffic.',
		},
	},
	faq: {
		summary:
			'FAQ pages should prioritize utility and trust. Reserved inventory should stay minimal and clearly separated from the answers.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'FAQ support placement',
				sizes: ['300x250', 'native card'],
				audience: 'Appropriate for non-intrusive awareness placements only.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Low-pressure FAQ strip',
			sizes: ['728x90', 'native strip'],
			audience: 'Appropriate only when the page remains easy to trust.',
		},
	},
	post: {
		summary:
			'Post URLs are legacy-compatible article assets. Inventory should respect the article format while leaving room for future sponsor demand on evergreen search topics.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'Evergreen article sponsor',
				sizes: ['300x250', '300x300'],
				audience: 'Fit for editorially aligned Markdown, developer, and content tools.',
			},
			{
				zone: 'Right Rail B',
				headline: 'Article workflow placement',
				sizes: ['300x600', 'native card'],
				audience: 'Useful for readers converting a solved problem into a tool choice.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Evergreen article strip',
			sizes: ['728x90', '970x90', 'native strip'],
			audience: 'Reserved for long-lived search traffic.',
		},
	},
	comparison: {
		summary:
			'Comparison pages usually attract the highest-value traffic, so the reserved layout assumes premium inventory with strict disclosure separation.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'Primary comparison sponsor',
				sizes: ['300x250', '300x300'],
				audience: 'Reserved for active evaluation traffic with strong software or workflow buying intent.',
			},
			{
				zone: 'Right Rail B',
				headline: 'Secondary comparison placement',
				sizes: ['300x600', 'native card'],
				audience: 'Suitable for readers narrowing editor, host, or tooling options before commitment.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Bottom-of-comparison partner slot',
			sizes: ['728x90', '970x90', 'native strip'],
			audience: 'Structured for bottom-of-funnel software and workflow selection traffic.',
		},
	},
};

export function getAdPlan(routeId: string, frontmatter: Frontmatter): AdPlan {
	const profile = inferProfile(routeId, frontmatter);
	return plans[profile];
}
