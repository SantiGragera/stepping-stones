const crypto = require('crypto');

// Hashing de contraseñas con scrypt (módulo nativo de Node, sin dependencias externas).
// Formato guardado: "salt:hash" (ambos en hex).

const KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) {
    // Contraseña legacy (Sprint 1/2): todavía no está hasheada.
    return { valid: stored === password, legacy: true };
  }

  const [salt, hash] = stored.split(':');
  const hashBuffer = Buffer.from(hash, 'hex');
  const candidateBuffer = crypto.scryptSync(password, salt, KEY_LENGTH);

  if (hashBuffer.length !== candidateBuffer.length) {
    return { valid: false, legacy: false };
  }

  const valid = crypto.timingSafeEqual(hashBuffer, candidateBuffer);
  return { valid, legacy: false };
}

module.exports = { hashPassword, verifyPassword };
