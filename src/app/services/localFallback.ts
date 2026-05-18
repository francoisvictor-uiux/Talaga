import { ApiError } from "./api";

/**
 * localStorage-based fallback for backend endpoints that return 404.
 *
 * When the backend has not yet deployed the endpoints called by the
 * customer-sub-entity services (CustomerContacts, CustomerDrivers,
 * CustomerPricings, CustomerNaulages), the API layer surfaces a 404
 * `ApiError`. The service wrappers catch that specific error and switch to
 * a local persistent store with the same data shape, so the UI keeps
 * working until the backend ships those routes.
 */

export function isNotFound(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

export type LocalRow = {
  id: string;
  isActive: boolean;
  creationDate: string;
};

export function lsList<T extends LocalRow>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function lsSet<T extends LocalRow>(key: string, list: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // quota / private mode — silently skip
  }
}

function genId(): string {
  return `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function lsAdd<T extends LocalRow>(key: string, base: Omit<T, "id" | "isActive" | "creationDate">): T {
  const row = {
    ...(base as object),
    id: genId(),
    isActive: true,
    creationDate: new Date().toISOString(),
  } as T;
  const list = lsList<T>(key);
  list.push(row);
  lsSet(key, list);
  return row;
}

export function lsUpdate<T extends LocalRow>(key: string, id: string, patch: Partial<T>): T {
  const list = lsList<T>(key);
  const idx = list.findIndex(x => x.id === id);
  if (idx < 0) {
    // The id must come from a prior list/get on the same store, so this
    // should not happen in practice; surface a helpful error if it does.
    throw new Error("لم يتم العثور على السجل في التخزين المحلي");
  }
  const merged = { ...list[idx], ...patch, id: list[idx].id } as T;
  list[idx] = merged;
  lsSet(key, list);
  return merged;
}

export function lsDeactivate<T extends LocalRow>(key: string, id: string): void {
  const list = lsList<T>(key);
  const idx = list.findIndex(x => x.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], isActive: false };
  lsSet(key, list);
}
