// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeImageAttrs from './src/plugins/rehype-image-attrs.mjs';
import sitemap from '@astrojs/sitemap';
import remarkGfm from 'remark-gfm';
import { lastModified } from './src/plugins/last-modified.mjs';
import { quietDark, quietLight } from './src/code-theme/quiet.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://speccraft.io',
	redirects: {
		'/state-of-formal-methods-market': '/market/',
		'/vs/fake-timers': '/vs/other-ts-tools',
		'/vs/effect': '/vs/other-ts-tools',
		'/how-speccraft-compares': '/',
		'/tools/speccraft-vs-non-ts-tools': '/',
		'/ts-tools': '/',
		'/tools/non-ts-tools': '/',
	},
	markdown: {
		// External links (anything with a protocol, e.g. https://) open in a new tab;
		// internal Starlight links stay relative (e.g. /tools/quint) so they're
		// untouched. The visual "external link" icon is CSS, keyed off target="_blank"
		// (see src/styles/custom.css).
		remarkPlugins: [remarkGfm],
		rehypePlugins: [[rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }], rehypeImageAttrs],
	},
	integrations: [
		// Added here (Starlight then skips its own copy) so every URL gets a <lastmod> date.
		sitemap({
			serialize(item) {
				const date = lastModified(item.url);
				return date ? { ...item, lastmod: date.toISOString() } : item;
			},
		}),
		starlight({
			// No site search: hides the header search bar and skips the Pagefind index.
			pagefind: false,
			// Code blocks: the quiet code theme, flat frames, and diff lines in the palette's pink and green (see /design).
			expressiveCode: {
				themes: [quietDark, quietLight],
				styleOverrides: {
					borderColor: 'var(--sc-border)',
					codeBackground: 'var(--sc-surface)',
					frames: {
						frameBoxShadowCssValue: 'none',
						editorTabBarBackground: 'var(--sc-surface)',
						editorActiveTabBackground: 'var(--sc-surface)',
						editorActiveTabForeground: 'var(--sc-muted)',
						editorActiveTabIndicatorTopColor: 'transparent',
						editorActiveTabIndicatorBottomColor: 'transparent',
						editorTabBarBorderBottomColor: 'var(--sc-border)',
						terminalTitlebarBackground: 'var(--sc-surface)',
						terminalBackground: 'var(--sc-surface)',
						terminalTitlebarBorderBottomColor: 'var(--sc-border)',
					},
					textMarkers: {
						insBackground: 'var(--sc-green-tint)',
						insBorderColor: 'var(--sc-green)',
						insDiffIndicatorColor: 'var(--sc-green-text)',
						delBackground: 'var(--sc-pink-tint)',
						delBorderColor: 'var(--sc-pink)',
						delDiffIndicatorColor: 'var(--sc-pink-text)',
					},
				},
			},
			title: 'SpecCraft',
			description:
				'Formal methods for TypeScript: the concepts, the tools that exist, and how to use them from a TypeScript project.',
			tagline: 'Formal methods for TypeScript.',
			logo: { src: './src/assets/speccraft-logo.png', alt: 'SpecCraft' },
			customCss: ['./src/styles/custom.css'],
			components: {
				// Append Giscus comments below the content on doc pages.
				Footer: './src/components/Footer.astro',
				// Start first-time visitors on the light theme instead of the system one.
				ThemeProvider: './src/components/ThemeProvider.astro',
				// A single sun/moon toggle instead of the Dark/Light/Auto dropdown.
				ThemeSelect: './src/components/ThemeSelect.astro',
				// Show a date on every page, falling back to the file's modified time before its first commit.
				LastUpdated: './src/components/LastUpdated.astro',
				// Header GitHub / npm / LinkedIn links open in a new tab.
				SocialIcons: './src/components/SocialIcons.astro',
				// On tool comparison pages, an adoption box replaces the right-hand table of contents.
				PageSidebar: './src/components/PageSidebar.astro',
				// "Spec" in white or near-black, "Craft" in the logo's green.
				SiteTitle: './src/components/SiteTitle.astro',
				// A Full / Code only switch under the title on pages that set `views: true`.
				PageTitle: './src/components/PageTitle.astro',
			},
			favicon: '/favicon.svg',
			head: [
				{ tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
				{ tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' } },
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' } },
				{ tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } },
				// IBM Plex Sans for text, headings and the name; JetBrains Mono for code (see /design).
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true } },
				{
					tag: 'link',
					attrs: {
						rel: 'stylesheet',
						href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap',
					},
				},
				// Google Tag Manager — started after the page has loaded, so its scripts do not compete with the first paint.
				{
					tag: 'script',
					content:
						"window.addEventListener('load',function(){setTimeout(function(){" +
						"(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':" +
						"new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0]," +
						"j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=" +
						"'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);" +
						"})(window,document,'script','dataLayer','GTM-N2BNSMZ6');" +
						"},1000);});",
				},
			],
			pagination: false,
			sidebar: [
				{ label: 'Home', link: '/' },
				{
					label: 'Formal non-TypeScript tools',
					items: [
						{ label: 'TLA+', link: '/tools/tla-plus' },
						{ label: 'Quint', link: '/tools/quint' },
						{ label: 'Dafny', link: '/tools/dafny' },
						{ label: 'Lean', link: '/tools/lean' },
					],
				},
				{
					label: 'Formal TypeScript tools',
					items: [
						{ label: 'fast-check', link: '/vs/fast-check' },
						{ label: 'Bombadil', link: '/vs/bombadil' },
						{ label: 'effect-machine', link: '/vs/effect-machine' },
						{ label: 'XState', link: '/vs/xstate' },
						{ label: 'Hegel', link: '/vs/hegel' },
						{ label: 'LemmaScript', link: '/vs/lemmascript' },
						{ label: 'tla-precheck', link: '/vs/tla-precheck' },
						{ label: 'Polygraph', link: '/vs/polygraph' },
						{ label: 'stifinder', link: '/vs/stifinder' },
						{ label: 'pnueli', link: '/vs/pnueli' },
						{ label: 'stateproof', link: '/vs/stateproof' },
						{ label: 'SpecCraft TS', link: '/vs/speccraft-ts' },
						{ label: 'Some more TS Tools', link: '/vs/other-ts-tools' },
					],
				},
				{
					label: 'Formal methods market',
					collapsed: true,
					items: [
						{ label: 'Overview', link: '/market/' },
						{ label: 'Job listings', link: '/market/jobs' },
						{ label: 'Marketplaces', link: '/market/marketplaces' },
					],
				},
				{
					label: 'Durable execution',
					collapsed: true,
					items: [
						{ label: 'The problems', link: '/durable-execution-problems' },
						{ label: 'Existing ecosystem', link: '/durable-workflow-correctness-tooling-research' },
						{ label: 'Known methods', link: '/approaches-to-correctness' },
						{ label: 'Config document workflow', link: '/case-study-config-document-workflow' },
					],
				},
				{ label: 'Contact', link: '/contact' },
				{ label: 'Design notes', link: '/design' },
				{
					label: 'Concepts',
					collapsed: true,
					items: [
						{ label: 'State machines and FSMs', link: '/concepts/state-machines' },
						{ label: 'Petri nets', link: '/concepts/petri-nets' },
						{ label: 'Formal specs', link: '/concepts/formal-specs' },
					],
				},
			],
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/orgs/speccraft-io/repositories' },
				{ icon: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/company/speccraft-io/' },
				{ icon: 'blueSky', label: 'Bluesky', href: 'https://bsky.app/profile/speccraft.bsky.social' },
			],
			lastUpdated: true,
			// No right-hand "On this page" table of contents on any page.
			tableOfContents: false,
		}),
	],
});
