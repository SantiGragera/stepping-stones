const PDFDocument = require('pdfkit');

// =====================================================================
// Sprint 5 - HU14, Escenario 4: PDF del informe de recaudación.
// Página 1: portada (título, período y fecha de generación).
// Página 2: indicadores, gráfico de barras por método de pago y tabla de desglose.
// Usa solo las fuentes estándar de PDF (Helvetica), sin archivos externos.
// =====================================================================

const MARRON = '#a35d18';
const ARENA = '#e8cbab';
const GRIS = '#718096';
const OSCURO = '#2d3748';

const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const numero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });
const fmtMoneda = (v) => (v === null || v === undefined ? '—' : moneda.format(v));
const fmtPct = (v) => (v === null || v === undefined ? '—' : `${numero.format(v)} %`);

function fechaHora(iso) {
  const f = new Date(iso);
  const dd = (n) => String(n).padStart(2, '0');
  return `${dd(f.getDate())}/${dd(f.getMonth() + 1)}/${f.getFullYear()} a las ${dd(f.getHours())}:${dd(f.getMinutes())}`;
}

// Texto de la variación de un indicador: "+$ 50.000 (+9,1 %)", "+6,7 p.p.", "—", "sin base de comparación".
function textoVariacion(v, { puntos = false, moneda: esMoneda = false } = {}) {
  if (!v || v.absoluta === null) return '—';
  const signo = v.absoluta > 0 ? '+' : v.absoluta < 0 ? '−' : '';
  const abs = Math.abs(v.absoluta);
  if (puntos) return `${signo}${numero.format(abs)} p.p.`;
  const base = esMoneda ? moneda.format(abs) : numero.format(abs);
  const pct = v.sinBase ? 'sin base de comparación' : v.porcentual === null ? '—' : `${v.porcentual > 0 ? '+' : v.porcentual < 0 ? '−' : ''}${numero.format(Math.abs(v.porcentual))} %`;
  return `${signo}${base} (${pct})`;
}

function generarPdfRecaudacion(informe, { comparar = false } = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `Informe de recaudación - ${informe.mes}` } });
    const partes = [];
    doc.on('data', (p) => partes.push(p));
    doc.on('end', () => resolve(Buffer.concat(partes)));
    doc.on('error', reject);

    const ancho = doc.page.width - 100;

    // ---------------- Portada ----------------
    doc.rect(0, 0, doc.page.width, 12).fill(MARRON);
    doc.fillColor(MARRON).font('Helvetica-Bold').fontSize(14).text('Stepping Stones', 50, 250);
    doc.fillColor(OSCURO).fontSize(34).text('Informe de recaudación', 50, 275);
    doc.fillColor(GRIS).font('Helvetica').fontSize(16).text(`Período: ${informe.mes}`, 50, 330);
    doc.fontSize(11).text('Dinero recibido en el mes, según la fecha de pago.', 50, 358);
    doc.text(`Generado el ${fechaHora(informe.generado)}`, 50, 376);
    doc.text(comparar ? `Incluye comparación con ${informe.mesAnterior}.` : 'Sin comparación con el mes anterior.', 50, 394);

    // ---------------- Indicadores ----------------
    doc.addPage();
    doc.fillColor(OSCURO).font('Helvetica-Bold').fontSize(18).text(`Indicadores de ${informe.mes}`, 50, 50);

    const { indicadores: ind } = informe;
    const tarjetas = [
      ['TOTAL RECAUDADO', fmtMoneda(ind.totalRecaudado.valor), textoVariacion(ind.totalRecaudado.variacion, { moneda: true })],
      ['PAGOS REGISTRADOS', String(ind.pagos.valor), textoVariacion(ind.pagos.variacion)],
      ['MONTO PROMEDIO', fmtMoneda(ind.montoPromedio.valor), textoVariacion(ind.montoPromedio.variacion, { moneda: true })],
      ['ALUMNOS AL DÍA', fmtPct(ind.alumnosAlDia.valor), textoVariacion(ind.alumnosAlDia.variacion, { puntos: true })],
    ];
    const anchoTarjeta = (ancho - 30) / 4;
    tarjetas.forEach(([titulo, valor, variacionTxt], i) => {
      const x = 50 + i * (anchoTarjeta + 10);
      doc.roundedRect(x, 85, anchoTarjeta, comparar ? 82 : 62, 6).lineWidth(0.5).stroke('#cbd5e0');
      doc.fillColor(GRIS).font('Helvetica-Bold').fontSize(7).text(titulo, x + 8, 95, { width: anchoTarjeta - 16 });
      doc.fillColor(OSCURO).fontSize(13).text(valor, x + 8, 110, { width: anchoTarjeta - 16 });
      if (comparar) {
        doc.fillColor(GRIS).font('Helvetica').fontSize(7.5).text(`${variacionTxt} vs. ${informe.mesAnterior}`, x + 8, 134, { width: anchoTarjeta - 16 });
      } else if (i === 3) {
        doc.fillColor(GRIS).font('Helvetica').fontSize(7.5).text(`${ind.alumnosAlDia.alDia} de ${ind.alumnosAlDia.alumnosActivos} alumnos activos`, x + 8, 128, { width: anchoTarjeta - 16 });
      }
    });

    let y = comparar ? 185 : 165;
    doc.fillColor(GRIS).font('Helvetica').fontSize(8)
      .text('Total recaudado, pagos y monto promedio: por fecha de pago. Alumnos al día: por mes correspondiente de la cuota. Solo cobranzas activas.', 50, y, { width: ancho });
    y += 28;

    // ---------------- Gráfico ----------------
    doc.fillColor(OSCURO).font('Helvetica-Bold').fontSize(13).text('Recaudación por método de pago', 50, y);
    y += 22;

    if (informe.sinPagos || informe.desglose.length === 0) {
      doc.fillColor(GRIS).font('Helvetica').fontSize(11).text('Sin pagos registrados en el período.', 50, y);
      return doc.end();
    }

    const altoGrafico = 140;
    const maximo = Math.max(...informe.desglose.map((m) => Math.max(m.total, comparar ? m.totalAnterior : 0)), 1);
    const grupo = ancho / informe.desglose.length;
    const base = y + altoGrafico;
    doc.moveTo(50, base).lineTo(50 + ancho, base).lineWidth(0.5).stroke('#cbd5e0');
    informe.desglose.forEach((m, i) => {
      const barras = comparar ? [[m.totalAnterior, ARENA], [m.total, MARRON]] : [[m.total, MARRON]];
      const anchoBarra = 34;
      const inicio = 50 + i * grupo + (grupo - barras.length * anchoBarra - (barras.length - 1) * 4) / 2;
      barras.forEach(([valor, color], k) => {
        const alto = (valor / maximo) * (altoGrafico - 16);
        const x = inicio + k * (anchoBarra + 4);
        doc.rect(x, base - alto, anchoBarra, alto).fill(color);
        doc.fillColor(OSCURO).font('Helvetica').fontSize(7).text(numero.format(valor), x - 6, base - alto - 10, { width: anchoBarra + 12, align: 'center' });
      });
      doc.fillColor(OSCURO).font('Helvetica-Bold').fontSize(9).text(m.metodo, 50 + i * grupo, base + 5, { width: grupo, align: 'center' });
    });
    y = base + 22;
    if (comparar) {
      doc.rect(50, y, 8, 8).fill(ARENA);
      doc.fillColor(GRIS).font('Helvetica').fontSize(8).text(informe.mesAnterior, 62, y);
      doc.rect(150, y, 8, 8).fill(MARRON);
      doc.fillColor(GRIS).text(informe.mes, 162, y);
      y += 16;
    }
    y += 10;

    // ---------------- Tabla de desglose ----------------
    doc.fillColor(OSCURO).font('Helvetica-Bold').fontSize(13).text('Desglose por método de pago', 50, y);
    y += 22;
    const columnas = comparar
      ? [['Método', 120, 'left'], ['Pagos', 45, 'right'], ['Total', 85, 'right'], ['%', 50, 'right'], [`Var. vs. ${informe.mesAnterior}`, 195, 'right']]
      : [['Método', 215, 'left'], ['Pagos', 70, 'right'], ['Total', 120, 'right'], ['%', 90, 'right']];
    const fila = (celdas, { negrita = false, fondo = null } = {}) => {
      if (fondo) doc.rect(50, y - 3, ancho, 17).fill(fondo);
      let x = 50;
      doc.fillColor(OSCURO).font(negrita ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
      celdas.forEach((c, i) => {
        const [, w, align] = columnas[i];
        doc.text(c, x + 4, y, { width: w - 8, align });
        x += w;
      });
      y += 18;
    };
    fila(columnas.map((c) => c[0]), { negrita: true, fondo: '#f1f3f5' });
    informe.desglose.forEach((m) => {
      const celdas = [m.metodo, String(m.pagos), fmtMoneda(m.total), fmtPct(m.porcentaje)];
      if (comparar) celdas.push(textoVariacion(m.variacion, { moneda: true }));
      fila(celdas);
    });
    const tot = informe.totalesDesglose;
    const celdasTotal = ['Total', String(tot.pagos), fmtMoneda(tot.total), '100 %'];
    if (comparar) celdasTotal.push(textoVariacion(tot.variacion, { moneda: true }));
    doc.moveTo(50, y - 4).lineTo(50 + ancho, y - 4).lineWidth(0.8).stroke(OSCURO);
    fila(celdasTotal, { negrita: true });

    doc.fillColor(GRIS).font('Helvetica').fontSize(8).text(`Generado el ${fechaHora(informe.generado)}. Solo cobranzas activas; los montos se agrupan por fecha de pago.`, 50, y + 12, { width: ancho });
    doc.end();
  });
}

module.exports = { generarPdfRecaudacion };
