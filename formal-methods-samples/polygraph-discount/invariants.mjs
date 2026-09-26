// The rule, written by hand: the total is never negative.
export const stateInvariants = [
  { name: 'total-never-negative', pred: (s) => Math.round((s.items * 1000 * (100 - s.percent)) / 100) >= 0 },
];

export const transitionInvariants = [];
