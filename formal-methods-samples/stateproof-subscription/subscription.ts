// A subscription: a canceled plan runs to the end of its period, and the customer can resume it until then.
import { machine } from './vendor/stateproof/packages/core/src/index.ts';

export const subscription = machine('Subscription')
  .states('trial', 'active', 'canceling', 'canceled')
  .initial('trial')
  // Flat data next to the state: set when the customer cancels.
  .context({ canceledByUser: false })
  .transition('activate', { from: 'trial', to: 'active' })
  .transition('cancel', {
    from: 'active',
    to: 'canceling',
    action: (ctx) => {
      ctx.canceledByUser = true
    }
  })
  .transition('resume', {
    from: 'canceling',
    to: 'active',
    action: (ctx) => {
      ctx.canceledByUser = false
    }
  })
  .transition('renew', { from: ['active', 'canceling'], to: 'active' })
  .transition('expire', { from: 'canceling', to: 'canceled' })
  .transition('resubscribe', {
    from: 'canceled',
    to: 'active',
    action: (ctx) => {
      ctx.canceledByUser = false
    }
  })
  // Must hold in every reachable state.
  .invariant('canceled plans are not renewed', (ctx) => !(ctx.canceledByUser && ctx.state === 'active'))
