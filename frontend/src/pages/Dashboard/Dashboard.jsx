import { useAuth } from '../../context/AuthContext';

function Dashboard() {
  const { usuario } = useAuth();
  const nombre = usuario?.nombre || 'de nuevo';

  return (
    <div className="dashboard-container">
      <h1>¡Bienvenido, {nombre}!</h1>
      <p>Este es tu panel central de Stepping Stones.</p>
    </div>
  );
}

export default Dashboard;
