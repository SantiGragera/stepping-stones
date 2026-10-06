const crypto = require('crypto');

// HU04 - Token de sesión seguro (JSON Web Token).
// Implementación de JWT con firma HS256 usando el módulo nativo crypto de Node,
// siguiendo el mismo criterio de Sprint 3: no sumar dependencias externas.
// Formato estándar: base64url(header).base64url(payload).base64url(firma)

const DURACION_POR_DEFECTO = 8 * 60 * 60; // 8 horas, en segundos

let secretoGenerado = null;

function obtenerSecreto() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  // Sin JWT_SECRET en el .env el servidor igual arranca, pero con un secreto
  // aleatorio en memoria: los tokens dejan de valer cuando se reinicia Node.
  if (!secretoGenerado) {
    secretoGenerado = crypto.randomBytes(32).toString('hex');
    console.warn('JWT_SECRET no está definido en backend/.env: se usa un secreto temporal.');
  }
  return secretoGenerado;
}

function base64url(entrada) {
  return Buffer.from(entrada).toString('base64url');
}

function firmar(contenido) {
  return crypto.createHmac('sha256', obtenerSecreto()).update(contenido).digest('base64url');
}

function generarToken(payload, duracionSegundos = DURACION_POR_DEFECTO) {
  const ahora = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const cuerpo = base64url(JSON.stringify({ ...payload, iat: ahora, exp: ahora + duracionSegundos }));
  return `${header}.${cuerpo}.${firmar(`${header}.${cuerpo}`)}`;
}

// Devuelve el payload si el token es válido y no venció; si no, devuelve null.
function verificarToken(token) {
  if (typeof token !== 'string') return null;

  const partes = token.split('.');
  if (partes.length !== 3) return null;

  const [header, cuerpo, firma] = partes;
  const firmaEsperada = Buffer.from(firmar(`${header}.${cuerpo}`));
  const firmaRecibida = Buffer.from(firma);

  // Comparación en tiempo constante, igual que con las contraseñas.
  if (firmaEsperada.length !== firmaRecibida.length || !crypto.timingSafeEqual(firmaEsperada, firmaRecibida)) {
    return null;
  }

  try {
    const { alg } = JSON.parse(Buffer.from(header, 'base64url').toString());
    if (alg !== 'HS256') return null;

    const payload = JSON.parse(Buffer.from(cuerpo, 'base64url').toString());
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

module.exports = { generarToken, verificarToken };
