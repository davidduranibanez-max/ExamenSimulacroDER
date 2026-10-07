const DENIED = 'Este correo no tiene acceso autorizado. Usa la cuenta habilitada por CEAN.';
const CONNECTION = 'No se pudo verificar el acceso. Comprueba tu conexión e inténtalo otra vez.';

function message(error) {
  if (error?.status === 429) return 'Demasiados intentos. Espera un momento antes de volver a entrar.';
  if (error?.code === 'PGRST202' || error?.code === '42883') return 'CEAN todavía no ha terminado de configurar el acceso. Contacta con el docente.';
  if ([400, 401, 403].includes(error?.status)) return 'No se pudo completar el acceso con Google. Inténtalo otra vez con tu cuenta autorizada.';
  return CONNECTION;
}

export function createAccessService(getClient, redirectTo) {
  async function reject(sdk, text) {
    try { await sdk.auth.signOut({ scope: 'local' }); } catch { /* El acceso sigue bloqueado aunque falle el cierre remoto. */ }
    throw new Error(text);
  }
  return {
    async beginGoogleSignIn() {
      const sdk = await getClient();
      const { data, error } = await sdk.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
      });
      if (error || !data?.url) throw new Error(error ? message(error) : CONNECTION);
      return data.url;
    },
    async completeGoogleSignIn(code) {
      const sdk = await getClient();
      const { error } = await sdk.auth.exchangeCodeForSession(code);
      if (error) return reject(sdk, message(error));
      return this.verifyAccess();
    },
    async verifyAccess() {
      const sdk = await getClient();
      const { data, error } = await sdk.auth.getUser();
      if (error) return reject(sdk, message(error));
      const user = data?.user;
      if (!user?.id || !user.email || !user.email_confirmed_at ||
          !user.identities?.some(identity => identity.provider === 'google')) return reject(sdk, DENIED);
      // No recibe un correo del cliente: el servidor obtiene la identidad del JWT.
      const { data: allowed, error: accessError } = await sdk.rpc('cean_has_access');
      if (accessError) return reject(sdk, message(accessError));
      if (allowed !== true) return reject(sdk, DENIED);
      return {
        id: `supabase:${user.id}`,
        name: String(user.user_metadata?.full_name || user.user_metadata?.name || user.email),
        username: user.email,
      };
    },
    async logout() {
      const sdk = await getClient();
      const { error } = await sdk.auth.signOut({ scope: 'local' });
      if (error) throw new Error('No se pudo cerrar la sesión. Comprueba tu conexión e inténtalo otra vez.');
    },
  };
}
