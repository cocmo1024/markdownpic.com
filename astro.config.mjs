// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import { siteMeta } from './src/utils/site-meta.mjs';

const noindexSitemapPaths = new Set([
	'/advertising/',
	'/affiliate-disclosure/',
	'/category/guides/',
	'/disclaimer/',
	'/privacy/',
	'/terms/',
	'/terms-of-use/',
]);

/** @param {string} page */
function shouldIncludeInSitemap(page) {
	return !noindexSitemapPaths.has(new URL(page, siteMeta.siteUrl).pathname);
}

export default defineConfig({
	site: siteMeta.siteUrl,
	trailingSlash: 'always',
	integrations: [
		starlight({
			title: siteMeta.name,
			description: siteMeta.description,
			tagline: siteMeta.tagline,
			lastUpdated: true,
			social: [
				{
					icon: 'x.com',
					label: 'X',
					href: 'https://x.com/oocxx_com',
				},
			],
			sidebar: [
				{
					label: 'Markdown Encyclopedia',
					items: [
						'syntax',
						'fundamentals',
						'guides',
						'editors',
						'publishing',
						'workflows',
						'comparisons',
						'faq',
						'posts',
						{
							label: 'Tool',
							link: 'https://tool.markdownpic.com/',
						},
					],
				},
				{
					label: 'Site',
					collapsed: true,
					items: [
						'about',
						'contact',
						'tool',
						'editorial-desk',
						'review-desk',
						'privacy',
						'terms-of-use',
						'disclaimer',
						'editorial-policy',
						'advertising',
						'affiliate-disclosure',
					],
				},
			],
			customCss: ['./src/styles/global.css'],
			pagefind: true,
			favicon: siteMeta.faviconPath,
			credits: false,
			components: {
				Head: './src/components/Head.astro',
				Header: './src/components/Header.astro',
				PageSidebar: './src/components/PageSidebar.astro',
				Footer: './src/components/Footer.astro',
			},
		}),
		sitemap({
			filter: shouldIncludeInSitemap,
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
