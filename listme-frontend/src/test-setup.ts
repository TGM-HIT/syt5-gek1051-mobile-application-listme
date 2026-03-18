// Set a proper HTTP base URL for happy-dom so that absolute asset paths like
// /icon.svg resolve to http://localhost:5173/icon.svg instead of file:///icon.svg
// (the latter is invalid on Windows when Node.js tries fileURLToPath on it).
if (typeof window !== 'undefined' && window.location.protocol !== 'http:') {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: Object.assign(Object.create(null), {
      href: 'http://localhost:5173/',
      protocol: 'http:',
      host: 'localhost:5173',
      hostname: 'localhost',
      port: '5173',
      origin: 'http://localhost:5173',
      pathname: '/',
      search: '',
      hash: '',
      assign: () => {},
      replace: () => {},
      reload: () => {},
    }),
  })
}
