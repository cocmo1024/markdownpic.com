// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import { siteMeta } from './src/utils/site-meta.mjs';

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
						{
							label: 'Syntax',
							autogenerate: { directory: 'syntax' },
						},
						{
							label: 'Fundamentals',
							autogenerate: { directory: 'fundamentals' },
						},
						{
							label: 'Guides',
							autogenerate: { directory: 'guides' },
						},
						{
							label: 'Editors',
							autogenerate: { directory: 'editors' },
						},
						{
							label: 'Publishing',
							autogenerate: { directory: 'publishing' },
						},
						{
							label: 'Workflows',
							autogenerate: { directory: 'workflows' },
						},
						{
							label: 'Editors & Tooling',
							autogenerate: { directory: 'comparisons' },
						},
						{
							label: 'FAQ',
							autogenerate: { directory: 'faq' },
						},
						{
							label: 'Posts',
							autogenerate: { directory: 'posts' },
						},
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
		sitemap(),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
