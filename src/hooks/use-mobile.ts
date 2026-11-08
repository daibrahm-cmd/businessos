import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

// Assina mudanças do media query (largura da janela)
function subscribe(callback: () => void) {
  const mql = window.matchMedia(MEDIA_QUERY)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

// Valor atual no cliente
function getSnapshot() {
  return window.matchMedia(MEDIA_QUERY).matches
}

// No servidor não há janela: assume desktop (mesmo comportamento do hook original do shadcn)
function getServerSnapshot() {
  return false
}

// Reescrito com useSyncExternalStore para evitar setState dentro de useEffect
// (regra react-hooks/set-state-in-effect do ESLint do Next 16).
export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
