// Base de la API centralizada: antes cada página tenía "http://localhost:3001"
// hardcodeado y repetido. Ahora sale de una sola variable de entorno (Vite),
// así que cambiar de entorno (dev/producción) es cambiar un solo valor.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// HU04: el JWT que devuelve /api/login se guarda en sessionStorage (ver AuthContext)
// y se adjunta automáticamente en el header Authorization de cada petición.
export const TOKEN_STORAGE_KEY = 'stepping_stones_token';
export const EVENTO_SESION_EXPIRADA = 'stepping-stones:sesion-expirada';

function obtenerToken() {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';

  const token = obtenerToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const opciones = {
    method,
    headers,
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
    // Si el token venció o es inválido, avisamos al AuthContext para cerrar la sesión.
    if (respuesta.status === 401 && token) {
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }

    const error = new Error(data.mensaje || 'Ocurrió un error inesperado.');
    error.status = respuesta.status;
    throw error;
  }

  return data;
}

// Descarga de archivos binarios (HU14: PDF del informe). Devuelve { blob, nombre }.
// Usa el mismo header Authorization que el resto de las peticiones.
async function descargarArchivo(path) {
  const token = obtenerToken();
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (err) {
    throw new Error('Error de conexión con el servidor.', { cause: err });
  }

  if (!respuesta.ok) {
    const data = await respuesta.json().catch(() => ({}));
    if (respuesta.status === 401 && token) window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    const error = new Error(data.mensaje || 'No se pudo descargar el archivo.');
    error.status = respuesta.status;
    throw error;
  }

  const disposicion = respuesta.headers.get('Content-Disposition') || '';
  const coincidencia = /filename="?([^"]+)"?/.exec(disposicion);
  return { blob: await respuesta.blob(), nombre: coincidencia ? coincidencia[1] : 'descarga' };
}

export const api = {
  get: (path) => apiRequest(path),
  post: (path, body) => apiRequest(path, { method: 'POST', body }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body }),
  delete: (path) => apiRequest(path, { method: 'DELETE' }),
  descargar: descargarArchivo,
};

export default API_URL;
