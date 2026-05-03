const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',      
  password: '',      
  database: 'stepping_stones_db' 
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sstonestest@gmail.com', 
    pass: 'lxaj vrxu ziyo fvpo' 
  }
});

db.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('¡Conectado exitosamente a la base de datos stepping_stones_db!');
});

app.get('/', (req, res) => {
  res.send('El servidor de Stepping Stones está funcionando perfecto.');
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT id_usuario, nombre, apellido, id_rol FROM usuarios WHERE email = ? AND password = ?';
  
  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }

    if (results.length > 0) {
      res.status(200).json({ 
        mensaje: 'Login exitoso',
        usuario: results[0] 
      });
    } else {
      res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }
  });
});

app.post('/api/registro', (req, res) => {
  const { nombreCompleto, email, password } = req.body;

  const partesNombre = nombreCompleto.trim().split(' ');
  const nombre = partesNombre[0];
  const apellido = partesNombre.length > 1 ? partesNombre.slice(1).join(' ') : '';
  
  const idRol = 5; 

  const query = 'INSERT INTO usuarios (nombre, apellido, email, password, id_rol) VALUES (?, ?, ?, ?, ?)';
  
  db.query(query, [nombre, apellido, email, password, idRol], (err, results) => {
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

app.post('/api/recupero', (req, res) => {
  const { email } = req.body;

  const queryBuscar = 'SELECT * FROM usuarios WHERE email = ?';
  db.query(queryBuscar, [email], (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error en el servidor' });
    
    if (results.length === 0) {
      return res.status(404).json({ mensaje: 'No existe una cuenta con este correo' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expiracion = new Date(Date.now() + 3600000); 

    const queryActualizar = 'UPDATE usuarios SET reset_token = ?, reset_token_expires = ? WHERE email = ?';
    db.query(queryActualizar, [token, expiracion, email], (errUpdate) => {
      if (errUpdate) return res.status(500).json({ mensaje: 'Error al generar el token' });

      const enlace = `http://localhost:5174/reset-password/${token}`; 
      
      const mailOptions = {
        from: 'sstonestest@gmail.com', 
        to: email, 
        subject: 'Stepping Stones - Recuperación de contraseña',
        text: `Hola,\n\nRecibimos una solicitud para restablecer tu contraseña en Stepping Stones.\nIngresa al siguiente enlace para crear una nueva (este enlace caducará en 1 hora):\n\n${enlace}\n\nSi no fuiste tú, ignora este correo.\n\nSaludos,\nEl equipo de Stepping Stones`
      };

      transporter.sendMail(mailOptions, (errorMail, info) => {
        if (errorMail) {
          console.error('Error enviando correo:', errorMail);
          return res.status(500).json({ mensaje: 'Error al enviar el correo electrónico' });
        }
        res.status(200).json({ mensaje: 'Te enviamos un enlace de recuperación a tu correo.' });
      });
    });
  });
});

app.post('/api/reset-password', (req, res) => {
  const { token, password } = req.body;

  const query = 'SELECT * FROM usuarios WHERE reset_token = ? AND reset_token_expires > NOW()';
  
  db.query(query, [token], (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error en el servidor' });
    
    if (results.length === 0) {
      return res.status(400).json({ mensaje: 'El enlace es inválido o ha expirado.' });
    }

    const sqlUpdate = 'UPDATE usuarios SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE reset_token = ?';
    db.query(sqlUpdate, [password, token], (errUpdate) => {
      if (errUpdate) return res.status(500).json({ mensaje: 'Error al actualizar la contraseña' });
      
      res.status(200).json({ mensaje: 'Contraseña actualizada correctamente.' });
    });
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});