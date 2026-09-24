// The quiet code theme from the SpecCraft design board (see /design): code in the text color, keywords in bold,
// comments in italic and punctuation in the muted color. No other syntax colors, so pink and green stay for diffs.
const palette = {
	light: { surface: '#ffffff', text: '#16131d', muted: '#5c5866' },
	dark: { surface: '#17141f', text: '#eceaf2', muted: '#a39eb0' },
};

function quietTheme(type) {
	const c = palette[type];
	return {
		name: `speccraft-quiet-${type}`,
		type,
		colors: {
			'editor.background': c.surface,
			'editor.foreground': c.text,
			'editorLineNumber.foreground': c.muted,
		},
		tokenColors: [
			{ settings: { foreground: c.text } },
			{ scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: c.muted, fontStyle: 'italic' } },
			{
				scope: ['keyword.control', 'keyword.operator.new', 'keyword.operator.expression', 'storage.type', 'storage.modifier'],
				settings: { foreground: c.text, fontStyle: 'bold' },
			},
			{ scope: ['punctuation', 'meta.brace', 'keyword.operator'], settings: { foreground: c.muted } },
			{ scope: ['string', 'constant', 'entity', 'variable', 'support', 'meta.type'], settings: { foreground: c.text } },
		],
	};
}

export const quietDark = quietTheme('dark');
export const quietLight = quietTheme('light');
