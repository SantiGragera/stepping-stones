// Base de la API centralizada: antes cada página tenía "http://localhost:3001"
// hardcodeado y repetido. Ahora sale de una sola variable de entorno (Vite),
// así que cambiar de entorno (dev/producción) es cambiar un solo valor.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function apiRequest(path, { method = 'GET', body } = {}) {
  const opciones = {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  };

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${path}`, opciones);
  } catch (err) {
    throw new Error('Error de conexión con el servidor.', { cause: err });
  }

  const data = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    const error = new Error(data.mensaje || 'Ocurrió un error inesperado.');
    error.status = respuesta.status;
    throw error;
  }

  return data;
}

export const api = {
  get: (path) => apiRequest(path),
  post: (path, body) => apiRequest(path, { method: 'POST', body }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body }),
  delete: (path) => apiRequest(path, { method: 'DELETE' }),
};

export default API_URL;
