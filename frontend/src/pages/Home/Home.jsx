import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();

  const cerrarSesion = () => {
    navigate('/login');
  };

  return (
    <div className="home-layout">
      <nav className="navbar">
        <div className="nav-brand">
          <div className="logo-box-small">S</div>
          <span>Stepping Stones</span>
        </div>
        <button className="btn-logout" onClick={cerrarSesion}>
          Cerrar Sesión
        </button>
      </nav>

      <main className="home-content">
        <header className="home-header">
          <h1>¡Bienvenido de nuevo!</h1>
          <p>Este es tu panel central de Stepping Stones.</p>
        </header>

      </main>
    </div>
  );
}

export default Home;