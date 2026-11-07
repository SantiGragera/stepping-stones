import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import './Informes.css';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const mesDe = (fecha) => `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;

function opcionesDeMes() {
  const hoy = new Date();
  const opciones = [];
  for (let d = 0; d >= -18; d--) opciones.push(mesDe(new Date(hoy.getFullYear(), hoy.getMonth() + d, 1)));
  return opciones;
}

const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const numero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });
const fmtMoneda = (v) => (v === null || v === undefined ? '—' : moneda.format(v));
const fmtPct = (v) => (v === null || v === undefined ? '—' : `${numero.format(v)} %`);
const signo = (n) => (n > 0 ? '+' : n < 0 ? '−' : '');

function Variacion({ v, formato = 'numero', puntos = false, anterior }) {
  if (!v || v.absoluta === null) {
    return <span className="variacion neutra"><strong>—</strong> vs. {anterior}</span>;
  }
  const clase = v.absoluta > 0 ? 'sube' : v.absoluta < 0 ? 'baja' : 'neutra';
  const flecha = v.absoluta > 0 ? '▲' : v.absoluta < 0 ? '▼' : '=';
  const abs = Math.abs(v.absoluta);
  const valorAbs = puntos ? numero.format(abs) : formato === 'moneda' ? moneda.format(abs) : numero.format(abs);
  let detalle = '';
  if (puntos) detalle = ' p.p.';
  else if (v.sinBase) detalle = ' (sin base de comparación)';
  else if (v.porcentual !== null) detalle = ` (${signo(v.porcentual)}${numero.format(Math.abs(v.porcentual))} %)`;
  return (
    <span className={`variacion ${clase}`}>
      <strong>{flecha} {signo(v.absoluta)}{valorAbs}{detalle}</strong> vs. {anterior}
    </span>
  );
}

function Tarjeta({ titulo, valor, definicion, comparar, children, extra }) {
  return (
    <div className="kpi-card">
      <div className="kpi-titulo">
        <span>{titulo}</span>
        <span className="kpi-ayuda" title={definicion} aria-label={`Definición: ${definicion}`} tabIndex={0}>?</span>
      </div>
      <div className="kpi-valor">{valor}</div>
      <div className="kpi-detalle">{comparar ? children : extra}</div>
    </div>
  );
}

function Grafico({ desglose, comparar, mes, anterior }) {
  const maximo = Math.max(...desglose.map((m) => Math.max(m.total, comparar ? m.totalAnterior : 0)), 1);
  const alto = 220;
  const ancho = 560;
  const grupo = ancho / desglose.length;
  return (
    <svg viewBox={`0 0 ${ancho + 20} ${alto + 50}`} className="grafico" role="img" aria-label="Recaudación por método de pago">
      <line x1="10" y1={alto} x2={ancho + 10} y2={alto} stroke="#cbd5e0" />
      {desglose.map((m, i) => {
        const barras = comparar
          ? [{ v: m.totalAnterior, clase: 'barra-anterior' }, { v: m.total, clase: 'barra-actual' }]
          : [{ v: m.total, clase: 'barra-actual' }];
        const anchoBarra = 44;
        const inicio = 10 + i * grupo + (grupo - barras.length * anchoBarra - (barras.length - 1) * 4) / 2;
        return (
          <g key={m.metodo}>
            {barras.map((b, k) => {
              const h = (b.v / maximo) * (alto - 24);
              const x = inicio + k * (anchoBarra + 4);
              return (
                <g key={b.clase}>
                  <rect x={x} y={alto - h} width={anchoBarra} height={h} className={b.clase} rx="3" />
                  <text x={x + anchoBarra / 2} y={alto - h - 6} textAnchor="middle" className="barra-valor">
                    {moneda.format(b.v).replace('ARS', '$')}
                  </text>
                </g>
              );
            })}
            <text x={10 + i * grupo + grupo / 2} y={alto + 20} textAnchor="middle" className="barra-etiqueta">{m.metodo}</text>
          </g>
        );
      })}
      <title>{comparar ? `${anterior} vs. ${mes}` : mes}</title>
    </svg>
  );
}

function Informes() {
  const [mes, setMes] = useState(mesDe(new Date()));
  const [comparar, setComparar] = useState(true);
  const [informe, setInforme] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [descargando, setDescargando] = useState(false);

  const generar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setInforme(await api.get(`/api/informes/recaudacion?mes=${encodeURIComponent(mes)}`));
    } catch (e) {
      setError(e.message);
      setInforme(null);
    } finally {
      setCargando(false);
    }
  }, [mes]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount / al cambiar el mes
    generar();
  }, [generar]);

  const descargarPdf = async () => {
    setDescargando(true);
    setError('');
    try {
      const { blob, nombre } = await api.descargar(
        `/api/informes/recaudacion/pdf?mes=${encodeURIComponent(mes)}&comparar=${comparar ? 1 : 0}`
      );
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombre;
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setDescargando(false);
    }
  };

  const ind = informe?.indicadores;
  const def = informe?.definiciones || {};
  const ant = informe?.mesAnterior;

  return (
    <div className="informes-container">
      <header className="informes-header">
        <div>
          <h2>Informe de recaudación</h2>
          <p>Dinero recibido en el mes, según la fecha de pago.</p>
        </div>
        <div className="informes-controles">
          <select value={mes} onChange={(e) => setMes(e.target.value)} aria-label="Mes del informe">
            {opcionesDeMes().map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <label className="check-comparar">
            <input type="checkbox" checked={comparar} onChange={(e) => setComparar(e.target.checked)} />
            Comparar con mes anterior
          </label>
          <button className="btn-agregar" onClick={descargarPdf} disabled={descargando || cargando || !informe}>
            {descargando ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>
      </header>

      {error && <div className="informes-error">{error}</div>}
      {cargando && <div className="informes-estado">Generando informe...</div>}

      {!cargando && informe && (
        <>
          <section className="kpi-grid">
            <Tarjeta titulo="TOTAL RECAUDADO" valor={fmtMoneda(ind.totalRecaudado.valor)} definicion={def.totalRecaudado} comparar={comparar}>
              <Variacion v={ind.totalRecaudado.variacion} formato="moneda" anterior={ant} />
            </Tarjeta>
            <Tarjeta titulo="PAGOS REGISTRADOS" valor={ind.pagos.valor} definicion={def.pagos} comparar={comparar}>
              <Variacion v={ind.pagos.variacion} anterior={ant} />
            </Tarjeta>
            <Tarjeta titulo="MONTO PROMEDIO" valor={fmtMoneda(ind.montoPromedio.valor)} definicion={def.montoPromedio} comparar={comparar}>
              <Variacion v={ind.montoPromedio.variacion} formato="moneda" anterior={ant} />
            </Tarjeta>
            <Tarjeta
              titulo="ALUMNOS AL DÍA"
              valor={fmtPct(ind.alumnosAlDia.valor)}
              definicion={def.alumnosAlDia}
              comparar={comparar}
              extra={<span className="variacion neutra">{ind.alumnosAlDia.alDia} de {ind.alumnosAlDia.alumnosActivos} alumnos activos</span>}
            >
              <Variacion v={ind.alumnosAlDia.variacion} puntos anterior={ant} />
              <span className="variacion neutra"> · {ind.alumnosAlDia.alDia} de {ind.alumnosAlDia.alumnosActivos} alumnos</span>
            </Tarjeta>
          </section>

          {informe.sinPagos ? (
            <div className="informes-estado">Sin pagos registrados en el período.</div>
          ) : (
            <section className="informes-detalle">
              <div className="informes-card">
                <h3>Recaudación por método de pago</h3>
                <p className="sub">{comparar ? `${ant} vs. ${informe.mes}` : informe.mes}</p>
                {comparar && (
                  <div className="leyenda">
                    <span><i className="punto punto-anterior" /> {ant}</span>
                    <span><i className="punto punto-actual" /> {informe.mes}</span>
                  </div>
                )}
                <Grafico desglose={informe.desglose} comparar={comparar} mes={informe.mes} anterior={ant} />
              </div>

              <div className="informes-card">
                <h3>Desglose por método de pago</h3>
                <p className="sub">{informe.mes}{comparar ? ` · variación vs. ${ant}` : ''}</p>
                <table className="tabla-desglose">
                  <thead>
                    <tr>
                      <th>MÉTODO</th><th>PAGOS</th><th>TOTAL</th><th>%</th>{comparar && <th>VAR.</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {informe.desglose.map((m) => (
                      <tr key={m.metodo}>
                        <td>{m.metodo}</td>
                        <td>{m.pagos}</td>
                        <td>{fmtMoneda(m.total)}</td>
                        <td>{fmtPct(m.porcentaje)}</td>
                        {comparar && (
                          <td className={m.variacion.absoluta > 0 ? 'sube' : m.variacion.absoluta < 0 ? 'baja' : ''}>
                            {m.variacion.sinBase
                              ? 'sin base'
                              : m.variacion.porcentual === null
                                ? '—'
                                : `${signo(m.variacion.porcentual)}${numero.format(Math.abs(m.variacion.porcentual))} %`}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total</td>
                      <td>{informe.totalesDesglose.pagos}</td>
                      <td>{fmtMoneda(informe.totalesDesglose.total)}</td>
                      <td>100 %</td>
                      {comparar && (
                        <td>
                          {informe.totalesDesglose.variacion.sinBase
                            ? 'sin base'
                            : informe.totalesDesglose.variacion.porcentual === null
                              ? '—'
                              : `${signo(informe.totalesDesglose.variacion.porcentual)}${numero.format(Math.abs(informe.totalesDesglose.variacion.porcentual))} %`}
                        </td>
                      )}
                    </tr>
                  </tfoot>
                </table>
                <p className="nota">
                  Generado el {new Date(informe.generado).toLocaleString('es-AR')}.<br />
                  Solo cobranzas activas; los montos se agrupan por fecha de pago, no por mes de la cuota.
                </p>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default Informes;
