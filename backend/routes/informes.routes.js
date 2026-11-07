const express = require('express');
const db = require('../config/db').promise();
const { permitirRoles } = require('../middlewares/auth.middleware');
const { esMesValido, mesActual, mesAnterior, rangoDelMes } = require('../utils/meses');
const { montoPromedio, porcentajeAlDia, variacion } = require('../utils/informe');
const { generarPdfRecaudacion } = require('../utils/informePdf');

// =====================================================================
// Sprint 5 - HU14: Informe mensual de recaudación
//   GET /api/informes/recaudacion?mes=<Mes Año>        datos del informe
//   GET /api/informes/recaudacion/pdf?mes=&comparar=1  descarga en PDF (Escenario 4)
//
// Criterio de fechas (ver "Definiciones de cálculo del Sprint 5"):
//   - Total recaudado, pagos registrados y monto promedio se agrupan por la
//     FECHA DE PAGO: miden el dinero efectivamente recibido en el mes.
//   - "Alumnos al día" usa el MES CORRESPONDIENTE de la cuota, igual que el
//     listado de alumnos (HU13).
// Solo se consideran cobranzas activas (activo = 1) y alumnos activos.
// =====================================================================

const router = express.Router();

const puedeVerInformes = permitirRoles('Directora', 'Coordinadora Administrativa');

// Definiciones que la pantalla muestra al pasar el mouse sobre cada indicador (Escenario 1).
const DEFINICIONES = {
  totalRecaudado: 'Suma del monto de las cobranzas activas con fecha de pago dentro del mes.',
  pagos: 'Cantidad de cobranzas activas con fecha de pago dentro del mes.',
  montoPromedio: 'Total recaudado ÷ pagos registrados. Sin pagos no se calcula (—).',
  alumnosAlDia:
    '(Alumnos activos con al menos una cobranza activa de ese mes correspondiente ÷ alumnos activos) × 100.',
};

async function totalesPorFechaDePago(mes) {
  const [desde, hasta] = rangoDelMes(mes);
  const [[fila]] = await db.query(
    `SELECT COALESCE(SUM(monto), 0) AS total, COUNT(*) AS pagos
       FROM cobranzas
      WHERE activo = 1 AND fecha_pago >= ? AND fecha_pago < ?`,
    [desde, hasta]
  );
  return { total: Number(fila.total), pagos: Number(fila.pagos) };
}

async function alumnosAlDia(mes) {
  const [[{ activos }]] = await db.query('SELECT COUNT(*) AS activos FROM alumnos WHERE activo = 1');
  const [[{ alDia }]] = await db.query(
    `SELECT COUNT(DISTINCT c.id_alumno) AS alDia
       FROM cobranzas c
       INNER JOIN alumnos a ON a.id_alumno = c.id_alumno AND a.activo = 1
      WHERE c.activo = 1 AND c.mes_correspondiente = ?`,
    [mes]
  );
  return { alDia: Number(alDia), activos: Number(activos) };
}

// Desglose por método de pago del mes elegido y del anterior (por fecha de pago).
async function desglosePorMetodo(mes, anterior) {
  const [desde, hasta] = rangoDelMes(mes);
  const [desdeAnt, hastaAnt] = rangoDelMes(anterior);
  const [filas] = await db.query(
    `SELECT mp.nombre_metodo,
            SUM(c.fecha_pago >= ? AND c.fecha_pago < ?) AS pagos,
            COALESCE(SUM(CASE WHEN c.fecha_pago >= ? AND c.fecha_pago < ? THEN c.monto END), 0) AS total,
            SUM(c.fecha_pago >= ? AND c.fecha_pago < ?) AS pagos_ant,
            COALESCE(SUM(CASE WHEN c.fecha_pago >= ? AND c.fecha_pago < ? THEN c.monto END), 0) AS total_ant
       FROM metodos_pago mp
       INNER JOIN cobranzas c ON c.id_metodo_pago = mp.id_metodo_pago AND c.activo = 1
      WHERE c.fecha_pago >= ? AND c.fecha_pago < ?
      GROUP BY mp.id_metodo_pago, mp.nombre_metodo
      ORDER BY mp.id_metodo_pago`,
    [desde, hasta, desde, hasta, desdeAnt, hastaAnt, desdeAnt, hastaAnt, desdeAnt, hasta]
  );
  return filas.map((f) => ({
    metodo: f.nombre_metodo,
    pagos: Number(f.pagos),
    total: Number(f.total),
    pagosAnterior: Number(f.pagos_ant),
    totalAnterior: Number(f.total_ant),
  }));
}

async function armarInforme(mes) {
  const anterior = mesAnterior(mes);
  const [actual, previo, dia, diaPrevio, metodos] = await Promise.all([
    totalesPorFechaDePago(mes),
    totalesPorFechaDePago(anterior),
    alumnosAlDia(mes),
    alumnosAlDia(anterior),
    desglosePorMetodo(mes, anterior),
  ]);

  const promedio = montoPromedio(actual.total, actual.pagos);
  const promedioPrevio = montoPromedio(previo.total, previo.pagos);
  const pctDia = porcentajeAlDia(dia.alDia, dia.activos);
  const pctDiaPrevio = porcentajeAlDia(diaPrevio.alDia, diaPrevio.activos);

  const desglose = metodos
    .filter((m) => m.pagos > 0)
    .map((m) => ({
      ...m,
      porcentaje: actual.total > 0 ? Math.round((m.total / actual.total) * 1000) / 10 : null,
      variacion: variacion(m.total, m.totalAnterior),
    }));

  return {
    mes,
    mesAnterior: anterior,
    generado: new Date().toISOString(),
    sinPagos: actual.pagos === 0,
    definiciones: DEFINICIONES,
    indicadores: {
      totalRecaudado: { valor: actual.total, anterior: previo.total, variacion: variacion(actual.total, previo.total) },
      pagos: { valor: actual.pagos, anterior: previo.pagos, variacion: variacion(actual.pagos, previo.pagos) },
      montoPromedio: { valor: promedio, anterior: promedioPrevio, variacion: variacion(promedio, promedioPrevio) },
      alumnosAlDia: {
        valor: pctDia,
        anterior: pctDiaPrevio,
        alDia: dia.alDia,
        alumnosActivos: dia.activos,
        variacion: variacion(pctDia, pctDiaPrevio, { puntos: true }),
      },
    },
    desglose,
    totalesDesglose: {
      pagos: actual.pagos,
      total: actual.total,
      variacion: variacion(actual.total, previo.total),
    },
  };
}

function resolverMes(req, res) {
  const mes = typeof req.query.mes === 'string' && req.query.mes.trim() ? req.query.mes.trim() : mesActual();
  if (!esMesValido(mes)) {
    res.status(400).json({ mensaje: 'El mes no es válido (ej.: "Octubre 2026")' });
    return null;
  }
  return mes;
}

router.get('/recaudacion', puedeVerInformes, async (req, res) => {
  const mes = resolverMes(req, res);
  if (!mes) return;
  try {
    res.status(200).json(await armarInforme(mes));
  } catch (err) {
    console.error('Error al generar el informe de recaudación:', err);
    res.status(500).json({ mensaje: 'Error en el servidor al generar el informe' });
  }
});

router.get('/recaudacion/pdf', puedeVerInformes, async (req, res) => {
  const mes = resolverMes(req, res);
  if (!mes) return;
  const comparar = req.query.comparar === '1';
  try {
    const informe = await armarInforme(mes);
    const pdf = await generarPdfRecaudacion(informe, { comparar });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="informe-recaudacion-${mes.replace(' ', '-')}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.status(200).send(pdf);
  } catch (err) {
    console.error('Error al generar el PDF del informe:', err);
    res.status(500).json({ mensaje: 'Error en el servidor al generar el PDF' });
  }
});

module.exports = router;
