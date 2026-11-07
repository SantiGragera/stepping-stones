const express = require('express');
const db = require('../config/db').promise();
const { permitirRoles } = require('../middlewares/auth.middleware');
const { esMesValido, mesActual } = require('../utils/meses');

// =====================================================================
// Sprint 5 - HU13: Listado de alumnos con estado de cuota
//   GET /api/alumnos/estado-cuotas
//     ?mes=<Mes Año>      mes de la cuota a evaluar (default: el mes actual)
//     &estado=al-dia|adeuda
//     &q=<texto>          busca en nombre, apellido, DNI y tutor
//     &orden=<columna>    alumno | dni | tutor | telefono | ultimo_pago | estado
//     &direccion=asc|desc
//     &pagina=<n>         de a 10 registros (HU13 - Escenario 1)
//     &exportar=1         devuelve todos los resultados, sin paginar (CSV, Escenario 3)
//
// Regla de negocio: un alumno está "Al día" en el mes M si tiene al menos una
// cobranza ACTIVA con mes_correspondiente = M (cada cobranza es la cuota
// completa, no hay pagos parciales). Si no, "Adeuda". Solo se listan los
// alumnos activos (activo = 1).
// =====================================================================

const router = express.Router();

const puedeConsultar = permitirRoles('Secretaria', 'Coordinadora Administrativa', 'Directora');

const POR_PAGINA = 10;

// Columnas ordenables. Se usa una lista blanca para no concatenar nunca texto del usuario en el ORDER BY.
const ORDENES = {
  alumno: ['apellido', 'nombre'],
  dni: ['dni'],
  tutor: ['nombre_tutor'],
  telefono: ['telefono_tutor'],
  ultimo_pago: ['ultimo_pago'],
  estado: ['al_dia'],
};

router.get('/estado-cuotas', puedeConsultar, async (req, res) => {
  const mes = typeof req.query.mes === 'string' && req.query.mes.trim() ? req.query.mes.trim() : mesActual();
  if (!esMesValido(mes)) {
    return res.status(400).json({ mensaje: 'El mes no es válido (ej.: "Octubre 2026")' });
  }

  const estado = req.query.estado;
  if (estado && !['al-dia', 'adeuda'].includes(estado)) {
    return res.status(400).json({ mensaje: 'El estado debe ser "al-dia" o "adeuda"' });
  }

  const orden = ORDENES[req.query.orden] ? req.query.orden : 'alumno';
  const direccion = req.query.direccion === 'desc' ? 'DESC' : 'ASC';
  const exportar = req.query.exportar === '1';
  const busqueda = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  // El estado se calcula en una subconsulta para poder filtrar y ordenar por él.
  const condiciones = ['a.activo = 1'];
  const parametros = [];

  if (busqueda) {
    condiciones.push(`(CONCAT(a.nombre, ' ', a.apellido) LIKE ? OR CONCAT(a.apellido, ' ', a.nombre) LIKE ?
                       OR a.dni LIKE ? OR a.nombre_tutor LIKE ?)`);
    const patron = `%${busqueda}%`;
    parametros.push(patron, patron, patron, patron);
  }

  const baseSql = `
    FROM (
      SELECT a.id_alumno, a.nombre, a.apellido, a.dni, a.nombre_tutor, a.telefono_tutor,
             (SELECT MAX(c.fecha_pago) FROM cobranzas c
               WHERE c.id_alumno = a.id_alumno AND c.activo = 1) AS ultimo_pago,
             EXISTS (SELECT 1 FROM cobranzas c
                      WHERE c.id_alumno = a.id_alumno AND c.activo = 1
                        AND c.mes_correspondiente = ?) AS al_dia
      FROM alumnos a
      WHERE ${condiciones.join(' AND ')}
    ) a
    ${estado === 'al-dia' ? 'WHERE a.al_dia = 1' : estado === 'adeuda' ? 'WHERE a.al_dia = 0' : ''}`;
  const parametrosBase = [mes, ...parametros];

  try {
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${baseSql}`, parametrosBase);

    const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
    const pagina = Math.min(Math.max(parseInt(req.query.pagina, 10) || 1, 1), totalPaginas);

    // Desempate por id para que el orden (y la paginación) sea estable.
    const orderBy = [...ORDENES[orden].map((col) => `a.${col} ${direccion}`), 'a.id_alumno ASC'].join(', ');
    const limite = exportar ? '' : 'LIMIT ? OFFSET ?';
    const parametrosPagina = exportar ? [] : [POR_PAGINA, (pagina - 1) * POR_PAGINA];

    const [filas] = await db.query(
      `SELECT a.id_alumno, a.nombre, a.apellido, a.dni, a.nombre_tutor, a.telefono_tutor,
              a.ultimo_pago, a.al_dia ${baseSql} ORDER BY ${orderBy} ${limite}`,
      [...parametrosBase, ...parametrosPagina]
    );

    res.status(200).json({
      mes,
      total,
      pagina: exportar ? 1 : pagina,
      porPagina: exportar ? total : POR_PAGINA,
      totalPaginas: exportar ? 1 : totalPaginas,
      resultados: filas.map((f) => ({ ...f, al_dia: Boolean(f.al_dia) })),
    });
  } catch (err) {
    console.error('Error al obtener el listado de alumnos:', err);
    res.status(500).json({ mensaje: 'Error en el servidor al obtener el listado de alumnos' });
  }
});

module.exports = router;
