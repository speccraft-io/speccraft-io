// Groups the tool pages by the kind of check they do, for the "Similar tools" box under Adoption.
type Tool = { label: string; link: string };

export const toolKinds: { kind: string; tools: Tool[] }[] = [
	{
		kind: 'Model checker as a library, run in-process',
		tools: [
			{ label: 'pnueli', link: '/vs/pnueli' },
			{ label: 'stifinder', link: '/vs/stifinder' },
			{ label: 'Polygraph', link: '/vs/polygraph' },
		],
	},
	{
		kind: 'TypeScript spec translated to TLA+, checked by TLC',
		tools: [
			{ label: 'tla-precheck', link: '/vs/tla-precheck' },
			{ label: 'stateproof', link: '/vs/stateproof' },
		],
	},
	{
		kind: 'Explore statecharts',
		tools: [
			{ label: 'effect-machine', link: '/vs/effect-machine' },
			{ label: 'XState', link: '/vs/xstate' },
		],
	},
	{
		kind: 'Sample inputs and orders',
		tools: [
			{ label: 'fast-check', link: '/vs/fast-check' },
			{ label: 'Hegel', link: '/vs/hegel' },
			{ label: 'Bombadil', link: '/vs/bombadil' },
		],
	},
	{
		kind: 'Prove a function for every input',
		tools: [
			{ label: 'LemmaScript', link: '/vs/lemmascript' },
			{ label: 'Dafny', link: '/tools/dafny' },
			{ label: 'Lean', link: '/tools/lean' },
		],
	},
];

/** The kind a page belongs to, and the other tools of that kind. */
export function similarTools(path: string): { kind: string; tools: Tool[] } | undefined {
	const clean = `/${path.replace(/^\/|\/$/g, '')}`;
	const group = toolKinds.find((g) => g.tools.some((t) => t.link === clean));
	const tools = group?.tools.filter((t) => t.link !== clean);
	return group && tools?.length ? { kind: group.kind, tools } : undefined;
}
