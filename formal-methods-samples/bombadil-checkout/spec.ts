// One order per checkout: the page never shows more than one confirmation.
import { extract, always } from "@antithesishq/bombadil";
export * from "@antithesishq/bombadil/browser/defaults";

const confirmations = extract((state) =>
  state.document.body.querySelectorAll(".order").length,
);

export const at_most_one_order = always(() => confirmations.current <= 1);
