const test = require('node:test');
const assert = require('node:assert');

process.env.JWT_SECRET = 'secreto-de-prueba';
const { generarToken, verificarToken } = require('../utils/jwt');

test('HU04: el token generado es un JWT válido con los datos del usuario', () => {
  const token = generarToken({ id_usuario: 2, nombre_rol: 'Secretaria' });
  assert.strictEqual(token.split('.').length, 3);

  const payload = verificarToken(token);
  assert.strictEqual(payload.id_usuario, 2);
  assert.strictEqual(payload.nombre_rol, 'Secretaria');
  assert.ok(payload.exp > payload.iat);
});

test('HU04: un token adulterado se rechaza', () => {
  const token = generarToken({ id_usuario: 2, nombre_rol: 'Secretaria' });
  const [header, , firma] = token.split('.');
  const payloadFalso = Buffer.from(JSON.stringify({ id_usuario: 1, nombre_rol: 'Directora', exp: 9999999999 })).toString('base64url');
  assert.strictEqual(verificarToken(`${header}.${payloadFalso}.${firma}`), null);
});

test('HU04: un token vencido se rechaza', () => {
  const token = generarToken({ id_usuario: 2 }, -1);
  assert.strictEqual(verificarToken(token), null);
});

test('HU04: valores basura se rechazan', () => {
  assert.strictEqual(verificarToken(undefined), null);
  assert.strictEqual(verificarToken('abc'), null);
  assert.strictEqual(verificarToken('a.b.c'), null);
});
