# Stepping Stones

Sistema de gestión para la academia de inglés Stepping Stones.
Práctica Profesionalizante · ISSD · Santiago Roman Gragera

- **Frontend:** React + Vite (`frontend/`)
- **Backend:** Node.js + Express (`backend/`)
- **Base de datos:** MySQL (`database/`)

## Cómo levantar el proyecto

1. **Base de datos**
   - Si es una base nueva, corré `mysql -u root -p < database/schema.sql`.
   - Si ya tenés la base de los sprints anteriores, corré solo las migraciones que te falten, en orden:
     `mysql -u root -p stepping_stones_db < database/migrations/sprint4_cobranzas_activo.sql`
     `mysql -u root -p stepping_stones_db < database/migrations/sprint5_alumnos_activo.sql`
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

### Sprint 5: Listados e informes

| HU | Qué hace | Dónde está |
|---|---|---|
| HU13 | Listado de alumnos con estado de cuota: búsqueda, filtros por mes y estado, orden por columna, paginación de a 10 y exportación a CSV | `GET /api/alumnos/estado-cuotas` en `backend/routes/alumnos.routes.js`, pantalla `frontend/src/pages/Alumnos/` |
| HU14 | Informe mensual de recaudación: indicadores con su fórmula, comparación con el mes anterior, gráfico, desglose por método de pago y descarga en PDF | `GET /api/informes/recaudacion` y `/recaudacion/pdf` en `backend/routes/informes.routes.js`, pantalla `frontend/src/pages/Informes/` |

- **Definiciones de cálculo** (las mismas que figuran en la documentación del sprint):
  - Cada cobranza es la cuota completa del mes; no hay pagos parciales.
  - Un alumno está "Al día" en el mes M si tiene al menos una cobranza activa con `mes_correspondiente = M`; si no, "Adeuda".
  - El listado y el indicador "Alumnos al día" usan el **mes correspondiente** de la cuota. Total recaudado, pagos y monto promedio usan la **fecha de pago**.
  - Monto promedio = total recaudado ÷ pagos registrados. Sin pagos se muestra "—".
  - Alumnos al día = (alumnos activos con una cobranza activa del mes ÷ alumnos activos) × 100. Los alumnos dados de baja (`activo = 0`) no cuentan.
  - Variación porcentual = (actual − anterior) ÷ anterior × 100. Si el anterior es cero se muestra "sin base de comparación". Para "Alumnos al día" la variación va en puntos porcentuales.
  - Las fórmulas están en `backend/utils/informe.js` y se prueban en `backend/tests/informe.test.js`.
- **Base de datos:** la migración `sprint5_alumnos_activo.sql` agrega `alumnos.activo` y dos índices sobre `cobranzas`. No crea tablas nuevas.
- **PDF:** se genera en el backend con `pdfkit` (`backend/utils/informePdf.js`). Después de actualizar, corré `cd backend && npm install`.
- **Permisos:** el listado lo consultan la Secretaria, la Coordinadora Administrativa y la Directora; el informe, la Directora y la Coordinadora Administrativa.
