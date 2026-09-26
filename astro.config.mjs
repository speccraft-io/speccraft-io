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
		'/state-of-formal-methods-market': '/market/tools',
		'/market': '/market/tools',
		'/vs/fake-timers': '/typescript-formal-methods/other-ts-tools',
		'/vs/effect': '/typescript-formal-methods/other-ts-tools',
		'/how-speccraft-compares': '/',
		'/tools/speccraft-vs-non-ts-tools': '/',
		'/ts-tools': '/',
		'/tools/non-ts-tools': '/',
		'/case-study-config-document-workflow': '/case-studies/config-document-workflow',
		'/tools/tla-plus': '/formal-methods/tla-plus',
		'/tools/quint': '/formal-methods/quint',
		'/tools/dafny': '/formal-methods/dafny',
		'/tools/lean': '/formal-methods/lean',
		'/vs/bombadil': '/typescript-formal-methods/bombadil',
		'/vs/effect-machine': '/typescript-formal-methods/effect-machine',
		'/vs/fast-check': '/typescript-formal-methods/fast-check',
		'/vs/hegel': '/typescript-formal-methods/hegel',
		'/vs/lemmascript': '/typescript-formal-methods/lemmascript',
		'/vs/libpetri': '/typescript-formal-methods/libpetri',
		'/vs/other-ts-tools': '/typescript-formal-methods/other-ts-tools',
		'/vs/pnueli': '/typescript-formal-methods/pnueli',
		'/vs/polygraph': '/typescript-formal-methods/polygraph',
		'/vs/speccraft-ts': '/typescript-formal-methods/speccraft-ts',
		'/vs/stateproof': '/typescript-formal-methods/stateproof',
		'/vs/stifinder': '/typescript-formal-methods/stifinder',
		'/vs/tla-precheck': '/typescript-formal-methods/tla-precheck',
		'/vs/xstate': '/typescript-formal-methods/xstate',
	},
	markdown: {
		// External links (anything with a protocol, e.g. https://) open in a new tab;
		// internal Starlight links stay relative (e.g. /formal-methods/quint) so they're
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
					label: 'Non-TypeScript tools',
					items: [
						{ label: 'TLA+', link: '/formal-methods/tla-plus' },
						{ label: 'Quint', link: '/formal-methods/quint' },
						{ label: 'Dafny', link: '/formal-methods/dafny' },
						{ label: 'Lean', link: '/formal-methods/lean' },
					],
				},
				{
					label: 'TypeScript tools',
					items: [
						{ label: 'fast-check', link: '/typescript-formal-methods/fast-check' },
						{ label: 'Bombadil', link: '/typescript-formal-methods/bombadil' },
						{ label: 'effect-machine', link: '/typescript-formal-methods/effect-machine' },
						{ label: 'XState', link: '/typescript-formal-methods/xstate' },
						{ label: 'Hegel', link: '/typescript-formal-methods/hegel' },
						{ label: 'LemmaScript', link: '/typescript-formal-methods/lemmascript' },
						{ label: 'tla-precheck', link: '/typescript-formal-methods/tla-precheck' },
						{ label: 'libpetri', link: '/typescript-formal-methods/libpetri' },
						{ label: 'Polygraph', link: '/typescript-formal-methods/polygraph' },
						{ label: 'stifinder', link: '/typescript-formal-methods/stifinder' },
						{ label: 'pnueli', link: '/typescript-formal-methods/pnueli' },
						{ label: 'stateproof', link: '/typescript-formal-methods/stateproof' },
						{ label: 'Some more TS Tools', link: '/typescript-formal-methods/other-ts-tools' },
					],
				},
				{
					label: 'Use cases',
					collapsed: true,
					items: [
						{ label: 'Search as you type', link: '/use-cases/search-as-you-type' },
						{ label: 'Connect on first use', link: '/use-cases/connect-on-first-use' },
						{ label: 'Webhook handled twice', link: '/use-cases/webhook-double-charge' },
						{ label: 'Stock reservation', link: '/use-cases/stock-reservation' },
						{ label: 'Checkout button clicked twice', link: '/use-cases/checkout-double-click' },
						{ label: 'Canceled plan renewed', link: '/use-cases/subscription-renewal' },
						{ label: 'Checkout with Back', link: '/use-cases/checkout-back-button' },
						{ label: 'Transactional outbox', link: '/use-cases/transactional-outbox' },
						{ label: 'Lock with a lease', link: '/use-cases/lock-with-lease' },
						{ label: 'Crosswalk lights', link: '/use-cases/crosswalk-lights' },
						{ label: 'Ticket shop limit', link: '/use-cases/ticket-limit' },
						{ label: 'Terms unticked on the review page', link: '/use-cases/signup-terms' },
						{ label: 'Percentage discount with a cap', link: '/use-cases/discount-cap' },
						{ label: 'Bill split', link: '/use-cases/bill-split' },
						{ label: 'Binary search over sorted ids', link: '/use-cases/binary-search' },
						{ label: 'Cart reducer with a coupon', link: '/use-cases/cart-coupon' },
					],
				},
				{
					label: 'Case studies',
					collapsed: true,
					items: [
						{ label: 'Config document workflow', link: '/case-studies/config-document-workflow' },
						{ label: 'A small SQS clone', link: '/case-studies/node-sqs' },
					],
				},
				{
					label: 'Adoption',
					collapsed: true,
					items: [
						{ label: 'Job market', link: '/market/jobs' },
						{ label: 'Freelance market', link: '/market/marketplaces' },
						{ label: 'Practitioners', link: '/market/practitioners' },
						{ label: 'Industries', link: '/market/industries' },
						{ label: 'Tools', link: '/market/tools' },
						{ label: 'Public projects', link: '/market/public-repos' },
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
