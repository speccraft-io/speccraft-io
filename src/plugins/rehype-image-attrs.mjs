import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const publicDir = fileURLToPath(new URL('../../public', import.meta.url));

function pngSize(path) {
	const buf = readFileSync(path);
	return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function sizeOf(src) {
	if (!src || !src.startsWith('/')) return null;
	const png = publicDir + src.replace(/\.webp$/, '.png');
	return existsSync(png) ? pngSize(png) : null;
}

// Lazy-load every content image except the first, and give each one its real size so the page does not jump.
export default function rehypeImageAttrs() {
	return (tree) => {
		let index = 0;
		const visit = (node) => {
			if (node.type === 'element' && node.tagName === 'img') {
				const first = index++ === 0;
				const size = sizeOf(node.properties.src);
				if (size) {
					node.properties.width ??= size.width;
					node.properties.height ??= size.height;
				}
				node.properties.decoding = 'async';
				if (!first) node.properties.loading = 'lazy';
			} else if ((node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name === 'img') {
				const first = index++ === 0;
				const attrs = node.attributes;
				const get = (name) => attrs.find((a) => a.name === name)?.value;
				const set = (name, value) => {
					if (get(name) === undefined) attrs.push({ type: 'mdxJsxAttribute', name, value: String(value) });
				};
				const size = sizeOf(get('src'));
				if (size) {
					set('width', size.width);
					set('height', size.height);
				}
				set('decoding', 'async');
				if (!first) set('loading', 'lazy');
			} else if (node.type === 'raw' && node.value.includes('<img')) {
				node.value = node.value.replace(/<img\b([^>]*?)\s*(\/?)>/g, (tag, attrs, slash) => {
					const first = index++ === 0;
					const src = /\ssrc="([^"]+)"/.exec(attrs)?.[1];
					const add = (name, value) => {
						if (!new RegExp(`\\s${name}=`).test(attrs)) attrs += ` ${name}="${value}"`;
					};
					const size = sizeOf(src);
					if (size) {
						add('width', size.width);
						add('height', size.height);
					}
					add('decoding', 'async');
					if (!first) add('loading', 'lazy');
					return `<img${attrs}${slash ? ' /' : ''}>`;
				});
			}
			node.children?.forEach(visit);
		};
		visit(tree);
	};
}
