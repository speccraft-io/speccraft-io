// Groups the tool pages by the kind of check they do, for the "Similar tools" box under Adoption.
type Tool = { label: string; link: string };

export const toolKinds: { kind: string; tools: Tool[] }[] = [
	{
		kind: 'Model checker over a model written in TypeScript or JavaScript',
		tools: [
			{ label: 'pnueli', link: '/typescript-formal-method-tools/pnueli' },
			{ label: 'stifinder', link: '/typescript-formal-method-tools/stifinder' },
			{ label: 'Polygraph', link: '/typescript-formal-method-tools/polygraph' },
			{ label: 'SpecCraft TS', link: '/typescript-formal-method-tools/speccraft-ts' },
		],
	},
	{
		kind: 'Model in a spec language, checked by TLC or Apalache outside Node',
		tools: [
			{ label: 'tla-precheck', link: '/typescript-formal-method-tools/tla-precheck' },
			{ label: 'stateproof', link: '/typescript-formal-method-tools/stateproof' },
			{ label: 'TLA+', link: '/formal-method-tools/tla-plus' },
			{ label: 'Quint', link: '/formal-method-tools/quint' },
		],
	},
	{
		kind: 'Walk every state of the statechart the app runs',
		tools: [
			{ label: 'effect-machine', link: '/typescript-formal-method-tools/effect-machine' },
			{ label: 'XState', link: '/typescript-formal-method-tools/xstate' },
		],
	},
	{
		kind: 'Random inputs and action sequences, shrunk to the smallest failure',
		tools: [
			{ label: 'fast-check', link: '/typescript-formal-method-tools/fast-check' },
			{ label: 'Hegel', link: '/typescript-formal-method-tools/hegel' },
			{ label: 'Bombadil', link: '/typescript-formal-method-tools/bombadil' },
		],
	},
	{
		kind: 'Prove a function for every input',
		tools: [
			{ label: 'LemmaScript', link: '/typescript-formal-method-tools/lemmascript' },
			{ label: 'Dafny', link: '/formal-method-tools/dafny' },
			{ label: 'Lean', link: '/formal-method-tools/lean' },
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
