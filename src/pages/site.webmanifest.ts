import { siteMeta } from '../utils/site-meta.mjs';

export const prerender = true;

export function GET() {
	return new Response(
		JSON.stringify({
			name: siteMeta.name,
			short_name: siteMeta.shortName,
			description: siteMeta.description,
			lang: siteMeta.languageTag,
			start_url: '/',
			scope: '/',
			display: 'browser',
			background_color: siteMeta.backgroundColor,
			theme_color: siteMeta.themeColor,
			icons: [
				{ src: siteMeta.icon192Path, sizes: 'any', type: 'image/svg+xml' },
			],
		}),
		{
			headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
		}
	);
}
