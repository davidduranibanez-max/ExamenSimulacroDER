import { supabaseReady } from './supabase-client.js';
import { createAccessService } from './auth-service.js';
import { clearAuthVerifiers } from './auth-storage.js';

async function client() {
  const value = await supabaseReady;
  if (!value) throw new Error('No se pudo conectar con el servicio de acceso. Comprueba tu conexión y recarga la página.');
  return value;
}

const service = createAccessService(client, new URL('../../', import.meta.url).href);
const clearVerifiers = () => clearAuthVerifiers(sessionStorage, 'cean.supabase.auth.v1');
export async function beginGoogleSignIn() {
  clearVerifiers();
  try { return await service.beginGoogleSignIn(); }
  catch (error) { clearVerifiers(); throw error; }
}
export const verifyAccess = () => service.verifyAccess();
export async function logout() { await service.logout(); clearVerifiers(); }

export async function completeGoogleSignIn() {
  const url = new URL(location.href);
  const code = url.searchParams.get('code');
  const oauthError = url.searchParams.has('error') || url.searchParams.has('error_description');
  if (!code && !oauthError) return null;
  for (const key of ['code', 'error', 'error_code', 'error_description']) url.searchParams.delete(key);
  history.replaceState(null, '', url.pathname + url.search + url.hash);
  if (oauthError) { clearVerifiers(); throw new Error('El acceso con Google fue cancelado o tu correo no está autorizado. Inténtalo otra vez o consulta con CEAN.'); }
  try { return await service.completeGoogleSignIn(code); }
  finally { clearVerifiers(); }
}

export async function onSessionEnded(callback) {
  const sdk = await client();
  // Ejecutar fuera del callback del SDK para evitar bloquear sus operaciones Auth.
  sdk.auth.onAuthStateChange(event => {
    if (event === 'SIGNED_OUT') setTimeout(callback, 0);
  });
}
