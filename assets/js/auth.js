import { supabaseReady } from './supabase-client.js';

async function client() {
  const value = await supabaseReady;
  if (!value) throw new Error('No se pudo conectar con el servicio de acceso. Comprueba tu conexión y recarga la página.');
  return value;
}

function message(error) {
  if (error?.status === 429) return 'Demasiados intentos. Espera un momento antes de volver a entrar.';
  if (error?.code === 'email_not_confirmed') return 'Tu correo todavía no está habilitado. Consulta con CEAN.';
  if (error?.code === 'invalid_credentials' || error?.status === 400 || error?.status === 401) return 'Correo o contraseña incorrectos, o cuenta no habilitada.';
  return 'No se pudo verificar el acceso. Comprueba tu conexión e inténtalo otra vez.';
}

function profile(user) {
  if (!user?.id || !user?.email || !user.email_confirmed_at) throw new Error('Tu correo todavía no está habilitado. Consulta con CEAN.');
  return {
    id: `supabase:${user.id}`,
    name: String(user.user_metadata?.full_name || user.user_metadata?.name || user.email),
    username: user.email,
  };
}

// getUser consulta Auth: los datos guardados en el navegador no autorizan el acceso.
export async function restoreSession() {
  const sdk = await client();
  const { data: cached, error: sessionError } = await sdk.auth.getSession();
  if (sessionError) throw new Error(message(sessionError));
  if (!cached.session) return null;
  const { data, error } = await sdk.auth.getUser();
  if (error) {
    if (error.status === 401 || error.status === 403) {
      await sdk.auth.signOut({ scope: 'local' });
      return null;
    }
    throw new Error(message(error));
  }
  return profile(data.user);
}

export async function authenticate(email, password) {
  const sdk = await client();
  const { error } = await sdk.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(message(error));
  const verified = await restoreSession();
  if (!verified) throw new Error('No se pudo verificar tu sesión. Inténtalo otra vez.');
  return verified;
}

export async function logout() {
  const sdk = await client();
  const { error } = await sdk.auth.signOut({ scope: 'local' });
  if (error) throw new Error('No se pudo cerrar la sesión. Comprueba tu conexión e inténtalo otra vez.');
}

export async function onSessionEnded(callback) {
  const sdk = await client();
  // Ejecutar fuera del callback del SDK para evitar bloquear sus operaciones Auth.
  sdk.auth.onAuthStateChange(event => {
    if (event === 'SIGNED_OUT') setTimeout(callback, 0);
  });
}
