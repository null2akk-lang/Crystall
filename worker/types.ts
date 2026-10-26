// Minimal Cloudflare D1 / Worker types, so the project needs no extra packages.
export interface D1Meta {
  changes: number
}
export interface D1Result<T = unknown> {
  results: T[]
  success: boolean
  meta: D1Meta
}
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(): Promise<T | null>
  all<T = unknown>(): Promise<D1Result<T>>
  run(): Promise<D1Result>
}
export interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>
}
export interface Env {
  DB: D1Database
  ASSETS: { fetch(request: Request): Promise<Response> }
  /** Optional: overrides the built-in test access code of the developer panel. */
  CRYSTAL_ADMIN_CODE?: string
}
