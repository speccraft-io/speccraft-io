// The spec of cart.ts, as Polygraph's LLM step would derive it from the code: a SAM v2 strict-profile module.
'use strict';

const { createInstance } = require('@cognitive-fab/sam-pattern');

const instance = createInstance({ strict: true, hasAsyncActions: false, instanceName: 'cart' });

const INITIAL_STATE = { items: 0, percent: 0 };

const control = instance({
  initialState: JSON.parse(JSON.stringify(INITIAL_STATE)),
  component: {
    modelShape: {
      items: { type: 'number' },
      percent: { type: 'number' },
    },
    actions: {
      ADD_ITEM: { action: (data = {}) => ({ ...data }), schema: {}, domain: [{}] },
      APPLY_DISCOUNT: {
        action: (data = {}) => ({ ...data }),
        schema: { percent: { type: 'number' } },
        // The values the model checker tries, copied from the contract.
        domain: [{ percent: 10 }, { percent: 50 }],
      },
    },
    acceptors: {
      ADD_ITEM: (model) => (proposal, { reject, next, unchanged }) => {
        if (model.items === 3) return reject('cart-full');
        next.items = model.items + 1;
        unchanged('percent');
      },
      APPLY_DISCOUNT: (model) => (proposal, { reject, next, unchanged }) => {
        next.percent = proposal.percent;
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
  APPLY_DISCOUNT: (data = {}) => intents.APPLY_DISCOUNT(data),
};

module.exports = { instance, init, actions, getState, setState };
