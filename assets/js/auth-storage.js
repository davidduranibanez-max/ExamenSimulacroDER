// OAuth necesita conservar el verificador PKCE durante el viaje a Google.
// Los tokens de sesión permanecen en memoria, nunca en Web Storage.
export function createAuthStorage(tabStorage) {
  const memory = new Map();
  const isVerifier = key => key.endsWith('-code-verifier');
  return {
    getItem(key) { return isVerifier(key) ? tabStorage.getItem(key) : memory.get(key) ?? null; },
    setItem(key, value) { if (isVerifier(key)) tabStorage.setItem(key, value); else memory.set(key, value); },
    removeItem(key) { if (isVerifier(key)) tabStorage.removeItem(key); else memory.delete(key); },
  };
}

export function clearAuthVerifiers(tabStorage, prefix) {
  for (let i = tabStorage.length - 1; i >= 0; i--) {
    const key = tabStorage.key(i);
    if (key?.startsWith(`${prefix}-`) && key.endsWith('-code-verifier')) tabStorage.removeItem(key);
  }
}
