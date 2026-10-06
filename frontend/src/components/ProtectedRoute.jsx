import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Antes se podía entrar a /home escribiendo la URL, sin haber iniciado sesión.
// Este componente redirige a /login si no hay una sesión activa.
// Opcionalmente recibe "roles": si el usuario no tiene ninguno de esos roles,
// se lo devuelve al Panel de Control (ej.: Cobranzas, Sprint 4).
function ProtectedRoute({ children, roles }) {
  const { estaAutenticado, tieneRol } = useAuth();

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !tieneRol(...roles)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default ProtectedRoute;
