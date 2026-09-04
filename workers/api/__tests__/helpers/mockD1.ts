// Minimal D1 mock: route SQL by regex, support batch(), count changes.
export interface MockHandler {
  match: RegExp;
  first?: (binds: unknown[]) => unknown;
  all?: (binds: unknown[]) => { results: unknown[] };
  run?: (binds: unknown[]) => { success: boolean; meta: { changes: number } };
}

export interface MockD1 {
  prepare(sql: string): {
    bind(...binds: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      all<T = unknown>(): Promise<{ results: T[] }>;
      run(): Promise<{ success: boolean; meta: { changes: number } }>;
    };
  };
  batch(stmts: { run(): Promise<unknown> }[]): Promise<unknown[]>;
  calls: { sql: string; binds: unknown[] }[];
}

export function createMockD1(handlers: MockHandler[]): MockD1 {
  const calls: { sql: string; binds: unknown[] }[] = [];
  function prepare(sql: string) {
    return {
      bind(...binds: unknown[]) {
        calls.push({ sql, binds });
        const h = handlers.find((x) => x.match.test(sql));
        if (!h) throw new Error(`mockD1: no handler for SQL: ${sql.slice(0, 120)}`);
        return {
          async first<T = unknown>() {
            return (h.first ? h.first(binds) : null) as T | null;
          },
          async all<T = unknown>() {
            return (h.all ? h.all(binds) : { results: [] }) as { results: T[] };
          },
          async run() {
            return h.run ? h.run(binds) : { success: true, meta: { changes: 1 } };
          },
        };
      },
    };
  }
  return {
    prepare,
    // D1 batches are atomic in prod; sequential execution is sufficient for
    // unit tests because no handler in these tests interleaves between stmts.
    async batch(stmts) {
      // Real D1 rejects an empty batch ("D1_ERROR: No SQL statements detected.");
      // Mirroring that here keeps callers honest about guarding empty statement lists.
      if (stmts.length === 0) throw new Error('D1_ERROR: No SQL statements detected.');
      const out = [];
      for (const s of stmts) out.push(await s.run());
      return out;
    },
    calls,
  };
}
