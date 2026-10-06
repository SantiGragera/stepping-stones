const express = require('express');
const db = require('../config/db').promise();
const { requiereAutenticacion } = require('../middlewares/auth.middleware');

// Catálogos de solo lectura que necesita el formulario "Registrar Cobranza" (HU09):
// el select de alumnos y el select de métodos de pago.
const router = express.Router();

router.get('/alumnos', requiereAutenticacion, async (req, res) => {
  try {
    const [alumnos] = await db.query(
      'SELECT id_alumno, nombre, apellido, dni FROM alumnos ORDER BY apellido, nombre'
    );
    res.status(200).json(alumnos);
  } catch (err) {
    console.error('Error al obtener alumnos:', err);
    res.status(500).json({ mensaje: 'Error en el servidor al obtener alumnos' });
  }
});

router.get('/metodos-pago', requiereAutenticacion, async (req, res) => {
  try {
    const [metodos] = await db.query(
      'SELECT id_metodo_pago, nombre_metodo FROM metodos_pago ORDER BY id_metodo_pago'
    );
    res.status(200).json(metodos);
  } catch (err) {
    console.error('Error al obtener métodos de pago:', err);
    res.status(500).json({ mensaje: 'Error en el servidor al obtener métodos de pago' });
  }
});

module.exports = router;
