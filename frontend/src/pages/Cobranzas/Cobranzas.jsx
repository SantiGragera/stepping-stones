import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ROLES_GESTION_COBRANZAS } from '../../constants/roles';
import './Cobranzas.css';

// =====================================================================
// Sprint 4 - ABM Transaccional: Gestión de Cobranzas (pagos de cuota)
//   HU09 Registro (alta)        -> modal "Registrar Cobranza"
//   HU10 Modificación           -> mismo modal en modo edición
//   HU11 Consulta y listado     -> tabla + filtros por alumno y mes
//   HU12 Eliminación lógica     -> modal de confirmación
// =====================================================================

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MENSAJE_MONTO_INVALIDO = 'El monto debe ser mayor a 0';

const FORMULARIO_VACIO = {
  id_alumno: '',
  monto: '',
  mes_correspondiente: mesActual(),
  id_metodo_pago: '',
};

function mesActual() {
  const hoy = new Date();
  return `${MESES[hoy.getMonth()]} ${hoy.getFullYear()}`;
}

// Opciones del select "Mes correspondiente": desde 6 meses atrás hasta 6 meses adelante.
function opcionesDeMes(mesExtra) {
  const hoy = new Date();
  const opciones = [];
  for (let desplazamiento = -6; desplazamiento <= 6; desplazamiento++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + desplazamiento, 1);
    opciones.push(`${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`);
  }
  // Al editar una cobranza vieja, su mes puede no estar en el rango: se agrega igual.
  if (mesExtra && !opciones.includes(mesExtra)) opciones.unshift(mesExtra);
  return opciones;
}

const formatoMoneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

function formatearFecha(fechaIso) {
  return new Date(fechaIso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function iniciales(nombre, apellido) {
  return `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase();
}

function claseMetodo(nombreMetodo = '') {
  const texto = nombreMetodo.toLowerCase();
  if (texto.includes('efectivo')) return 'metodo-efectivo';
  if (texto.includes('transfer')) return 'metodo-transferencia';
  return 'metodo-digital';
}

// HU09 - Escenarios 1 y 2 / HU10 - Escenario 2: misma validación para alta y edición.
function validarFormulario(formulario) {
  const errores = {};
  if (!formulario.id_alumno) errores.id_alumno = 'Seleccioná un alumno';
  if (formulario.monto === '' || formulario.monto === null) {
    errores.monto = 'El monto es obligatorio';
  } else if (!(Number(formulario.monto) > 0)) {
    errores.monto = MENSAJE_MONTO_INVALIDO;
  }
  if (!formulario.mes_correspondiente) errores.mes_correspondiente = 'Seleccioná el mes correspondiente';
  if (!formulario.id_metodo_pago) errores.id_metodo_pago = 'Seleccioná un método de pago';
  return errores;
}

function Cobranzas() {
  const { tieneRol } = useAuth();
  // HU09/HU10/HU12 son de la Secretaria; la Coordinadora Administrativa solo consulta (HU11).
  const puedeGestionar = tieneRol(...ROLES_GESTION_COBRANZAS);

  // Listado (HU11)
  const [cobranzas, setCobranzas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [filtroAlumno, setFiltroAlumno] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [mesesDisponibles, setMesesDisponibles] = useState([]);

  // Catálogos para los selects del formulario
  const [alumnos, setAlumnos] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);

  // Modal de alta / edición (HU09 / HU10)
  const [mostrarModal, setMostrarModal] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [erroresCampos, setErroresCampos] = useState({});
  const [errorFormulario, setErrorFormulario] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Modal de eliminación (HU12)
  const [cobranzaAEliminar, setCobranzaAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const obtenerCobranzas = useCallback(async (alumno, mes) => {
    setCargando(true);
    setErrorCarga('');
    try {
      const params = new URLSearchParams();
      if (alumno.trim()) params.set('alumno', alumno.trim());
      if (mes) params.set('mes', mes);
      const query = params.toString();
      const data = await api.get(`/api/cobranzas${query ? `?${query}` : ''}`);
      setCobranzas(data);
    } catch (error) {
      setErrorCarga(error.message);
    } finally {
      setCargando(false);
    }
  }, []);

  const obtenerMeses = useCallback(async () => {
    try {
      setMesesDisponibles(await api.get('/api/cobranzas/meses'));
    } catch {
      setMesesDisponibles([]);
    }
  }, []);

  // Carga de catálogos una sola vez al montar la página.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    obtenerMeses();
    Promise.all([api.get('/api/alumnos'), api.get('/api/metodos-pago')])
      .then(([listaAlumnos, listaMetodos]) => {
        setAlumnos(listaAlumnos);
        setMetodosPago(listaMetodos);
      })
      .catch((error) => setErrorCarga(error.message));
  }, [obtenerMeses]);

  // HU11 - Escenario 2: el filtro se aplica en el servidor (query params).
  // Para el texto se espera 300 ms después de la última tecla, así no se hace una consulta por letra.
  useEffect(() => {
    const espera = setTimeout(() => obtenerCobranzas(filtroAlumno, filtroMes), 300);
    return () => clearTimeout(espera);
  }, [filtroAlumno, filtroMes, obtenerCobranzas]);

  const recargar = async () => {
    await Promise.all([obtenerCobranzas(filtroAlumno, filtroMes), obtenerMeses()]);
  };

  // ------------------------- Alta / edición -------------------------

  const abrirModalCrear = () => {
    setIdEditando(null);
    setFormulario({ ...FORMULARIO_VACIO, mes_correspondiente: mesActual() });
    setErroresCampos({});
    setErrorFormulario('');
    setMostrarModal(true);
  };

  // HU10: se reutiliza el modal de alta, precargando los datos de la cobranza.
  const abrirModalEditar = (cobranza) => {
    setIdEditando(cobranza.id_cobranza);
    setFormulario({
      id_alumno: String(cobranza.id_alumno),
      monto: String(Number(cobranza.monto)),
      mes_correspondiente: cobranza.mes_correspondiente,
      id_metodo_pago: String(cobranza.id_metodo_pago),
    });
    setErroresCampos({});
    setErrorFormulario('');
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    if (!guardando) setMostrarModal(false);
  };

  const cambiarCampo = (campo) => (e) => {
    setFormulario((anterior) => ({ ...anterior, [campo]: e.target.value }));
    setErroresCampos((anterior) => ({ ...anterior, [campo]: undefined }));
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setErrorFormulario('');

    const errores = validarFormulario(formulario);
    setErroresCampos(errores);
    if (Object.keys(errores).length > 0) return;

    const datos = {
      id_alumno: Number(formulario.id_alumno),
      monto: Number(formulario.monto),
      mes_correspondiente: formulario.mes_correspondiente,
      id_metodo_pago: Number(formulario.id_metodo_pago),
    };

    setGuardando(true);
    try {
      if (idEditando) {
        await api.put(`/api/cobranzas/${idEditando}`, datos);
      } else {
        await api.post('/api/cobranzas', datos);
      }
      setMostrarModal(false);
      await recargar();
    } catch (error) {
      setErrorFormulario(error.message);
    } finally {
      setGuardando(false);
    }
  };

  // ---------------------- Eliminación lógica ------------------------

  const confirmarEliminacion = async () => {
    setEliminando(true);
    try {
      await api.delete(`/api/cobranzas/${cobranzaAEliminar.id_cobranza}`);
      setCobranzaAEliminar(null);
      await recargar();
    } catch (error) {
      alert(error.message);
    } finally {
      setEliminando(false);
    }
  };

  const hayFiltros = filtroAlumno.trim() !== '' || filtroMes !== '';

  return (
    <div className="cobranzas-container">
      <header className="cobranzas-header">
        <div>
          <h2>Cobranzas</h2>
          <p>Consultá y gestioná los pagos de cuota registrados por alumno.</p>
        </div>
        {puedeGestionar && (
          <button className="btn-agregar" onClick={abrirModalCrear}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
            Registrar Cobranza
          </button>
        )}
      </header>

      {/* HU11 - Barra de filtros */}
      <div className="cobranzas-filtros">
        <input
          type="search"
          className="filtro-alumno"
          placeholder="Buscar por alumno..."
          value={filtroAlumno}
          onChange={(e) => setFiltroAlumno(e.target.value)}
        />
        <select className="filtro-mes" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
          <option value="">Todos los meses</option>
          {mesesDisponibles.map((mes) => (
            <option key={mes} value={mes}>{mes}</option>
          ))}
        </select>
      </div>

      <div className="cobranzas-card">
        <div className="cobranzas-table-header">
          <div>ALUMNO</div>
          <div>MES</div>
          <div>MONTO</div>
          <div>MÉTODO DE PAGO</div>
          <div>FECHA DE PAGO</div>
          <div></div>
        </div>

        <div className="cobranzas-table-body">
          {cargando && <div className="cobranzas-estado">Cargando cobranzas...</div>}

          {!cargando && errorCarga && <div className="cobranzas-estado estado-error">{errorCarga}</div>}

          {!cargando && !errorCarga && cobranzas.length === 0 && (
            <div className="cobranzas-estado">
              {hayFiltros ? 'No hay cobranzas que coincidan con el filtro.' : 'Todavía no hay cobranzas registradas.'}
            </div>
          )}

          {!cargando && !errorCarga && cobranzas.map((cobranza) => (
            <div className="cobranzas-row" key={cobranza.id_cobranza}>
              <div className="celda-alumno">
                <span className="avatar-iniciales">{iniciales(cobranza.alumno_nombre, cobranza.alumno_apellido)}</span>
                <strong>{cobranza.alumno_nombre} {cobranza.alumno_apellido}</strong>
              </div>
              <div>{cobranza.mes_correspondiente}</div>
              <div className="celda-monto">{formatoMoneda.format(Number(cobranza.monto))}</div>
              <div>
                <span className={`badge-metodo ${claseMetodo(cobranza.nombre_metodo)}`}>{cobranza.nombre_metodo}</span>
              </div>
              <div title={cobranza.registrado_por ? `Registrada por ${cobranza.registrado_por}` : ''}>
                {formatearFecha(cobranza.fecha_pago)}
              </div>
              <div className="celda-acciones">
                {puedeGestionar && (
                  <>
                    <button className="action-btn edit-btn" title="Editar" onClick={() => abrirModalEditar(cobranza)}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button className="action-btn delete-btn" title="Eliminar" onClick={() => setCobranzaAEliminar(cobranza)}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HU09 / HU10 - Modal de alta y edición */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content cobranza-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{idEditando ? 'Editar Cobranza' : 'Registrar Cobranza'}</h3>
            <p className="modal-subtitulo">
              {idEditando ? 'Corregí los datos de un pago ya cargado.' : 'Completá los datos del pago recibido.'}
            </p>

            {errorFormulario && <div className="cobranza-error-general">{errorFormulario}</div>}

            <form onSubmit={manejarSubmit} noValidate>
              <label htmlFor="cobranza-alumno">Alumno *</label>
              <select
                id="cobranza-alumno"
                value={formulario.id_alumno}
                onChange={cambiarCampo('id_alumno')}
                className={erroresCampos.id_alumno ? 'campo-error' : ''}
              >
                <option value="">Seleccionar alumno...</option>
                {alumnos.map((alumno) => (
                  <option key={alumno.id_alumno} value={alumno.id_alumno}>
                    {alumno.nombre} {alumno.apellido}
                  </option>
                ))}
              </select>
              {erroresCampos.id_alumno && <span className="texto-error">{erroresCampos.id_alumno}</span>}

              <div className="cobranza-fila">
                <div>
                  <label htmlFor="cobranza-monto">Monto *</label>
                  <div className={`input-monto ${erroresCampos.monto ? 'campo-error' : ''}`}>
                    <span>$</span>
                    <input
                      id="cobranza-monto"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={formulario.monto}
                      onChange={cambiarCampo('monto')}
                    />
                  </div>
                  {erroresCampos.monto && <span className="texto-error">{erroresCampos.monto}</span>}
                </div>

                <div>
                  <label htmlFor="cobranza-mes">Mes correspondiente *</label>
                  <select
                    id="cobranza-mes"
                    value={formulario.mes_correspondiente}
                    onChange={cambiarCampo('mes_correspondiente')}
                    className={erroresCampos.mes_correspondiente ? 'campo-error' : ''}
                  >
                    <option value="">Seleccionar mes...</option>
                    {opcionesDeMes(formulario.mes_correspondiente).map((mes) => (
                      <option key={mes} value={mes}>{mes}</option>
                    ))}
                  </select>
                  {erroresCampos.mes_correspondiente && <span className="texto-error">{erroresCampos.mes_correspondiente}</span>}
                </div>
              </div>

              <label htmlFor="cobranza-metodo">Método de pago *</label>
              <select
                id="cobranza-metodo"
                value={formulario.id_metodo_pago}
                onChange={cambiarCampo('id_metodo_pago')}
                className={erroresCampos.id_metodo_pago ? 'campo-error' : ''}
              >
                <option value="">Seleccionar método...</option>
                {metodosPago.map((metodo) => (
                  <option key={metodo.id_metodo_pago} value={metodo.id_metodo_pago}>
                    {metodo.nombre_metodo}
                  </option>
                ))}
              </select>
              {erroresCampos.id_metodo_pago && <span className="texto-error">{erroresCampos.id_metodo_pago}</span>}

              <div className="modal-actions">
                <button type="button" className="btn-cancelar" onClick={cerrarModal} disabled={guardando}>Cancelar</button>
                <button type="submit" className="btn-agregar" disabled={guardando}>
                  {guardando ? 'Guardando...' : idEditando ? 'Guardar cambios' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HU12 - Escenario 1: confirmación antes de la baja lógica */}
      {cobranzaAEliminar && (
        <div className="modal-overlay" onClick={() => !eliminando && setCobranzaAEliminar(null)}>
          <div className="modal-content cobranza-modal-eliminar" onClick={(e) => e.stopPropagation()}>
            <div className="icono-advertencia">⚠</div>
            <h3>¿Eliminar esta cobranza?</h3>
            <p>
              Se dará de baja el pago de <strong>{cobranzaAEliminar.alumno_nombre} {cobranzaAEliminar.alumno_apellido}</strong>{' '}
              correspondiente a <strong>{cobranzaAEliminar.mes_correspondiente}</strong>. El registro dejará de aparecer
              en el listado, pero se conserva en la base de datos para auditoría.
            </p>
            <div className="modal-actions centrado">
              <button className="btn-cancelar" onClick={() => setCobranzaAEliminar(null)} disabled={eliminando}>Cancelar</button>
              <button className="btn-eliminar" onClick={confirmarEliminacion} disabled={eliminando}>
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cobranzas;
