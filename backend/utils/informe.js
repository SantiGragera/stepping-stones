// =====================================================================
// Sprint 5 - HU14: fórmulas del informe de recaudación (ver "Definiciones
// de cálculo del Sprint 5" en la documentación). Son funciones puras para
// poder probarlas sin base de datos (backend/tests/informe.test.js).
// =====================================================================

const redondear = (valor, decimales = 1) => {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
};

// Monto promedio (M) = Total recaudado (M) ÷ Pagos registrados (M).
// Sin pagos no se divide por cero: devuelve null (la pantalla muestra "—").
function montoPromedio(total, pagos) {
  if (!pagos) return null;
  return redondear(total / pagos, 2);
}

// Alumnos al día (M) = (alumnos activos con al menos una cobranza activa de
// mes correspondiente M ÷ alumnos activos) × 100.
// Sin alumnos activos devuelve null (la pantalla muestra "—").
function porcentajeAlDia(alDia, totalAlumnos) {
  if (!totalAlumnos) return null;
  return redondear((alDia / totalAlumnos) * 100, 1);
}

// Variación entre el mes elegido y el anterior.
//   absoluta   = actual − anterior
//   porcentual = (actual − anterior) ÷ anterior × 100
// Si algún valor no se puede calcular (null) la variación es null ("—").
// Si el anterior vale cero: se informa la absoluta y la porcentual queda en
// null ("sin base de comparación"); si ambos valen cero la variación es 0 (0 %).
// Con { puntos: true } (porcentaje de alumnos al día) solo hay diferencia en
// puntos porcentuales, sin variación porcentual.
function variacion(actual, anterior, { puntos = false } = {}) {
  if (actual === null || actual === undefined || anterior === null || anterior === undefined) {
    return { absoluta: null, porcentual: null, sinBase: false };
  }
  const absoluta = redondear(actual - anterior, 2);
  if (puntos) return { absoluta: redondear(actual - anterior, 1), porcentual: null, sinBase: false };
  if (anterior === 0) {
    return { absoluta, porcentual: actual === 0 ? 0 : null, sinBase: actual !== 0 };
  }
  return { absoluta, porcentual: redondear(((actual - anterior) / anterior) * 100, 1), sinBase: false };
}

module.exports = { montoPromedio, porcentajeAlDia, variacion, redondear };
