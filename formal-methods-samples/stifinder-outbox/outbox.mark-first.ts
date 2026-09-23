import type { State } from './outbox.js';

export const initial: State = { outbox: 'none', relay: 'idle', applied: 0 };

export function consume(applied: number): number {
  return applied > 0 ? applied : applied + 1;
}

export function publishing(s: State): boolean {
  return s.relay === 'marked';
}

export function marking(s: State): boolean {
  return s.relay === 'read';
}

export function publish(s: State): State {
  return { ...s, relay: 'idle', applied: consume(s.applied) };
}

export function mark(s: State): State {
  return { ...s, outbox: 'sent', relay: 'marked' };
}
