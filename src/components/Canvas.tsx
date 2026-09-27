// A read-only endless canvas (Excalidraw in view mode) for the /canvas page. The elements
// are hardcoded in canvas-seed.ts; visitors pan and zoom, nothing else. Excalidraw is
// imported at runtime, in the browser only: it needs `window`, and importing it during
// the static build fails. The canvas follows the site's light/dark theme.
import '@excalidraw/excalidraw/index.css';
import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import { useEffect, useState } from 'react';
import { seed } from './canvas-seed';

type Theme = 'light' | 'dark';
type Module = typeof import('@excalidraw/excalidraw');
type Ready = { m: Module; initialData: ExcalidrawInitialDataState };

// The label sizes are measured when the elements are built. Excalidraw loads its hand-drawn
// font lazily, so the first measurement uses a fallback font and the labels come out clipped.
// Once the font is in, the elements are built again with the right sizes.
async function rebuildWhenFontLoads(m: Module, api: ExcalidrawImperativeAPI) {
	try {
		await document.fonts.load('20px Excalifont');
		await document.fonts.ready;
	} catch {
		return;
	}
	api.updateScene({ elements: m.convertToExcalidrawElements(seed, { regenerateIds: false }) });
}

function readTheme(): Theme {
	return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export default function Canvas() {
	const [theme, setTheme] = useState<Theme>('dark');
	const [ready, setReady] = useState<Ready>();

	useEffect(() => {
		setTheme(readTheme());
		const observer = new MutationObserver(() => setTheme(readTheme()));
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		let cancelled = false;
		import('@excalidraw/excalidraw').then((m) => {
			if (cancelled) return;
			setReady({
				m,
				initialData: {
					elements: m.convertToExcalidrawElements(seed, { regenerateIds: false }),
					scrollToContent: true,
				},
			});
		});
		return () => {
			cancelled = true;
		};
	}, []);

	if (!ready) return null;

	return (
		<ready.m.Excalidraw
			theme={theme}
			initialData={ready.initialData}
			excalidrawAPI={(api) => rebuildWhenFontLoads(ready.m, api)}
			viewModeEnabled
			zenModeEnabled
			UIOptions={{
				canvasActions: {
					changeViewBackgroundColor: false,
					clearCanvas: false,
					export: false,
					loadScene: false,
					saveAsImage: false,
					saveToActiveFile: false,
					toggleTheme: false,
				},
				tools: { image: false },
			}}
		/>
	);
}
