const express = require('express');
const crypto = require('crypto');

const db = require('../config/db');
const transporter = require('../config/mailer');
const { hashPassword, verifyPassword } = require('../utils/password');
const { esEmailValido, esPasswordValida, esTextoNoVacio } = require('../utils/validators');
const { generarToken } = require('../utils/jwt');

const router = express.Router();

// HU04 - Escenario 1: mismo mensaje si falla el email o la contraseña,
// para no revelar cuál de los dos campos es el incorrecto.
const MENSAJE_CREDENCIALES_INVALIDAS = 'Error: Credenciales inválidas';

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!esEmailValido(email) || !esTextoNoVacio(password)) {
    return res.status(400).json({ mensaje: 'Email y contraseña son obligatorios' });
  }

  const query = `
    SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.id_rol, r.nombre_rol, u.password
    FROM usuarios u
    INNER JOIN roles r ON r.id_rol = u.id_rol
    WHERE u.email = ?`;

  db.query(query, [email.trim()], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }

    if (results.length === 0) {
      return res.status(401).json({ mensaje: MENSAJE_CREDENCIALES_INVALIDAS });
    }

    const usuario = results[0];
    const { valid, legacy } = verifyPassword(password, usuario.password);

    if (!valid) {
      return res.status(401).json({ mensaje: MENSAJE_CREDENCIALES_INVALIDAS });
    }

    // Migración transparente: si la contraseña todavía estaba en texto plano
    // (cuentas creadas en Sprint 1/2), la re-hasheamos al primer login exitoso.
    if (legacy) {
      const nuevoHash = hashPassword(password);
      db.query('UPDATE usuarios SET password = ? WHERE id_usuario = ?', [nuevoHash, usuario.id_usuario], (errUpdate) => {
        if (errUpdate) console.error('No se pudo migrar el hash de contraseña:', errUpdate);
      });
    }

    delete usuario.password;

    // HU04 - Escenario 2: credenciales correctas => se genera un JWT firmado
    // que el frontend envía en el header Authorization de las peticiones siguientes.
    const token = generarToken({
      id_usuario: usuario.id_usuario,
      email: usuario.email,
      id_rol: usuario.id_rol,
      nombre_rol: usuario.nombre_rol,
    });

    res.status(200).json({ mensaje: 'Login exitoso', usuario, token });
  });
});

router.post('/registro', (req, res) => {
  const { nombreCompleto, email, password } = req.body;

  if (!esTextoNoVacio(nombreCompleto)) {
    return res.status(400).json({ mensaje: 'El nombre completo es obligatorio' });
  }
  if (!esEmailValido(email)) {
    return res.status(400).json({ mensaje: 'El formato de correo no es válido' });
  }
  if (!esPasswordValida(password)) {
    return res.status(400).json({ mensaje: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número' });
  }

  const partesNombre = nombreCompleto.trim().split(' ');
  const nombre = partesNombre[0];
  const apellido = partesNombre.length > 1 ? partesNombre.slice(1).join(' ') : '';

  const idRol = 5; // Rol por defecto para altas desde el registro público (alumno)
  const passwordHasheada = hashPassword(password);

  const query = 'INSERT INTO usuarios (nombre, apellido, email, password, id_rol) VALUES (?, ?, ?, ?, ?)';

  db.query(query, [nombre, apellido, email.trim(), passwordHasheada, idRol], (err) => {
    if (err) {
      console.error(err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ mensaje: 'Ese correo electrónico ya está registrado' });
      }
      return res.status(500).json({ mensaje: 'Error en el servidor al registrar usuario' });
    }

    res.status(201).json({ mensaje: 'Cuenta creada con éxito' });
  });
});

router.post('/recupero', (req, res) => {
  const { email } = req.body;

  if (!esEmailValido(email)) {
    return res.status(400).json({ mensaje: 'El formato de correo no es válido' });
  }

  const queryBuscar = 'SELECT * FROM usuarios WHERE email = ?';
  db.query(queryBuscar, [email.trim()], (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error en el servidor' });

    // Respuesta genérica: no revelamos si el correo existe o no en el sistema.
    if (results.length === 0) {
      return res.status(200).json({ mensaje: 'Si el correo existe, te enviamos un enlace de recuperación.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expiracion = new Date(Date.now() + 3600000);

    const queryActualizar = 'UPDATE usuarios SET reset_token = ?, reset_token_expires = ? WHERE email = ?';
    db.query(queryActualizar, [token, expiracion, email.trim()], (errUpdate) => {
      if (errUpdate) return res.status(500).json({ mensaje: 'Error al generar el token' });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
      const enlace = `${frontendUrl}/reset-password/${token}`;

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email.trim(),
        subject: 'Stepping Stones - Recuperación de contraseña',
        text: `Hola,\n\nRecibimos una solicitud para restablecer tu contraseña en Stepping Stones.\nIngresa al siguiente enlace para crear una nueva (este enlace caducará en 1 hora):\n\n${enlace}\n\nSi no fuiste tú, ignora este correo.\n\nSaludos,\nEl equipo de Stepping Stones`,
      };

      transporter.sendMail(mailOptions, (errorMail) => {
        if (errorMail) {
          console.error('Error enviando correo:', errorMail);
          return res.status(500).json({ mensaje: 'Error al enviar el correo electrónico' });
        }
        res.status(200).json({ mensaje: 'Si el correo existe, te enviamos un enlace de recuperación.' });
      });
    });
  });
});

// HU05 - Escenario 2: PUT /reset-password actualiza el hash de la contraseña.
router.put('/reset-password', (req, res) => {
  const { token, password } = req.body;

  if (!esTextoNoVacio(token) || !esPasswordValida(password)) {
    return res.status(400).json({ mensaje: 'Datos inválidos para restablecer la contraseña' });
  }

  const query = 'SELECT * FROM usuarios WHERE reset_token = ? AND reset_token_expires > NOW()';

  db.query(query, [token], (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error en el servidor' });

    if (results.length === 0) {
      return res.status(400).json({ mensaje: 'El enlace es inválido o ha expirado.' });
    }

    const passwordHasheada = hashPassword(password);
    const sqlUpdate = 'UPDATE usuarios SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE reset_token = ?';
    db.query(sqlUpdate, [passwordHasheada, token], (errUpdate) => {
      if (errUpdate) return res.status(500).json({ mensaje: 'Error al actualizar la contraseña' });

      res.status(200).json({ mensaje: 'Contraseña actualizada correctamente.' });
    });
  });
});

module.exports = router;
