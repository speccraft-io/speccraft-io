// Loads a report with two queries at once. Each query takes a connection from a pool of two and gives it back.
import { PetriNet, Transition, and, exactly, one, outPlace, place, xor } from 'libpetri';

export type Conn = { id: number };
export type Db = { query: (conn: Conn, table: string) => Promise<string[]> };

export const requests = place<string>('requests');
export const pool = place<Conn>('pool');
export const ordersJob = place<Conn>('ordersJob');
export const invoicesJob = place<Conn>('invoicesJob');
export const ordersRows = place<string[]>('ordersRows');
export const invoicesRows = place<string[]>('invoicesRows');
export const failed = place<Error>('failed');
export const reports = place<string>('reports');
export const errors = place<Error>('errors');

export function reportNet(db: Db) {
  // Take two connections and start both queries.
  const start = Transition.builder('start')
    .inputs(one(requests), exactly(2, pool))
    .outputs(and(outPlace(ordersJob), outPlace(invoicesJob)))
    .action(async (ctx) => {
      const [a, b] = ctx.inputs(pool);
      ctx.output(ordersJob, a!);
      ctx.output(invoicesJob, b!);
    })
    .build();

  const query = (name: string, job: typeof ordersJob, rows: typeof ordersRows, table: string) =>
    Transition.builder(name)
      .inputs(one(job))
      // The connection goes back to the pool whether the query succeeds or fails.
      .outputs(xor(and(outPlace(rows), outPlace(pool)), and(outPlace(failed), outPlace(pool))))
      .action(async (ctx) => {
        const conn = ctx.input(job);
        try {
          ctx.output(rows, await db.query(conn, table));
          ctx.output(pool, conn);
        } catch (error) {
          ctx.output(failed, error as Error);
          ctx.output(pool, conn);
        }
      })
      .build();

  const finish = Transition.builder('finish')
    .inputs(one(ordersRows), one(invoicesRows))
    .outputs(outPlace(reports))
    .action(async (ctx) => {
      ctx.output(reports, `${ctx.input(ordersRows).length} orders, ${ctx.input(invoicesRows).length} invoices`);
    })
    .build();

  const fail = Transition.builder('fail')
    .inputs(one(failed))
    .outputs(outPlace(errors))
    .action(async (ctx) => {
      ctx.output(errors, ctx.input(failed));
    })
    .build();

  return PetriNet.builder('report')
    .transitions(start, query('queryOrders', ordersJob, ordersRows, 'orders'),
      query('queryInvoices', invoicesJob, invoicesRows, 'invoices'), finish, fail)
    .build();
}
