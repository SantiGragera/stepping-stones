process.loadEnvFile(); // Carga backend/.env (Node >= 20.6). No requiere dependencias externas.

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const rolesRoutes = require('./routes/roles.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('El servidor de Stepping Stones está funcionando perfecto.');
});

app.use('/api', authRoutes);
app.use('/api/roles', rolesRoutes);

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
