// Test helper: emulates the Cloudflare D1 API on top of Node's built-in SQLite.
import { DatabaseSync } from 'node:sqlite'
import type { D1Database, D1PreparedStatement, D1Result } from '../worker/types'

class Statement implements D1PreparedStatement {
  constructor(
    private db: DatabaseSync,
    readonly sql: string,
    readonly params: unknown[] = [],
  ) {}
  bind(...values: unknown[]) {
    return new Statement(this.db, this.sql, values)
  }
  private read() {
    return /^\s*(select|with)\b/i.test(this.sql) || /\breturning\b/i.test(this.sql)
  }
  exec(): D1Result {
    const stmt = this.db.prepare(this.sql)
    const params = this.params.map((v) => (v === undefined ? null : v)) as never[]
    if (this.read())
      return { results: stmt.all(...params) as never[], success: true, meta: { changes: 0 } }
    const info = stmt.run(...params)
    return { results: [], success: true, meta: { changes: Number(info.changes) } }
  }
  async first<T>() {
    return (this.exec().results[0] as T | undefined) ?? null
  }
  async all<T>() {
    return this.exec() as D1Result<T>
  }
  async run() {
    return this.exec()
  }
}

export function createD1(): D1Database {
  const db = new DatabaseSync(':memory:')
  return {
    prepare: (sql: string) => new Statement(db, sql),
    async batch(statements: D1PreparedStatement[]) {
      // Yield like a real network call, so concurrent requests interleave.
      await Promise.resolve()
      db.exec('BEGIN')
      try {
        const out = (statements as Statement[]).map((s) => s.exec())
        db.exec('COMMIT')
        return out
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    },
  }
}
