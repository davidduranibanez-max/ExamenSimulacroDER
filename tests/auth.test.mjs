import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccessService } from '../assets/js/auth-service.js';
import { createAuthStorage, clearAuthVerifiers } from '../assets/js/auth-storage.js';
import { accessSql } from '../scripts/prepare-access.mjs';

const user = { id: 'uuid-1', email: 'alumno@example.com', email_confirmed_at: '2026-10-07',
  identities: [{ provider: 'google' }], user_metadata: { full_name: 'Alumno' } };
function mock({ allowed = true, account = user, userError = null, rpcError = null, exchangeError = null } = {}) {
  const calls = [];
  const sdk = {
    auth: {
      signInWithOAuth: async options => { calls.push(['oauth', options]); return { data: { url: 'https://project.supabase.co/auth/v1/authorize' } }; },
      exchangeCodeForSession: async code => { calls.push(['exchange', code]); return { error: exchangeError }; },
      getUser: async () => { calls.push(['user']); return { data: { user: account }, error: userError }; },
      signOut: async options => { calls.push(['logout', options]); return {}; },
    },
    rpc: async (...args) => { calls.push(['rpc', ...args]); return { data: allowed, error: rpcError }; },
  };
  return { calls, service: createAccessService(async () => sdk, 'https://example.com/ExamenSimulacroDER/') };
}

test('Google usa el prefijo de Pages y selección explícita de cuenta', async () => {
  const { calls, service } = mock(); await service.beginGoogleSignIn();
  assert.equal(calls[0][1].provider, 'google');
  assert.equal(calls[0][1].options.redirectTo, 'https://example.com/ExamenSimulacroDER/');
  assert.equal(calls[0][1].options.queryParams.prompt, 'select_account');
});
test('solo autoriza después de canjear el código, validar Auth y consultar permisos remotos', async () => {
  const { calls, service } = mock();
  assert.deepEqual(await service.completeGoogleSignIn('one-use-code'), { id: 'supabase:uuid-1', name: 'Alumno', username: user.email });
  assert.deepEqual(calls, [['exchange', 'one-use-code'], ['user'], ['rpc', 'cean_has_access']]);
});
test('correo fuera de lista, respuesta no booleana o RPC inexistente cierran y bloquean la sesión', async () => {
  for (const options of [{ allowed: false }, { allowed: 'true' }, { rpcError: { code: 'PGRST202' } }]) {
    const { calls, service } = mock(options);
    await assert.rejects(service.verifyAccess(), /autorizado|configurar/);
    assert.deepEqual(calls.at(-1), ['logout', { scope: 'local' }]);
  }
});
test('sesión falsificada, usuario sin Google y fallo PKCE no llegan a consultar permisos', async () => {
  for (const options of [{ userError: { status: 401 } }, { account: { ...user, identities: [] } },
    { account: { ...user, email_confirmed_at: null } }, { exchangeError: { status: 400 } }]) {
    const { calls, service } = mock(options);
    await assert.rejects(service.completeGoogleSignIn('invalid'));
    assert.ok(!calls.some(call => call[0] === 'rpc'));
    assert.equal(calls.at(-1)[0], 'logout');
  }
});
test('una caída de red nunca autoriza ni usa cuentas locales', async () => {
  const service = createAccessService(async () => { throw new Error('Sin conexión'); }, 'https://example.com/');
  await assert.rejects(service.beginGoogleSignIn(), /conexión/);
  await assert.rejects(service.verifyAccess(), /conexión/);
});
test('el verificador PKCE sobrevive la redirección; los tokens no sobreviven recarga', () => {
  const tab = new Map(), storage = { get length() { return tab.size; }, key: i => [...tab.keys()][i], getItem: key => tab.get(key) ?? null,
    setItem: (key, value) => tab.set(key, value), removeItem: key => tab.delete(key) };
  const first = createAuthStorage(storage);
  first.setItem('auth', 'secret-session'); first.setItem('auth-code-verifier', 'pkce-verifier');
  assert.equal(tab.has('auth'), false); assert.equal(first.getItem('auth'), 'secret-session');
  const reloaded = createAuthStorage(storage);
  assert.equal(reloaded.getItem('auth'), null); assert.equal(reloaded.getItem('auth-code-verifier'), 'pkce-verifier');
  reloaded.removeItem('auth-code-verifier'); assert.equal(tab.size, 0);
  tab.set('auth-flows-code-verifier', 'flow-index'); tab.set('auth-flow-123-code-verifier', 'verifier');
  tab.set('exam-history', 'preserved');
  clearAuthVerifiers(storage, 'auth');
  assert.deepEqual([...tab.entries()], [['exam-history', 'preserved']]);
});
test('carga masiva normaliza, elimina duplicados y conserva bajas sin crear contraseñas', () => {
  const sql = accessSql('\uFEFFemail\r\nAlumno@Example.com\r\n"alumno@example.com"\r\notro@example.com\r\n');
  assert.match(sql, /2 correos únicos/); assert.match(sql, /on conflict \(email\) do nothing/);
  assert.equal(sql.match(/\('alumno@example.com'\)/g).length, 1);
  assert.doesNotMatch(sql, /update|password/);
});
test('carga masiva rechaza columnas extra e input inválido y escapa comillas SQL', () => {
  for (const input of ['', 'email', 'hola', 'a@example.com,b@example.com', 'a@example.com;Nombre']) assert.throws(() => accessSql(input));
  assert.match(accessSql("o'connor@example.com"), /o''connor@example.com/);
});
