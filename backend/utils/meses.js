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

module.exports = { MESES, esMesValido };
