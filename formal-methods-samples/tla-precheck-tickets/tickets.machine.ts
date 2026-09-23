// A ticket shop: customers hold a seat, then buy it or let it go, and a sold seat can be refunded. Each customer may have one seat, held or sold.
import {
  and, count, defineMachine, domainType, enumType, eq, forall, ids, index, lit, lte,
  mapVar, modelValues, optionType, param, setMap, variable
} from "tla-precheck";

const status = variable("status");
const holder = variable("holder");

export const ticketsMachine = defineMachine({
  version: 2,
  moduleName: "Tickets",
  variables: {
    status: mapVar("Seats", enumType("free", "held", "sold"), lit("free")),
    holder: mapVar("Seats", optionType(domainType("Customers")), lit(null))
  },
  actions: {
    hold: {
      params: { s: "Seats", c: "Customers" },
      guard: and(
        eq(index(status, param("s")), lit("free")),
        eq(count("Seats", "x", and(
          eq(index(holder, param("x")), param("c")),
          eq(index(status, param("x")), lit("held"))
        )), lit(0))
      ),
      updates: [setMap("status", param("s"), lit("held")), setMap("holder", param("s"), param("c"))]
    },
    buy: {
      params: { s: "Seats", c: "Customers" },
      guard: and(eq(index(status, param("s")), lit("held")), eq(index(holder, param("s")), param("c"))),
      updates: [setMap("status", param("s"), lit("sold"))]
    },
    release: {
      params: { s: "Seats" },
      guard: eq(index(status, param("s")), lit("held")),
      updates: [setMap("status", param("s"), lit("free")), setMap("holder", param("s"), lit(null))]
    },
    refund: {
      params: { s: "Seats" },
      guard: eq(index(status, param("s")), lit("sold")),
      updates: [setMap("status", param("s"), lit("free")), setMap("holder", param("s"), lit(null))]
    }
  },
  invariants: {
    oneSeatPerCustomer: {
      description: "A customer never has more than one seat, held or sold",
      formula: forall("Customers", "c", lte(count("Seats", "x", eq(index(holder, param("x")), param("c"))), lit(1)))
    }
  },
  proof: {
    defaultTier: "pr",
    tiers: {
      pr: {
        domains: {
          Customers: modelValues("c", { size: 2, symmetry: true }),
          Seats: ids({ prefix: "s", size: 3 })
        },
        budgets: { maxEstimatedStates: 1000, maxEstimatedBranching: 20 }
      }
    }
  }
});

export default ticketsMachine;
