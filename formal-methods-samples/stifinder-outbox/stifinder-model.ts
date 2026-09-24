import type { EventDescriptor, Model } from 'stifinder';
import type { State } from './outbox.js';

export type Relay = typeof import('./outbox.js');

export type Event =
  | 'order service commits order and outbox row'
  | 'relay reads row'
  | 'relay publishes'
  | 'relay marks row sent'
  | 'broker times out after delivery'
  | 'relay crashes';

function expected(relay: Relay, s: State): EventDescriptor<Event>[] {
  if (s.outbox === 'none') {
    return [{ event: 'order service commits order and outbox row' }];
  }
  if (s.relay === 'idle' && s.outbox === 'pending') {
    return [{ event: 'relay reads row' }];
  }
  if (relay.publishing(s)) {
    return [{ event: 'relay publishes' }];
  }
  if (relay.marking(s)) {
    return [{ event: 'relay marks row sent' }];
  }
  return [];
}

const effects: Readonly<Record<Event, (relay: Relay, s: State) => State>> = {
  'order service commits order and outbox row': (_relay, s) => ({ ...s, outbox: 'pending' }),
  'relay reads row': (_relay, s) => ({ ...s, relay: 'read' }),
  'relay publishes': (relay, s) => relay.publish(s),
  'relay marks row sent': (relay, s) => relay.mark(s),
  'broker times out after delivery': (relay, s) => ({ ...s, applied: relay.consume(s.applied) }),
  'relay crashes': (_relay, s) => ({ ...s, relay: 'idle' }),
};

export function outboxModel(relay: Relay): Model<State, Event> {
  return {
    initialState: relay.initial,
    // Index 0 is the expected step; the rest are faults, each with its own budget key.
    getEvents: (s) => [
      ...expected(relay, s),
      ...(relay.publishing(s) ? [{ event: 'broker times out after delivery' as const, cost: ['retry'] }] : []),
      ...(s.relay === 'idle' ? [] : [{ event: 'relay crashes' as const, cost: ['crash'] }]),
    ],
    applyEvent: (s, e) => ({ to: effects[e](relay, s) }),
    invariant: (s) => (s.applied > 1 ? { error: new Error('the order was applied twice') } : undefined),
    // Checked only when no events are left.
    terminalInvariant: (s) =>
      s.applied === 0 ? { error: new Error('the committed order was never published') } : undefined,
  };
}
