import { useState, useEffect } from 'react';
import './Roles.css';

function Roles() {
  const [roles, setRoles] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  
  const [idRolEditando, setIdRolEditando] = useState(null);
  const [nombreRol, setNombreRol] = useState('');
  const [descripcionRol, setDescripcionRol] = useState(''); 

  const obtenerRoles = async () => {
    try {
      const respuesta = await fetch('http://localhost:3001/api/roles');
      const data = await respuesta.json();
      setRoles(data);
    } catch (error) {
      console.error('Error al obtener los roles:', error);
    }
  };

  useEffect(() => {
    fetch('http://localhost:3001/api/roles')
      .then((respuesta) => respuesta.json())
      .then((data) => setRoles(data))
      .catch((error) => console.error('Error en carga inicial:', error));
  }, []);

  const getIconoRol = (nombre) => {
    if (!nombre) return null;
    const normalize = nombre.toLowerCase();
    
    if (normalize.includes('admin') || normalize.includes('directora')) {
      return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><circle cx="12" cy="11" r="3"></circle></svg>;
    }
    if (normalize.includes('profesor') || normalize.includes('docente')) {
      return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
    }
    return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>;
  };

  const abrirModalCrear = () => {
    setIdRolEditando(null);
    setNombreRol('');
    setDescripcionRol('');
    setMostrarModal(true);
  };

  const abrirModalEditar = (rol) => {
    setIdRolEditando(rol.id_rol);
    setNombreRol(rol.nombre_rol);
    setDescripcionRol(rol.descripcion || ''); 
    setMostrarModal(true);
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    
    const datosRol = {
      nombre_rol: nombreRol,
      descripcion: descripcionRol
    };

    try {
      if (idRolEditando) {
        await fetch(`http://localhost:3001/api/roles/${idRolEditando}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosRol)
        });
      } else {
        await fetch('http://localhost:3001/api/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosRol)
        });
      }
      
      obtenerRoles();
      setMostrarModal(false);
    } catch (error) {
      console.error('Error al guardar el rol:', error);
    }
  };

  const eliminarRol = async (id) => {
    if(window.confirm('¿Estás seguro de eliminar este rol?')) {
      try {
        await fetch(`http://localhost:3001/api/roles/${id}`, {
          method: 'DELETE'
        });
        obtenerRoles();
      } catch (error) {
        console.error('Error al eliminar:', error);
      }
    }
  };

  return (
    <div className="roles-container">
      <header className="roles-header">
        <div className="roles-title-area">
          <h2>Gestión de Roles</h2>
          <p>Administra los permisos y accesos de los diferentes perfiles<br/>dentro de la plataforma educativa.</p>
        </div>
        <button className="btn-agregar" onClick={abrirModalCrear}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
          Agregar nuevo rol
        </button>
      </header>

      <div className="roles-card">
        <div className="roles-table-header">
          <div className="col-nombre">NOMBRE DEL ROL</div>
          <div className="col-desc">DESCRIPCIÓN</div>
          <div className="col-acciones">ACCIONES</div>
        </div>
        
        <div className="roles-table-body">
          {roles.map((rol) => (
            <div className="roles-row" key={rol.id_rol}>
              <div className="col-nombre row-nombre">
                <div className="rol-icon-box">
                  {getIconoRol(rol.nombre_rol)}
                </div>
                <strong>{rol.nombre_rol}</strong>
              </div>
              
              <div className="col-desc row-desc">
                {rol.descripcion || 'Sin descripción'}
              </div>
              
              <div className="col-acciones row-acciones">
                <button className="action-btn edit-btn" onClick={() => abrirModalEditar(rol)}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button className="action-btn delete-btn" onClick={() => eliminarRol(rol.id_rol)}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              </div>
            </div>
          ))}
          {roles.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#718096' }}>No hay roles cargados.</div>
          )}
        </div>
      </div>

      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{idRolEditando ? 'Editar Rol' : 'Crear Nuevo Rol'}</h3>
            <form onSubmit={manejarSubmit}>
              <label>Nombre del Rol</label>
              <input 
                type="text" 
                value={nombreRol}
                onChange={(e) => setNombreRol(e.target.value)}
                required
              />
              
              <label>Descripción</label>
              <input 
                type="text" 
                value={descripcionRol}
                onChange={(e) => setDescripcionRol(e.target.value)}
              />

              <div className="modal-actions">
                <button type="submit" className="btn-agregar">Guardar</button>
                <button type="button" className="btn-cancelar" onClick={() => setMostrarModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Roles;