// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://speccraft.io',
	integrations: [
		starlight({
			title: 'SpecCraft',
			description:
				'SpecCraft — tooling to understand, verify, and test complex concurrent and durable-execution workflows, where the dangerous bugs live in interleavings no test suite ever samples.',
			tagline: 'Understand, verify, and test complex concurrent and durable-execution workflows.',
			logo: { src: './src/assets/speccraft-logo.png', alt: 'SpecCraft' },
			customCss: ['./src/styles/custom.css'],
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
				{ label: 'Notes', items: [{ autogenerate: { directory: 'notes' } }] },
			],
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/speccraft-io' },
			],
			lastUpdated: true,
		}),
	],
});
