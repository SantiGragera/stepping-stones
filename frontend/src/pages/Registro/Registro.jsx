import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import './Registro.css';

function Registro() {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repetirPassword, setRepetirPassword] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [errorGeneral, setErrorGeneral] = useState('');

  const navigate = useNavigate();

  // HU02 - Escenario 2: la alerta de seguridad se muestra mientras el usuario
  // interactúa con el campo, no solo al enviar el formulario.
  const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const REGEX_PASSWORD = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

  const validarEmailEnVivo = (valor) => {
    setEmail(valor);
    if (errorEmail && REGEX_EMAIL.test(valor)) setErrorEmail('');
  };

  const validarPasswordEnVivo = (valor) => {
    setPassword(valor);
    setErrorPassword(valor && !REGEX_PASSWORD.test(valor) ? 'Mínimo 8 caracteres, una mayúscula y un número' : '');
  };

  const validarFormulario = () => {
    let esValido = true;
    setErrorEmail('');
    setErrorPassword('');
    setErrorGeneral('');

    if (!REGEX_EMAIL.test(email)) {
      setErrorEmail('El formato de correo no es válido');
      esValido = false;
    }

    if (!REGEX_PASSWORD.test(password)) {
      setErrorPassword('Mínimo 8 caracteres, una mayúscula y un número');
      esValido = false;
    } else if (password !== repetirPassword) {
      setErrorPassword('Las contraseñas no coinciden');
      esValido = false;
    }
    return esValido;
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    try {
      await api.post('/api/registro', { nombreCompleto, email, password });
      alert('¡Cuenta creada exitosamente!');
      navigate('/login');
    } catch (err) {
      setErrorGeneral(err.message);
    }
  };

return (
  <div className="auth-container">
    <div className="logo-section">
      <div className="logo-box">S</div>
      <h1 className="brand-name">Stepping Stones</h1>
      <p className="brand-slogan">Your journey to fluency begins here.</p>
    </div>

    <div className="auth-card">
      <h2 className="card-title">Crea tu cuenta</h2>
      <div className="title-underline"></div>

      <form onSubmit={manejarSubmit}>
        <div className="form-group">
          <label>Nombre completo</label>
          <input 
            type="text" 
            placeholder="Nombre completo" 
            required 
            value={nombreCompleto} 
            onChange={(e) => setNombreCompleto(e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input 
            type="text" 
            placeholder="Email" 
            required 
            value={email} 
            onChange={(e) => validarEmailEnVivo(e.target.value)}
            onBlur={() => setErrorEmail(email && !REGEX_EMAIL.test(email) ? 'El formato de correo no es válido' : '')}
            className={errorEmail ? 'input-error' : ''} 
          />
          {errorEmail && <span className="error-text">{errorEmail}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              placeholder="Contraseña" 
              required 
              value={password} 
              onChange={(e) => validarPasswordEnVivo(e.target.value)}
              className={errorPassword ? 'input-error' : ''} 
            />
          </div>
          <div className="form-group">
            <label>Repetir contraseña</label>
            <input 
              type="password" 
              placeholder="Repetir contraseña" 
              required 
              value={repetirPassword} 
              onChange={(e) => setRepetirPassword(e.target.value)}
              className={errorPassword ? 'input-error' : ''} 
            />
          </div>
        </div>
        
        {errorPassword && <div className="error-text">{errorPassword}</div>}
        {errorGeneral && <div className="error-general">{errorGeneral}</div>}

        <button type="submit" className="btn-primary">Crear cuenta</button>
      </form>

      <p className="footer-text">
        ¿Ya tienes cuenta? <Link to="/login" className="footer-link">Iniciar sesión aquí</Link>
      </p>
    </div>
  </div>
);
}

export default Registro;
