import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';

// Singleton asíncrono: futuras integraciones deben importar esta misma promesa.
// Un fallo devuelve null: auth.js bloquea el acceso sin recurrir a claves locales.
export const supabaseReady = initializeSupabase();

async function initializeSupabase() {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm');
    const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: sessionStorage,
        storageKey: 'cean.supabase.auth.v1',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
    console.info('Cliente de Supabase inicializado');
    return client;
  } catch (error) {
    console.warn('No se pudo inicializar Supabase. El acceso requiere conexión.', error);
    return null;
  }
}
