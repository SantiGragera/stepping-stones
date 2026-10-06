import { createContext, useContext, useEffect, useState } from 'react';
import { TOKEN_STORAGE_KEY, EVENTO_SESION_EXPIRADA } from '../services/api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'stepping_stones_usuario';

function leerSesionGuardada() {
  try {
    const usuario = sessionStorage.getItem(STORAGE_KEY);
    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    // Sin token no hay sesión válida (HU04): se descarta un usuario "suelto".
    return usuario && token ? JSON.parse(usuario) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerSesionGuardada);

  // datosUsuario: { id_usuario, nombre, apellido, email, id_rol, nombre_rol }
  // token: JWT devuelto por POST /api/login
  const login = (datosUsuario, token) => {
    setUsuario(datosUsuario);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(datosUsuario));
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  };

  const logout = () => {
    setUsuario(null);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  // Si el backend responde 401 (token vencido o inválido), se cierra la sesión
  // y ProtectedRoute redirige al login.
  useEffect(() => {
    const alExpirar = () => logout();
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  // Permite mostrar u ocultar secciones según el rol del usuario logueado.
  const tieneRol = (...roles) => {
    const normalizar = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    return roles.map(normalizar).includes(normalizar(usuario?.nombre_rol));
  };

  return (
    <AuthContext.Provider value={{ usuario, estaAutenticado: !!usuario, login, logout, tieneRol }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- este archivo exporta también el hook useAuth junto al provider
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return contexto;
}
