import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';

// Singleton asíncrono: futuras integraciones deben importar esta misma promesa.
// La carga independiente permite seguir usando el simulacro si el CDN falla.
export const supabaseReady = initializeSupabase();

async function initializeSupabase() {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm');
    const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    console.info('Cliente de Supabase inicializado');
    return client;
  } catch (error) {
    console.warn('No se pudo inicializar Supabase. El simulacro local sigue disponible.', error);
    return null;
  }
}
