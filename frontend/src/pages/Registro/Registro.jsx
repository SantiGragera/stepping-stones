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

  const validarFormulario = () => {
    let esValido = true;
    setErrorEmail('');
    setErrorPassword('');
    setErrorGeneral('');

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(email)) {
      setErrorEmail('El formato de correo no es válido');
      esValido = false;
    }

    const regexPassword = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!regexPassword.test(password)) {
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
            onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
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
