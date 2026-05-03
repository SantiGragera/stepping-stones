import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Recupero.css';

function Recupero() {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    try {
      const respuesta = await fetch('http://localhost:3001/api/recupero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        setMensaje(data.mensaje);
      } else {
        setError(data.mensaje);
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="brand-title-small">Stepping Stones</h1>
        <div className="title-underline-center"></div>

        <h2 className="card-title-center">Recuperar contraseña</h2>
        <p className="card-subtitle">
          Ingresa tu correo para recibir un enlace de recuperación.
        </p>

        {mensaje && <div className="mensaje-exito">✅ {mensaje}</div>}
        {error && <div className="mensaje-error">⚠️ {error}</div>}

        <form onSubmit={manejarSubmit}>
          <div className="form-group">
            <label>Email registrado</label>
            <input 
              type="email" 
              placeholder="nombre@academia.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <button type="submit" className="btn-primary">
            Enviar enlace <span>→</span>
          </button>
        </form>

        <div className="footer-link-container">
          <Link to="/login" className="back-link">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Recupero;