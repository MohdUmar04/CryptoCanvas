export type StatusKind = 'idle' | 'success' | 'error'

export type Status = { kind: StatusKind; message?: string }

export type Result<T> = { ok: true; value: T } | { ok: false; error: string }

export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function err<T = never>(error: unknown): Result<T> {
  const message = error instanceof Error ? error.message : String(error)
  return { ok: false, error: message }
}
