// Splits a bill in cents between people: everyone pays the same share, and the last person pays what is left.
export interface Split {
  each: number;
  last: number;
}

//@ verify
export function splitBill(total: number, people: number): Split {
  //@ requires total >= 0
  //@ requires people >= 1
  //@ ensures \result.each * (people - 1) + \result.last === total
  //@ ensures \result.last >= 0
  //@ ensures \result.each >= 0
  const each = Math.ceil(total / people);
  const last = total - each * (people - 1);
  return { each, last };
}
