# Stepping Stones

Sistema de gestión para la academia de inglés Stepping Stones.
Práctica Profesionalizante · ISSD · Santiago Roman Gragera

- **Frontend:** React + Vite (`frontend/`)
- **Backend:** Node.js + Express (`backend/`)
- **Base de datos:** MySQL (`database/`)

## Cómo levantar el proyecto

1. **Base de datos**
   - Si es una base nueva, corré `mysql -u root -p < database/schema.sql`.
   - Si ya tenés la base de los sprints anteriores, corré solo la migración del Sprint 4:
     `mysql -u root -p stepping_stones_db < database/migrations/sprint4_cobranzas_activo.sql`
2. **Backend:** copiá `backend/.env.example` a `backend/.env` y completalo. Incluí `JWT_SECRET`. Después corré `cd backend && npm install && npm run dev`.
3. **Frontend:** copiá `frontend/.env.example` a `frontend/.env`. Después corré `cd frontend && npm install && npm run dev`.
4. **Tests del backend:** `cd backend && npm test`.

Usuarios de prueba (del script de la base):

| Usuario | Email | Contraseña | Rol |
|---|---|---|---|
| Ana García | direccion@steppingstones.com | agarcia123 | Directora |
| María López | secretaria@steppingstones.com | mlopez123 | Secretaria |
| Laura Martínez | laura.docente@steppingstones.com | lmartinez123 | Docente |

## Dónde está cada historia de usuario en el código

### Sprint 1: Inicio de sesión

| HU | Qué hace | Dónde está |
|---|---|---|
| HU01 | Registro de nuevo usuario | `frontend/src/pages/Registro/`, `POST /api/registro` en `backend/routes/auth.routes.js` |
| HU02 | Validación de datos de registro | Validación en vivo en `Registro.jsx` y en el servidor con `backend/utils/validators.js` |
| HU03 | Acceso de usuario registrado | `frontend/src/pages/Login/`, sesión global en `frontend/src/context/AuthContext.jsx` |
| HU04 | Verificación de autenticidad y JWT | `POST /api/login`, `backend/utils/jwt.js`, `backend/middlewares/auth.middleware.js`. El token viaja en el header `Authorization` (lo pone `frontend/src/services/api.js`) |
| HU05 | Recuperación de contraseña | `POST /api/recupero`, `PUT /api/reset-password`, `frontend/src/pages/Recupero/` |

### Sprint 2: ABM de soporte (Roles)

| HU | Qué hace | Dónde está |
|---|---|---|
| HU06 | Alta y modificación de roles | `POST` y `PUT /api/roles` en `backend/routes/roles.routes.js`, modal en `Roles.jsx` |
| HU07 | Listado y búsqueda de roles | `GET /api/roles`, tabla y buscador en `frontend/src/pages/Roles/Roles.jsx` |
| HU08 | Eliminación de roles | `DELETE /api/roles/:id`, que no deja borrar un rol si tiene usuarios asignados |

### Sprint 3: Ajustes, pruebas y revisión

| Historia técnica | Dónde está |
|---|---|
| HT1: Credenciales en variables de entorno | `backend/.env.example`, `backend/config/` |
| HT2: Hash de contraseñas con migración transparente | `backend/utils/password.js`, login en `auth.routes.js` |
| HT3: Rutas protegidas y sesión | `frontend/src/components/ProtectedRoute.jsx`, `AuthContext.jsx` |
| HT4: URL de la API centralizada | `frontend/src/services/api.js` (`VITE_API_URL`) |
| HT5: Pool de conexiones MySQL | `backend/config/db.js` |
| Pruebas automatizadas | `backend/tests/` (`npm test`, con `node:test`) |

### Sprint 4: ABM transaccional (Cobranzas)

| HU | Qué hace | Dónde está |
|---|---|---|
| HU09 | Registro de una cobranza | `POST /api/cobranzas`, modal "Registrar Cobranza" |
| HU10 | Modificación de una cobranza | `PUT /api/cobranzas/:id`, el mismo modal en modo edición |
| HU11 | Consulta y listado con filtros por alumno y mes | `GET /api/cobranzas?alumno=&mes=`, tabla y barra de filtros |
| HU12 | Eliminación lógica | `DELETE /api/cobranzas/:id`, que hace `UPDATE activo = 0`. Migración en `database/migrations/` |

- **Backend:** `backend/routes/cobranzas.routes.js`. Los selects de alumnos y métodos de pago salen de `backend/routes/catalogos.routes.js`.
- **Frontend:** `frontend/src/pages/Cobranzas/`.
- **Permisos:**
  - La Secretaria y la Directora registran, editan y eliminan cobranzas.
  - La Coordinadora Administrativa solo las consulta.
