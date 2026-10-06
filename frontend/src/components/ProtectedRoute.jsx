import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Antes se podía entrar a /home escribiendo la URL, sin haber iniciado sesión.
// Este componente redirige a /login si no hay una sesión activa.
function ProtectedRoute({ children }) {
  const { estaAutenticado } = useAuth();

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
