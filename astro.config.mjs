// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeImageAttrs from './src/plugins/rehype-image-attrs.mjs';
import sitemap from '@astrojs/sitemap';
import remarkGfm from 'remark-gfm';
import { lastModified } from './src/plugins/last-modified.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://speccraft.io',
	redirects: {
		'/state-of-formal-methods-market': '/market/',
		'/vs/fake-timers': '/vs/other-ts-tools',
		'/vs/effect': '/vs/other-ts-tools',
	},
	markdown: {
		// External links (anything with a protocol, e.g. https://) open in a new tab;
		// internal Starlight links stay relative (e.g. /how-speccraft-compares) so they're
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
			title: 'SpecCraft',
			description:
				'SpecCraft: write specs in TypeScript, check every order of events exhaustively, then check your real code against the spec.',
			tagline: 'Specs in TypeScript, checked in every order of events.',
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
					label: 'Formal TypeScript tools',
					items: [
						{ label: 'Overview', link: '/how-speccraft-compares' },
						{ label: 'fast-check', link: '/vs/fast-check' },
						{ label: 'Bombadil', link: '/vs/bombadil' },
						{ label: 'effect-machine', link: '/vs/effect-machine' },
						{ label: 'Hegel', link: '/vs/hegel' },
						{ label: 'LemmaScript', link: '/vs/lemmascript' },
						{ label: 'tla-precheck', link: '/vs/tla-precheck' },
						{ label: 'Polygraph', link: '/vs/polygraph' },
						{ label: 'stifinder', link: '/vs/stifinder' },
						{ label: 'pnueli', link: '/vs/pnueli' },
						{ label: 'stateproof', link: '/vs/stateproof' },
						{ label: 'Some more TS Tools', link: '/vs/other-ts-tools' },
					],
				},
				{
					label: 'Formal non-TypeScript tools',
					items: [
						{ label: 'Overview', link: '/tools/speccraft-vs-non-ts-tools' },
						{ label: 'Lean', link: '/tools/lean' },
						{ label: 'Dafny', link: '/tools/dafny' },
						{ label: 'Quint', link: '/tools/quint' },
					],
				},
				{
					label: 'Formal methods market',
					items: [
						{ label: 'Overview', link: '/market/' },
						{ label: 'Job listings', link: '/market/jobs' },
						{ label: 'Marketplaces', link: '/market/marketplaces' },
					],
				},
				{
					label: 'Durable execution',
					items: [
						{ label: 'The problems', link: '/durable-execution-problems' },
						{ label: 'Existing ecosystem', link: '/durable-workflow-correctness-tooling-research' },
						{ label: 'Known methods', link: '/approaches-to-correctness' },
						{ label: 'Config document workflow', link: '/case-study-config-document-workflow' },
					],
				},
			],
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/orgs/speccraft-io/repositories' },
				{ icon: 'npm', label: 'npm', href: 'https://www.npmjs.com/package/@speccraft-io/core' },
				{ icon: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/company/speccraft-io/' },
				{ icon: 'blueSky', label: 'Bluesky', href: 'https://bsky.app/profile/speccraft.bsky.social' },
			],
			lastUpdated: true,
			// No right-hand "On this page" table of contents on any page.
			tableOfContents: false,
		}),
	],
});
