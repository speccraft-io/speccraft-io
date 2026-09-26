// Groups the tool pages by the kind of check they do, for the "Similar tools" box under Adoption.
type Tool = { label: string; link: string };

export const toolKinds: { kind: string; tools: Tool[] }[] = [
	{
		kind: 'Model checker over a model written in TypeScript or JavaScript',
		tools: [
			{ label: 'pnueli', link: '/typescript-formal-methods/pnueli' },
			{ label: 'stifinder', link: '/typescript-formal-methods/stifinder' },
			{ label: 'Polygraph', link: '/typescript-formal-methods/polygraph' },
			{ label: 'SpecCraft TS', link: '/typescript-formal-methods/speccraft-ts' },
		],
	},
	{
		kind: 'Model in a spec language, checked by TLC or Apalache outside Node',
		tools: [
			{ label: 'tla-precheck', link: '/typescript-formal-methods/tla-precheck' },
			{ label: 'stateproof', link: '/typescript-formal-methods/stateproof' },
			{ label: 'TLA+', link: '/formal-methods/tla-plus' },
			{ label: 'Quint', link: '/formal-methods/quint' },
		],
	},
	{
		kind: 'Walk every state of the statechart the app runs',
		tools: [
			{ label: 'effect-machine', link: '/typescript-formal-methods/effect-machine' },
			{ label: 'XState', link: '/typescript-formal-methods/xstate' },
		],
	},
	{
		kind: 'Random inputs and action sequences, shrunk to the smallest failure',
		tools: [
			{ label: 'fast-check', link: '/typescript-formal-methods/fast-check' },
			{ label: 'Hegel', link: '/typescript-formal-methods/hegel' },
			{ label: 'Bombadil', link: '/typescript-formal-methods/bombadil' },
		],
	},
	{
		kind: 'Prove a function for every input',
		tools: [
			{ label: 'LemmaScript', link: '/typescript-formal-methods/lemmascript' },
			{ label: 'Dafny', link: '/formal-methods/dafny' },
			{ label: 'Lean', link: '/formal-methods/lean' },
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
