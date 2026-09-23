import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const docs = 'src/content/docs/';

function sourceFor(url) {
	const path = new URL(url).pathname.replace(/^\/|\/$/g, '');
	const bases = path === '' ? ['index'] : [path, `${path}/index`];
	for (const base of bases) {
		for (const ext of ['.md', '.mdx']) {
			const file = docs + base + ext;
			if (existsSync(root + file)) return file;
		}
	}
	return undefined;
}

// The page's last git commit, or the file's modified time before its first commit.
export function lastModified(url) {
	const file = sourceFor(url);
	if (!file) return undefined;
	try {
		const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], { cwd: root, encoding: 'utf8' }).trim();
		if (out) return new Date(out);
	} catch {}
	return statSync(root + file).mtime;
}
