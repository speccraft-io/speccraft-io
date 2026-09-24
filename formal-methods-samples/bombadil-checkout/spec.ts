// One order per checkout: the page never shows more than one confirmation.
import { extract, always } from "@antithesishq/bombadil";
// Keep Bombadil's built-in checks and its default clicks.
export * from "@antithesishq/bombadil/browser/defaults";

// Runs in the browser in every state: how many "Order N confirmed" lines the page shows.
const confirmations = extract((state) =>
  state.document.body.querySelectorAll(".order").length,
);

// The rule, checked in every state: never more than one order.
export const at_most_one_order = always(() => confirmations.current <= 1);
