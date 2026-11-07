// Formato del "mes correspondiente" de una cobranza: "<Mes> <Año>", por ejemplo "Marzo 2026"
// (el mismo formato que se usó en la población inicial de la tabla cobranzas).
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MES_REGEX = new RegExp(`^(${MESES.join('|')}) (\\d{4})$`);

function esMesValido(texto) {
  if (typeof texto !== 'string') return false;
  const coincidencia = MES_REGEX.exec(texto.trim());
  if (!coincidencia) return false;
  const anio = Number(coincidencia[2]);
  return anio >= 2000 && anio <= 2100;
}

// "Marzo 2026" -> { anio: 2026, mes: 3 }. Devuelve null si el texto no es un mes válido.
function parsearMes(texto) {
  if (!esMesValido(texto)) return null;
  const [nombre, anio] = texto.trim().split(' ');
  return { anio: Number(anio), mes: MESES.indexOf(nombre) + 1 };
}

function formatearMes({ anio, mes }) {
  return `${MESES[mes - 1]} ${anio}`;
}

// "Enero 2027" -> "Diciembre 2026"
function mesAnterior(texto) {
  const { anio, mes } = parsearMes(texto);
  return formatearMes(mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 });
}

function mesActual(fecha = new Date()) {
  return formatearMes({ anio: fecha.getFullYear(), mes: fecha.getMonth() + 1 });
}

const dosDigitos = (n) => String(n).padStart(2, '0');

// Rango de fechas de un mes como [desde, hasta): "Octubre 2026" -> ['2026-10-01', '2026-11-01'].
// Se usa para agrupar por FECHA DE PAGO (informe de recaudación, HU14).
function rangoDelMes(texto) {
  const { anio, mes } = parsearMes(texto);
  const siguiente = mes === 12 ? { anio: anio + 1, mes: 1 } : { anio, mes: mes + 1 };
  return [
    `${anio}-${dosDigitos(mes)}-01`,
    `${siguiente.anio}-${dosDigitos(siguiente.mes)}-01`,
  ];
}

module.exports = { MESES, esMesValido, parsearMes, formatearMes, mesAnterior, mesActual, rangoDelMes };
