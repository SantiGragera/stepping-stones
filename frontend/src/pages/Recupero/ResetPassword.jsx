import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ResetPassword.css';

function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  const tieneOchoCaracteres = password.length >= 8;
  const tieneMayusculaYNumero = /^(?=.*[A-Z])(?=.*\d)/.test(password);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmar) return alert('Las contraseñas no coinciden');
    if (!tieneOchoCaracteres || !tieneMayusculaYNumero) return;

    try {
      const respuesta = await fetch('http://localhost:3001/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      if (respuesta.ok) {
        alert('¡Contraseña actualizada!');
        navigate('/login');
      } else {
        const data = await respuesta.json();
        setMensaje(data.mensaje);
      }
    } catch (err) {
      console.error(err)
      setMensaje('Error de conexión.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="brand-title-small">Stepping Stones</h1>
        <div className="title-underline-center"></div>

        <h2 className="card-title">Crear nueva contraseña</h2>
        <p className="card-subtitle-left">Asegúrate de que sea una contraseña segura</p>

        {mensaje && <p className="mensaje-error">{mensaje}</p>}

        <form onSubmit={manejarSubmit}>
          <div className="form-group">
            <label>Nueva Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label>Confirmar Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required 
              value={confirmar} 
              onChange={(e) => setConfirmar(e.target.value)} 
            />
          </div>

          <div className="validacion-info">
            <ul className="validacion-lista">
              <li className={tieneOchoCaracteres ? 'cumplido' : ''}>
                {tieneOchoCaracteres ? '●' : '○'} Al menos 8 caracteres
              </li>
              <li className={tieneMayusculaYNumero ? 'cumplido' : ''}>
                {tieneMayusculaYNumero ? '●' : '○'} Incluye una mayúscula y un número
              </li>
            </ul>
          </div>

          <button type="submit" className="btn-primary">
            Guardar y entrar <span>→</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;