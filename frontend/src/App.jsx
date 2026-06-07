import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Registro from './pages/Registro/Registro';
import Login from './pages/Login/Login';
import Recupero from './pages/Recupero/Recupero';
import ResetPassword from './pages/Recupero/ResetPassword';
import Home from './pages/Home/Home';
import Dashboard from './pages/Dashboard/Dashboard'; // Importación actualizada
import Roles from './pages/Roles/Roles';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recupero" element={<Recupero />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/home" element={<Home />}>
          <Route index element={<Dashboard />} />
          <Route path="roles" element={<Roles />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;