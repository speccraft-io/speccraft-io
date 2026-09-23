// The rules the cart must keep, written by hand: Polygraph derives the spec from the code, not the intent.
export const stateInvariants = [
  { name: 'coupon-needs-minimum-spend', pred: (s) => s.coupon === null || s.items * 1000 >= 2000 },
];

export const transitionInvariants = [];
