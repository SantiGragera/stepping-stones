const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/; // mínimo 8 caracteres, una mayúscula y un número

function esEmailValido(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

function esPasswordValida(password) {
  return typeof password === 'string' && PASSWORD_REGEX.test(password);
}

function esTextoNoVacio(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

// Sprint 4: el monto de una cobranza debe ser un número mayor a 0 (HU09 - Escenario 2).
function esMontoValido(monto) {
  if (monto === null || monto === undefined || monto === '') return false;
  const numero = Number(monto);
  return Number.isFinite(numero) && numero > 0;
}

// IDs de claves foráneas: enteros positivos.
function esIdValido(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0;
}

module.exports = { esEmailValido, esPasswordValida, esTextoNoVacio, esMontoValido, esIdValido };
