/** Tiny external store for the active mermaid color scheme. */
let colorScheme = 'light'
const listeners = new Set()

export function getColorScheme() {
  return colorScheme
}

export function subscribeColorScheme(listener) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function setColorScheme(value) {
  if (value === colorScheme) return
  colorScheme = value
  for (const listener of listeners) listener()
}
