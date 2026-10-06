const express = require('express');
const db = require('../config/db').promise();
const { permitirRoles } = require('../middlewares/auth.middleware');
const { esMontoValido, esIdValido, esTextoNoVacio } = require('../utils/validators');
const { esMesValido, MESES } = require('../utils/meses');

// =====================================================================
// Sprint 4 - ABM Transaccional: Gestión de Cobranzas (pagos de cuota)
//   HU09  POST   /api/cobranzas          Registro (alta)
//   HU10  PUT    /api/cobranzas/:id      Modificación
//   HU11  GET    /api/cobranzas          Consulta y listado (filtros alumno / mes)
//   HU12  DELETE /api/cobranzas/:id      Eliminación lógica (activo = 0)
// Todas las rutas pasan antes por requiereAutenticacion (ver server.js).
// =====================================================================

const router = express.Router();

// HU11: consultan Secretaria y Coordinadora Administrativa.
// HU09, HU10, HU12: registra, modifica y da de baja la Secretaria.
// La Directora tiene acceso total a la academia.
const puedeConsultar = permitirRoles('Secretaria', 'Coordinadora Administrativa', 'Directora');
const puedeGestionar = permitirRoles('Secretaria', 'Directora');

const MENSAJE_MONTO_INVALIDO = 'El monto debe ser mayor a 0';

const SELECT_COBRANZAS = `
  SELECT c.id_cobranza,
         c.id_alumno,
         a.nombre AS alumno_nombre,
         a.apellido AS alumno_apellido,
         c.mes_correspondiente,
         c.monto,
         c.id_metodo_pago,
         mp.nombre_metodo,
         c.fecha_pago,
         c.id_usuario_secretaria,
         CONCAT(u.nombre, ' ', u.apellido) AS registrado_por
  FROM cobranzas c
  INNER JOIN alumnos a       ON a.id_alumno = c.id_alumno
  INNER JOIN metodos_pago mp ON mp.id_metodo_pago = c.id_metodo_pago
  INNER JOIN usuarios u      ON u.id_usuario = c.id_usuario_secretaria
`;

// Validaciones compartidas por el alta (HU09) y la modificación (HU10).
// HU10 - Escenario 2: la edición usa exactamente los mismos mensajes que el alta.
async function validarCobranza(body) {
  const { id_alumno, monto, mes_correspondiente, id_metodo_pago } = body;

  // HU09 - Escenario 1: campos obligatorios
  const faltantes = [];
  if (!esIdValido(id_alumno)) faltantes.push('alumno');
  if (monto === undefined || monto === null || monto === '') faltantes.push('monto');
  if (!esTextoNoVacio(mes_correspondiente)) faltantes.push('mes correspondiente');
  if (!esIdValido(id_metodo_pago)) faltantes.push('método de pago');

  if (faltantes.length > 0) {
    return { error: `Campos obligatorios incompletos: ${faltantes.join(', ')}`, campos: faltantes };
  }

  // HU09 - Escenario 2: monto mayor a 0
  if (!esMontoValido(monto)) {
    return { error: MENSAJE_MONTO_INVALIDO, campos: ['monto'] };
  }

  if (!esMesValido(mes_correspondiente)) {
    return { error: 'El mes correspondiente no es válido (ej.: "Marzo 2026")', campos: ['mes correspondiente'] };
  }

  // Existencia del alumno y del método de pago (claves foráneas)
  const [[alumno]] = await db.query('SELECT id_alumno FROM alumnos WHERE id_alumno = ?', [id_alumno]);
  if (!alumno) return { error: 'El alumno seleccionado no existe', campos: ['alumno'] };

  const [[metodo]] = await db.query('SELECT id_metodo_pago FROM metodos_pago WHERE id_metodo_pago = ?', [id_metodo_pago]);
  if (!metodo) return { error: 'El método de pago seleccionado no existe', campos: ['método de pago'] };

  return {
    datos: {
      id_alumno: Number(id_alumno),
      monto: Math.round(Number(monto) * 100) / 100,
      mes_correspondiente: mes_correspondiente.trim(),
      id_metodo_pago: Number(id_metodo_pago),
    },
  };
}

// ---------------------------------------------------------------------
// HU11: Consulta y listado de cobranzas
// GET /api/cobranzas?alumno=<texto>&mes=<Mes Año>
// Solo cobranzas activas, ordenadas por fecha de pago descendente.
// ---------------------------------------------------------------------
router.get('/', puedeConsultar, async (req, res) => {
  const { alumno, mes } = req.query;

  const condiciones = ['c.activo = 1']; // HU12: los registros dados de baja no se listan
  const parametros = [];

  if (esTextoNoVacio(alumno)) {
    condiciones.push("CONCAT(a.nombre, ' ', a.apellido) LIKE ?");
    parametros.push(`%${alumno.trim()}%`);
  }

  if (esTextoNoVacio(mes)) {
    condiciones.push('c.mes_correspondiente = ?');
    parametros.push(mes.trim());
  }

  const query = `${SELECT_COBRANZAS}
    WHERE ${condiciones.join(' AND ')}
    ORDER BY c.fecha_pago DESC, c.id_cobranza DESC`;

  try {
    const [cobranzas] = await db.query(query, parametros);
    res.status(200).json(cobranzas);
  } catch (err) {
    console.error('Error al obtener cobranzas:', err);
    res.status(500).json({ mensaje: 'Error en el servidor al obtener cobranzas' });
  }
});

// Meses con cobranzas activas, para el select "Todos los meses" del filtro (HU11).
// Se define antes de "/:id" para que Express no lo confunda con un id.
router.get('/meses', puedeConsultar, async (req, res) => {
  try {
    const [filas] = await db.query(
      'SELECT DISTINCT mes_correspondiente FROM cobranzas WHERE activo = 1'
    );
    const meses = filas.map((f) => f.mes_correspondiente).sort(compararMeses).reverse();
    res.status(200).json(meses);
  } catch (err) {
    console.error('Error al obtener meses:', err);
    res.status(500).json({ mensaje: 'Error en el servidor al obtener los meses' });
  }
});

router.get('/:id', puedeConsultar, async (req, res) => {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ mensaje: 'Identificador de cobranza inválido' });
  }

  try {
    const [[cobranza]] = await db.query(
      `${SELECT_COBRANZAS} WHERE c.id_cobranza = ? AND c.activo = 1`,
      [req.params.id]
    );
    if (!cobranza) return res.status(404).json({ mensaje: 'La cobranza no existe o fue eliminada' });
    res.status(200).json(cobranza);
  } catch (err) {
    console.error('Error al obtener la cobranza:', err);
    res.status(500).json({ mensaje: 'Error en el servidor al obtener la cobranza' });
  }
});

// ---------------------------------------------------------------------
// HU09: Registro (alta) de una cobranza
// La cobranza se asocia al usuario logueado (sale del JWT, no del body)
// y a la fecha y hora actuales (fecha_pago DEFAULT CURRENT_TIMESTAMP).
// ---------------------------------------------------------------------
router.post('/', puedeGestionar, async (req, res) => {
  try {
    const { error, campos, datos } = await validarCobranza(req.body);
    if (error) return res.status(400).json({ mensaje: error, campos });

    const [resultado] = await db.query(
      `INSERT INTO cobranzas (id_alumno, id_usuario_secretaria, monto, mes_correspondiente, id_metodo_pago)
       VALUES (?, ?, ?, ?, ?)`,
      [datos.id_alumno, req.usuario.id_usuario, datos.monto, datos.mes_correspondiente, datos.id_metodo_pago]
    );

    res.status(201).json({ mensaje: 'Cobranza registrada con éxito', id_cobranza: resultado.insertId });
  } catch (err) {
    console.error('Error al registrar cobranza:', err);
    res.status(500).json({ mensaje: 'Error en el servidor al registrar la cobranza' });
  }
});

// ---------------------------------------------------------------------
// HU10: Modificación de una cobranza (mismas validaciones que el alta)
// ---------------------------------------------------------------------
router.put('/:id', puedeGestionar, async (req, res) => {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ mensaje: 'Identificador de cobranza inválido' });
  }

  try {
    const { error, campos, datos } = await validarCobranza(req.body);
    if (error) return res.status(400).json({ mensaje: error, campos });

    const [resultado] = await db.query(
      `UPDATE cobranzas
       SET id_alumno = ?, monto = ?, mes_correspondiente = ?, id_metodo_pago = ?
       WHERE id_cobranza = ? AND activo = 1`,
      [datos.id_alumno, datos.monto, datos.mes_correspondiente, datos.id_metodo_pago, req.params.id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'La cobranza no existe o fue eliminada' });
    }

    res.status(200).json({ mensaje: 'Cobranza actualizada correctamente' });
  } catch (err) {
    console.error('Error al actualizar cobranza:', err);
    res.status(500).json({ mensaje: 'Error en el servidor al actualizar la cobranza' });
  }
});

// ---------------------------------------------------------------------
// HU12: Eliminación LÓGICA de una cobranza
// No se ejecuta un DELETE físico: se marca activo = 0 para conservar
// el historial de pagos ante una eventual auditoría contable.
// ---------------------------------------------------------------------
router.delete('/:id', puedeGestionar, async (req, res) => {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ mensaje: 'Identificador de cobranza inválido' });
  }

  try {
    const [resultado] = await db.query(
      'UPDATE cobranzas SET activo = 0 WHERE id_cobranza = ? AND activo = 1',
      [req.params.id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'La cobranza no existe o ya fue eliminada' });
    }

    res.status(200).json({ mensaje: 'Cobranza eliminada con éxito' });
  } catch (err) {
    console.error('Error al eliminar cobranza:', err);
    res.status(500).json({ mensaje: 'Error en el servidor al eliminar la cobranza' });
  }
});

// Ordena "Marzo 2026" < "Abril 2026" < "Enero 2027"
function compararMeses(a, b) {
  const clave = (texto) => {
    const [mes, anio] = texto.split(' ');
    return Number(anio) * 100 + MESES.indexOf(mes);
  };
  return clave(a) - clave(b);
}

module.exports = router;
