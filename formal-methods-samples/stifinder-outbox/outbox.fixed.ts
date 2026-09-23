export interface State {
  readonly outbox: 'none' | 'pending' | 'sent';
  readonly relay: 'idle' | 'read' | 'published' | 'marked';
  readonly applied: number;
}

export const initial: State = { outbox: 'none', relay: 'idle', applied: 0 };

export function consume(applied: number): number {
  return applied > 0 ? applied : applied + 1;
}

export function publishing(s: State): boolean {
  return s.relay === 'read';
}

export function marking(s: State): boolean {
  return s.relay === 'published';
}

export function publish(s: State): State {
  return { ...s, relay: 'published', applied: consume(s.applied) };
}

export function mark(s: State): State {
  return { ...s, outbox: 'sent', relay: 'idle' };
}
