const test = require('node:test');
const assert = require('node:assert/strict');
const { montoPromedio, porcentajeAlDia, variacion } = require('../utils/informe');
const { mesAnterior, rangoDelMes, parsearMes, mesActual } = require('../utils/meses');

test('monto promedio = total ÷ pagos', () => {
  assert.equal(montoPromedio(600000, 24), 25000);
});

test('monto promedio sin pagos es null (no se divide por cero)', () => {
  assert.equal(montoPromedio(0, 0), null);
});

test('porcentaje de alumnos al día = al día ÷ activos × 100', () => {
  assert.equal(porcentajeAlDia(24, 30), 80);
  assert.equal(porcentajeAlDia(0, 30), 0);
});

test('porcentaje de alumnos al día sin alumnos activos es null', () => {
  assert.equal(porcentajeAlDia(0, 0), null);
});

test('variación absoluta y porcentual', () => {
  assert.deepEqual(variacion(600000, 550000), { absoluta: 50000, porcentual: 9.1, sinBase: false });
  assert.deepEqual(variacion(25000, 25000), { absoluta: 0, porcentual: 0, sinBase: false });
});

test('variación en puntos porcentuales para alumnos al día', () => {
  const v = variacion(80, 73.3, { puntos: true });
  assert.equal(v.absoluta, 6.7);
  assert.equal(v.porcentual, null);
});

test('mes anterior en cero: porcentual sin base de comparación', () => {
  assert.deepEqual(variacion(150000, 0), { absoluta: 150000, porcentual: null, sinBase: true });
});

test('ambos meses en cero: variación 0 (0 %)', () => {
  assert.deepEqual(variacion(0, 0), { absoluta: 0, porcentual: 0, sinBase: false });
});

test('valor no calculable: variación null', () => {
  assert.deepEqual(variacion(null, 25000), { absoluta: null, porcentual: null, sinBase: false });
  assert.deepEqual(variacion(25000, null), { absoluta: null, porcentual: null, sinBase: false });
});

test('mes anterior cruza el año', () => {
  assert.equal(mesAnterior('Octubre 2026'), 'Septiembre 2026');
  assert.equal(mesAnterior('Enero 2027'), 'Diciembre 2026');
});

test('rango de fechas del mes: [desde, hasta)', () => {
  assert.deepEqual(rangoDelMes('Octubre 2026'), ['2026-10-01', '2026-11-01']);
  assert.deepEqual(rangoDelMes('Diciembre 2026'), ['2026-12-01', '2027-01-01']);
});

test('parsearMes y mesActual', () => {
  assert.deepEqual(parsearMes('Marzo 2026'), { anio: 2026, mes: 3 });
  assert.equal(parsearMes('Marzo'), null);
  assert.equal(mesActual(new Date(2026, 9, 15)), 'Octubre 2026');
});
