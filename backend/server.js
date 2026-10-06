process.loadEnvFile(); // Carga backend/.env (Node >= 20.6). No requiere dependencias externas.

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const rolesRoutes = require('./routes/roles.routes');
const cobranzasRoutes = require('./routes/cobranzas.routes');
const catalogosRoutes = require('./routes/catalogos.routes');
const { requiereAutenticacion } = require('./middlewares/auth.middleware');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('El servidor de Stepping Stones está funcionando perfecto.');
});

// Rutas públicas: login, registro y recupero de contraseña (Sprint 1).
app.use('/api', authRoutes);

// Rutas privadas: requieren el JWT generado en el login (HU04).
app.use('/api/roles', requiereAutenticacion, rolesRoutes);          // Sprint 2
app.use('/api/cobranzas', requiereAutenticacion, cobranzasRoutes);  // Sprint 4
app.use('/api', catalogosRoutes);                                   // alumnos y métodos de pago (selects de Cobranzas)

// Manejo centralizado de rutas no encontradas y errores inesperados.
app.use((req, res) => {
  res.status(404).json({ mensaje: 'Recurso no encontrado' });
});

app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});
