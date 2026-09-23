export const DEBOUNCE_MS = 500;

export type SaveStatus = 'saved' | 'unsaved' | 'saving';

export interface AutosaveDeps {
  save: (text: string) => Promise<void>;
  schedule: (fire: () => void, ms: number) => () => void;
}

export const realDeps: AutosaveDeps = {
  save: async (text) => {
    const response = await fetch('/api/document', { method: 'PUT', body: text });
    if (!response.ok) {
      throw new Error(`save failed with ${String(response.status)}`);
    }
  },
  schedule: (fire, ms) => {
    const id = setTimeout(fire, ms);
    return () => {
      clearTimeout(id);
    };
  },
};

export class Autosave {
  text = '';
  savedText = '';
  status: SaveStatus = 'saved';
  private cancelTimer: (() => void) | undefined;
  private inFlight = false;
  private readonly deps: AutosaveDeps;

  constructor(deps: AutosaveDeps = realDeps) {
    this.deps = deps;
  }

  edit(text: string): void {
    this.text = text;
    this.status = 'unsaved';
    this.cancelTimer?.();
    this.cancelTimer = this.deps.schedule(() => {
      this.cancelTimer = undefined;
      this.flush();
    }, DEBOUNCE_MS);
  }

  flush(): void {
    if (this.inFlight) {
      return;
    }
    const text = this.text;
    this.inFlight = true;
    this.status = 'saving';
    this.deps.save(text).then(
      () => {
        this.onSaved(text);
      },
      (error: unknown) => {
        console.error(error);
        this.inFlight = false;
        this.status = 'unsaved';
      },
    );
  }

  onSaved(text: string): void {
    this.inFlight = false;
    this.savedText = text;
    this.status = this.text === text ? 'saved' : 'unsaved';
    if (this.text !== text && this.cancelTimer === undefined) {
      this.flush();
    }
  }
}
