// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeExternalLinks from 'rehype-external-links';

// https://astro.build/config
export default defineConfig({
	site: 'https://speccraft.io',
	redirects: {
		'/state-of-formal-methods-market': '/market/',
	},
	markdown: {
		// External links (anything with a protocol, e.g. https://) open in a new tab;
		// internal Starlight links stay relative (e.g. /how-speccraft-compares) so they're
		// untouched. The visual "external link" icon is CSS, keyed off target="_blank"
		// (see src/styles/custom.css).
		rehypePlugins: [[rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }]],
	},
	integrations: [
		starlight({
			// No site search: hides the header search bar and skips the Pagefind index.
			pagefind: false,
			title: 'SpecCraft',
			description:
				'SpecCraft — tooling to understand, verify, and test complex concurrent and durable-execution workflows, where the dangerous bugs live in interleavings no test suite ever samples.',
			tagline: 'Understand, verify, and test complex concurrent and durable-execution workflows.',
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
			},
			favicon: '/favicon.svg',
			head: [
				{ tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
				{ tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' } },
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' } },
				{ tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } },
				// Google Tag Manager — injected as high in <head> as Starlight allows.
				{
					tag: 'script',
					content:
						"(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':" +
						"new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0]," +
						"j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=" +
						"'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);" +
						"})(window,document,'script','dataLayer','GTM-N2BNSMZ6');",
				},
			],
			pagination: false,
			sidebar: [
				{ label: 'Home', link: '/' },
				{
					label: 'Other TypeScript Tools',
					items: [
						{ label: 'Overview', link: '/how-speccraft-compares' },
						{ label: 'LemmaScript', link: '/vs/lemmascript' },
						{ label: 'stateproof', link: '/vs/stateproof' },
						{ label: 'pnueli', link: '/vs/pnueli' },
						{ label: 'Polygraph', link: '/vs/polygraph' },
						{ label: 'tla-precheck', link: '/vs/tla-precheck' },
						{ label: 'stifinder', link: '/vs/stifinder' },
						{ label: 'effect-machine', link: '/vs/effect-machine' },
						{ label: 'Bombadil', link: '/vs/bombadil' },
						{ label: 'fast-check', link: '/vs/fast-check' },
						{ label: 'Hegel', link: '/vs/hegel' },
						{ label: 'Effect', link: '/vs/effect' },
						{ label: 'Fake timers', link: '/vs/fake-timers' },
						{ label: 'Other TS tools', link: '/vs/other-ts-tools' },
					],
				},
				{
					label: 'Other non-TypeScript Tools',
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
