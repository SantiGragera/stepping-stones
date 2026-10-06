const test = require('node:test');
const assert = require('node:assert');
const { esEmailValido, esPasswordValida, esTextoNoVacio, esMontoValido, esIdValido } = require('../utils/validators');
const { esMesValido } = require('../utils/meses');

test('HU02: formato de email', () => {
  assert.ok(esEmailValido('secretaria@steppingstones.com'));
  assert.ok(!esEmailValido('secretaria@'));
  assert.ok(!esEmailValido(''));
  assert.ok(!esEmailValido(undefined));
});

test('HU02: contraseña con mínimo 8 caracteres, una mayúscula y un número', () => {
  assert.ok(esPasswordValida('Clave1234'));
  assert.ok(esPasswordValida('Clave123!'));
  assert.ok(!esPasswordValida('clave1234'), 'sin mayúscula');
  assert.ok(!esPasswordValida('ClaveSinNumero'), 'sin número');
  assert.ok(!esPasswordValida('Cl4ve'), 'menos de 8 caracteres');
});

test('campos obligatorios', () => {
  assert.ok(esTextoNoVacio('Secretaria'));
  assert.ok(!esTextoNoVacio('   '));
  assert.ok(!esTextoNoVacio(null));
});

test('HU09 - Escenario 2: el monto debe ser mayor a 0', () => {
  assert.ok(esMontoValido(25000));
  assert.ok(esMontoValido('25000.50'));
  assert.ok(!esMontoValido(0));
  assert.ok(!esMontoValido(-100));
  assert.ok(!esMontoValido(''));
  assert.ok(!esMontoValido('abc'));
  assert.ok(!esMontoValido(null));
});

test('HU09: claves foráneas como enteros positivos', () => {
  assert.ok(esIdValido(1));
  assert.ok(esIdValido('3'));
  assert.ok(!esIdValido(0));
  assert.ok(!esIdValido('1.5'));
  assert.ok(!esIdValido(''));
});

test('HU09: mes correspondiente con formato "Mes Año"', () => {
  assert.ok(esMesValido('Marzo 2026'));
  assert.ok(esMesValido('Septiembre 2026'));
  assert.ok(!esMesValido('marzo 2026'));
  assert.ok(!esMesValido('Marzo'));
  assert.ok(!esMesValido('Mes 2026'));
});
