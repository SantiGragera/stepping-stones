import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await api.post('/api/login', { email, password });
      login(data.usuario, data.token);
      navigate('/home');
    } catch (err) {
      setError(err.message);
    }
  };

return (
  <div className="login-container">
    <div className="login-card">
      <div className="logo-box">S</div> 
      <h1 className="brand-name">Stepping Stones</h1>

      <h2 className="login-title">Iniciar sesión</h2>
      <p className="login-subtitle">Continúa tu camino hacia la maestría del idioma.</p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={manejarSubmit}>
        <div className="form-group">
          <div className="label-row"><label>Email</label></div>
          <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="form-group">
          <div className="label-row">
            <label>Contraseña</label>
            <Link to="/recupero" className="forgot-link">¿Olvidaste tu contraseña?</Link>
          </div>
          <input type="password" placeholder="Contraseña" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button type="submit" className="btn-primary">
          Ingresar <span>→</span>
        </button>
      </form>

      <p className="register-text">
        ¿No tienes cuenta? <Link to="/registro" className="register-link">Regístrate</Link>
      </p>
    </div>
  </div>
);
}

export default Login;
