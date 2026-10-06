const express = require('express');
const db = require('../config/db');
const { esTextoNoVacio } = require('../utils/validators');

const router = express.Router();

router.get('/', (req, res) => {
  const query = 'SELECT id_rol, nombre_rol, descripcion FROM roles';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener roles:', err);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }
    res.status(200).json(results);
  });
});

router.post('/', (req, res) => {
  const { nombre_rol, descripcion } = req.body;

  if (!esTextoNoVacio(nombre_rol)) {
    return res.status(400).json({ mensaje: 'El nombre del rol es obligatorio' });
  }

  const query = 'INSERT INTO roles (nombre_rol, descripcion) VALUES (?, ?)';

  db.query(query, [nombre_rol.trim(), descripcion || null], (err, results) => {
    if (err) {
      console.error('Error al crear rol:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ mensaje: 'El nombre del rol ya existe.' });
      }
      return res.status(500).json({ mensaje: 'Error en el servidor al crear rol' });
    }
    res.status(201).json({ mensaje: 'Rol creado con éxito', id_rol: results.insertId });
  });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre_rol, descripcion } = req.body;

  if (!esTextoNoVacio(nombre_rol)) {
    return res.status(400).json({ mensaje: 'El nombre del rol es obligatorio' });
  }

  const query = 'UPDATE roles SET nombre_rol = ?, descripcion = ? WHERE id_rol = ?';

  db.query(query, [nombre_rol.trim(), descripcion || null, id], (err) => {
    if (err) {
      console.error('Error al actualizar rol:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ mensaje: 'El nombre del rol ya existe.' });
      }
      return res.status(500).json({ mensaje: 'Error en el servidor al actualizar rol' });
    }
    res.status(200).json({ mensaje: 'Rol actualizado correctamente' });
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const checkQuery = 'SELECT COUNT(*) AS total FROM usuarios WHERE id_rol = ?';

  db.query(checkQuery, [id], (err, results) => {
    if (err) {
      console.error('Error al verificar usuarios del rol:', err);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }

    if (results[0].total > 0) {
      return res.status(400).json({ mensaje: 'No se puede eliminar un rol que tiene usuarios asignados.' });
    }

    const deleteQuery = 'DELETE FROM roles WHERE id_rol = ?';
    db.query(deleteQuery, [id], (errDelete) => {
      if (errDelete) {
        console.error('Error al eliminar rol:', errDelete);
        return res.status(500).json({ mensaje: 'Error en el servidor al eliminar rol' });
      }
      res.status(200).json({ mensaje: 'Rol eliminado con éxito' });
    });
  });
});

module.exports = router;
