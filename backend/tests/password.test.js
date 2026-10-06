const test = require('node:test');
const assert = require('node:assert');
const { hashPassword, verifyPassword } = require('../utils/password');

test('HT2: la contraseña se guarda hasheada con salt aleatoria', () => {
  const h1 = hashPassword('Clave1234');
  const h2 = hashPassword('Clave1234');
  assert.notStrictEqual(h1, 'Clave1234');
  assert.match(h1, /^[0-9a-f]{32}:[0-9a-f]{128}$/);
  assert.notStrictEqual(h1, h2, 'misma contraseña => distinto hash por la salt');
});

test('HT2: verificación de contraseña hasheada', () => {
  const hash = hashPassword('Clave1234');
  assert.deepStrictEqual(verifyPassword('Clave1234', hash), { valid: true, legacy: false });
  assert.deepStrictEqual(verifyPassword('Otra1234', hash), { valid: false, legacy: false });
});

test('HT2: migración transparente de contraseñas legacy en texto plano', () => {
  assert.deepStrictEqual(verifyPassword('mlopez123', 'mlopez123'), { valid: true, legacy: true });
  assert.deepStrictEqual(verifyPassword('otra', 'mlopez123'), { valid: false, legacy: true });
});
