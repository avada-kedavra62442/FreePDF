// Creates a lightweight unique identifier for in-memory UI items.
export function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
