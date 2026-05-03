import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const respuesta = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        navigate('/home'); 
      } else {
        setError(data.mensaje);
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor.');
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