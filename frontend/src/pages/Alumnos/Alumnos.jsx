import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import './Alumnos.css';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function mesDe(fecha) {
  return `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

function opcionesDeMes() {
  const hoy = new Date();
  const opciones = [];
  for (let d = 1; d >= -12; d--) {
    opciones.push(mesDe(new Date(hoy.getFullYear(), hoy.getMonth() + d, 1)));
  }
  return opciones;
}

const COLUMNAS = [
  { clave: 'alumno', titulo: 'ALUMNO' },
  { clave: 'dni', titulo: 'DNI' },
  { clave: 'tutor', titulo: 'TUTOR' },
  { clave: 'telefono', titulo: 'TELÉFONO' },
  { clave: 'ultimo_pago', titulo: 'ÚLTIMO PAGO' },
  { clave: 'estado', titulo: 'ESTADO' },
];

function formatearFecha(fechaIso) {
  if (!fechaIso) return '—';
  return new Date(fechaIso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function iniciales(nombre, apellido) {
  return `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase();
}

const escaparCsv = (valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`;

function Alumnos() {
  const [mes, setMes] = useState(mesDe(new Date()));
  const [estado, setEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('alumno');
  const [direccion, setDireccion] = useState('asc');
  const [pagina, setPagina] = useState(1);

  const [datos, setDatos] = useState({ total: 0, totalPaginas: 1, resultados: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exportando, setExportando] = useState(false);

  const armarQuery = useCallback((extra = {}) => {
    const params = new URLSearchParams({ mes, orden, direccion, ...extra });
    if (estado) params.set('estado', estado);
    if (busqueda.trim()) params.set('q', busqueda.trim());
    return params.toString();
  }, [mes, estado, busqueda, orden, direccion]);

  const volverAPrimera = () => setPagina(1);

  useEffect(() => {
    let cancelado = false;
    const espera = setTimeout(async () => {
      setCargando(true);
      setError('');
      try {
        const data = await api.get(`/api/alumnos/estado-cuotas?${armarQuery({ pagina })}`);
        if (cancelado) return;
        setDatos(data);
        if (data.pagina !== pagina) setPagina(data.pagina);
      } catch (e) {
        if (!cancelado) setError(e.message);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }, 300);
    return () => {
      cancelado = true;
      clearTimeout(espera);
    };
  }, [armarQuery, pagina]);

  const ordenarPor = (clave) => {
    if (orden === clave) {
      setDireccion((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrden(clave);
      setDireccion('asc');
    }
    volverAPrimera();
  };

  const hayFiltros = estado !== '' || busqueda.trim() !== '' || mes !== mesDe(new Date());

  const limpiarFiltros = () => {
    setMes(mesDe(new Date()));
    setEstado('');
    setBusqueda('');
    setOrden('alumno');
    setDireccion('asc');
    volverAPrimera();
  };

  const exportarCsv = async () => {
    setExportando(true);
    try {
      const data = await api.get(`/api/alumnos/estado-cuotas?${armarQuery({ exportar: '1' })}`);
      const filtros = [
        `Mes: ${mes}`,
        `Estado: ${estado === 'al-dia' ? 'Al día' : estado === 'adeuda' ? 'Adeuda' : 'Todos'}`,
        `Búsqueda: ${busqueda.trim() || '(ninguna)'}`,
        `Orden: ${COLUMNAS.find((c) => c.clave === orden)?.titulo} ${direccion === 'asc' ? 'ascendente' : 'descendente'}`,
      ];
      const lineas = [
        [`Listado de alumnos con estado de cuota - generado el ${new Date().toLocaleString('es-AR')}`],
        [`Filtros aplicados: ${filtros.join(' | ')}`],
        [`Total de resultados: ${data.total}`],
        [],
        COLUMNAS.map((c) => c.titulo),
        ...data.resultados.map((a) => [
          `${a.nombre} ${a.apellido}`,
          a.dni,
          a.nombre_tutor,
          a.telefono_tutor || '',
          formatearFecha(a.ultimo_pago) === '—' ? '' : formatearFecha(a.ultimo_pago),
          a.al_dia ? 'Al día' : 'Adeuda',
        ]),
      ];
      const csv = `${lineas.map((l) => l.map(escaparCsv).join(';')).join('\r\n')}`;
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `alumnos-${mes.replace(' ', '-')}.csv`;
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setExportando(false);
    }
  };

  const inicio = datos.total === 0 ? 0 : (datos.pagina - 1) * datos.porPagina + 1;
  const fin = Math.min(datos.pagina * datos.porPagina, datos.total);

  return (
    <div className="alumnos-container">
      <header className="alumnos-header">
        <div>
          <h2>Alumnos</h2>
          <p>Estado de la cuota de cada alumno en el mes elegido.</p>
        </div>
        <button className="btn-agregar" onClick={exportarCsv} disabled={exportando || datos.total === 0}>
          {exportando ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </header>

      <div className="alumnos-filtros">
        <input
          type="search"
          className="filtro-busqueda"
          placeholder="Buscar por nombre, DNI o tutor..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); volverAPrimera(); }}
        />
        <select value={mes} onChange={(e) => { setMes(e.target.value); volverAPrimera(); }} aria-label="Mes de la cuota">
          {opcionesDeMes().map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={estado} onChange={(e) => { setEstado(e.target.value); volverAPrimera(); }} aria-label="Estado de cuota">
          <option value="">Todos los estados</option>
          <option value="al-dia">Al día</option>
          <option value="adeuda">Adeuda</option>
        </select>
        {hayFiltros && <button className="btn-limpiar" onClick={limpiarFiltros}>Limpiar filtros</button>}
      </div>

      <div className="alumnos-card">
        <div className="alumnos-table-header">
          {COLUMNAS.map((c) => (
            <button key={c.clave} className="th-orden" onClick={() => ordenarPor(c.clave)}>
              {c.titulo}
              <span className="flecha">{orden === c.clave ? (direccion === 'asc' ? '▲' : '▼') : ''}</span>
            </button>
          ))}
        </div>

        <div className="alumnos-table-body">
          {cargando && <div className="alumnos-estado">Cargando alumnos...</div>}
          {!cargando && error && <div className="alumnos-estado estado-error">{error}</div>}
          {!cargando && !error && datos.resultados.length === 0 && (
            <div className="alumnos-estado">
              {hayFiltros ? 'No hay alumnos que coincidan con los filtros.' : 'Todavía no hay alumnos registrados.'}
            </div>
          )}
          {!cargando && !error && datos.resultados.map((a) => (
            <div className="alumnos-row" key={a.id_alumno}>
              <div className="celda-alumno">
                <span className="avatar-iniciales">{iniciales(a.nombre, a.apellido)}</span>
                <strong>{a.nombre} {a.apellido}</strong>
              </div>
              <div>{a.dni}</div>
              <div>{a.nombre_tutor}</div>
              <div>{a.telefono_tutor || '—'}</div>
              <div>{formatearFecha(a.ultimo_pago)}</div>
              <div>
                <span className={`badge-estado ${a.al_dia ? 'estado-al-dia' : 'estado-adeuda'}`}>
                  {a.al_dia ? 'Al día' : 'Adeuda'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <footer className="alumnos-footer">
          <span>
            {datos.total === 0 ? '0 resultados' : `Mostrando ${inicio}–${fin} de ${datos.total} alumnos`}
          </span>
          <div className="paginacion">
            <button disabled={datos.pagina <= 1 || cargando} onClick={() => setPagina(datos.pagina - 1)}>Anterior</button>
            <span>Página {datos.pagina} de {datos.totalPaginas}</span>
            <button disabled={datos.pagina >= datos.totalPaginas || cargando} onClick={() => setPagina(datos.pagina + 1)}>Siguiente</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Alumnos;
