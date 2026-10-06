const { verificarToken } = require('../utils/jwt');

// HU04: toda petición a rutas privadas debe traer el JWT generado en el login
// en el header "Authorization: Bearer <token>".
function requiereAutenticacion(req, res, next) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');

  const payload = tipo === 'Bearer' ? verificarToken(token) : null;
  if (!payload) {
    return res.status(401).json({ mensaje: 'Sesión inválida o expirada. Iniciá sesión nuevamente.' });
  }

  req.usuario = payload; // { id_usuario, email, id_rol, nombre_rol, ... }
  next();
}

// Restringe una ruta a ciertos roles (por nombre, tal como figuran en la tabla roles).
function permitirRoles(...rolesPermitidos) {
  const normalizados = rolesPermitidos.map(normalizar);

  return (req, res, next) => {
    if (!req.usuario || !normalizados.includes(normalizar(req.usuario.nombre_rol))) {
      return res.status(403).json({ mensaje: 'No tenés permisos para realizar esta acción.' });
    }
    next();
  };
}

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

module.exports = { requiereAutenticacion, permitirRoles };
