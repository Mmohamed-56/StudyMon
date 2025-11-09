// Development helper to clear session on dev server start
// This runs only in development mode
if (import.meta.env.DEV) {
  // Uncomment the line below to auto-logout on dev server restart
  // localStorage.clear()
}

export const clearDevSession = () => {
  if (import.meta.env.DEV) {
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  }
}

