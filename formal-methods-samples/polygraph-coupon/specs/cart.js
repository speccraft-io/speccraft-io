// The spec of cart.ts, as Polygraph's LLM step would derive it from the code: a SAM v2 strict-profile module.
'use strict';

const { createInstance } = require('@cognitive-fab/sam-pattern');

const instance = createInstance({ strict: true, hasAsyncActions: false, instanceName: 'cart' });

const INITIAL_STATE = { items: 0, coupon: null };

const control = instance({
  initialState: JSON.parse(JSON.stringify(INITIAL_STATE)),
  component: {
    modelShape: {
      items: { type: 'number' },
      coupon: { type: 'string', nullable: true },
    },
    actions: {
      ADD_ITEM: { action: (data = {}) => ({ ...data }), schema: {}, domain: [{}] },
      REMOVE_ITEM: { action: (data = {}) => ({ ...data }), schema: {}, domain: [{}] },
      APPLY_COUPON: {
        action: (data = {}) => ({ ...data }),
        schema: { code: { type: 'string' } },
        domain: [{ code: 'SAVE5' }, { code: 'SAVE10' }],
      },
    },
    acceptors: {
      ADD_ITEM: (model) => (proposal, { reject, next, unchanged }) => {
        if (model.items === 3) return reject('cart-full');
        next.items = model.items + 1;
        unchanged('coupon');
      },
      REMOVE_ITEM: (model) => (proposal, { reject, next, unchanged }) => {
        if (model.items === 0) return reject('cart-empty');
        next.items = model.items - 1;
        unchanged('coupon');
      },
      APPLY_COUPON: (model) => (proposal, { reject, next, unchanged }) => {
        if (proposal.code !== 'SAVE5') return reject('unknown-code');
        if (model.items * 1000 < 2000) return reject('below-minimum');
        next.coupon = 'SAVE5';
        unchanged('items');
      },
    },
    reactors: [],
  },
});

const { intents } = control;

const getState = () => instance({}).getState();
const setState = (snapshot) => { instance({}).setState(snapshot); };

const init = () => {
  try {
    const model = instance({}).state();
    if (model && typeof model.clearError === 'function') model.clearError();
  } catch { /* best effort, as in Polygraph's own examples */ }
  setState(INITIAL_STATE);
};

const actions = {
  ADD_ITEM: (data = {}) => intents.ADD_ITEM(data),
  REMOVE_ITEM: (data = {}) => intents.REMOVE_ITEM(data),
  APPLY_COUPON: (data = {}) => intents.APPLY_COUPON(data),
};

module.exports = { instance, init, actions, getState, setState };
