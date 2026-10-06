import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout } = useAuth();

  const cerrarSesion = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="home-layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand-section">
            <div className="brand-icon">S</div>
            <div className="brand-text">
              <h3>Stepping Stones</h3>
            </div>
          </div>

          <ul className="sidebar-menu">
            <li>
              <Link 
                to="/home" 
                className={`sidebar-link ${location.pathname === '/home' ? 'active' : ''}`}
              >
                Panel de Control
              </Link>
            </li>
            <li>
              <Link 
                to="/home/roles" 
                className={`sidebar-link ${location.pathname.includes('/roles') ? 'active' : ''}`}
              >
                Gestión de Roles
              </Link>
            </li>
          </ul>
        </div>

        <div className="sidebar-bottom">
          <button className="sidebar-btn help-btn">
            Ayuda
          </button>
          <button className="sidebar-btn logout-btn" onClick={cerrarSesion}>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="main-content">
      
        <nav className="top-navbar">
          <div className="breadcrumb">
            <strong>Stepping Stones</strong>
            <span className="separator"></span>
            <span className="path">
              Administración / {location.pathname.includes('/roles') ? 'Gestión de Roles' : 'Panel de Control'}
            </span>
          </div>
          <div className="top-nav-actions">
            <div className="profile-pic" title={usuario ? `${usuario.nombre} ${usuario.apellido}` : ''}>👨‍💼</div>
          </div>
        </nav>
        <main className="dashboard-body">
          <Outlet />
        </main>
        
      </div>
    </div>
  );
}

export default Home;
