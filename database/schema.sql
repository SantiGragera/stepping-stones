-- =====================================================================
-- Stepping Stones - Script completo de la base de datos
-- Refleja el estado acumulado de los Sprints 1 a 4:
--   Sprint 1: tablas base + columnas reset_token / reset_token_expires (HU05)
--   Sprint 2: columna descripcion en roles (ABM de Roles, HU06-HU08)
--   Sprint 4: columna activo en cobranzas (eliminación lógica, HU12)
--
-- Uso (base nueva):   mysql -u root -p < database/schema.sql
-- Si ya tenés la base creada de sprints anteriores, NO corras este script:
-- usá las migraciones de database/migrations/.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS stepping_stones_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE stepping_stones_db;

-- Asegura que los acentos (María, Pérez, Sofía) se guarden bien.
SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- Tablas de soporte (catálogos)
-- ---------------------------------------------------------------------

CREATE TABLE roles (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre_rol VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL
);

CREATE TABLE metodos_pago (
  id_metodo_pago INT AUTO_INCREMENT PRIMARY KEY,
  nombre_metodo VARCHAR(50) NOT NULL UNIQUE
);

-- Se crea antes que asistencia_docentes porque esa tabla la referencia.
CREATE TABLE estados_asistencia (
  id_estado_asistencia INT AUTO_INCREMENT PRIMARY KEY,
  nombre_estado VARCHAR(50) NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------
-- Usuarios del sistema
-- ---------------------------------------------------------------------

CREATE TABLE usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  apellido VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,          -- formato "salt:hash" (scrypt) desde Sprint 3
  id_rol INT NOT NULL,
  fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reset_token VARCHAR(64) NULL,            -- HU05: token temporal de recuperación
  reset_token_expires DATETIME NULL,       -- HU05: vencimiento del token (1 hora)
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

-- ---------------------------------------------------------------------
-- Tablas de negocio
-- ---------------------------------------------------------------------

CREATE TABLE alumnos (
  id_alumno INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  apellido VARCHAR(50) NOT NULL,
  dni VARCHAR(15) NOT NULL UNIQUE,
  nombre_tutor VARCHAR(100) NOT NULL,
  email_tutor VARCHAR(100) NOT NULL,
  telefono_tutor VARCHAR(20)
);

CREATE TABLE asistencia_docentes (
  id_asistencia INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario_docente INT NOT NULL,
  fecha DATE NOT NULL,
  id_estado_asistencia INT NOT NULL,
  FOREIGN KEY (id_usuario_docente) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_estado_asistencia) REFERENCES estados_asistencia(id_estado_asistencia)
);

CREATE TABLE planificaciones (
  id_planificacion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario_docente INT NOT NULL,
  fecha_clase DATE NOT NULL,
  tema_clase VARCHAR(200) NOT NULL,
  materiales_necesarios TEXT,
  FOREIGN KEY (id_usuario_docente) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Sprint 4 - ABM Transaccional: Cobranzas (pagos de cuota)
CREATE TABLE cobranzas (
  id_cobranza INT AUTO_INCREMENT PRIMARY KEY,
  id_alumno INT NOT NULL,
  id_usuario_secretaria INT NOT NULL,      -- usuario que registró el pago (HU09)
  fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
  monto DECIMAL(10, 2) NOT NULL,
  mes_correspondiente VARCHAR(20) NOT NULL,
  id_metodo_pago INT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT 1,       -- HU12: eliminación lógica (0 = dada de baja)
  FOREIGN KEY (id_alumno) REFERENCES alumnos(id_alumno) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario_secretaria) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_metodo_pago) REFERENCES metodos_pago(id_metodo_pago),
  CONSTRAINT chk_cobranzas_monto_positivo CHECK (monto > 0)
);

CREATE TABLE libretas (
  id_libreta INT AUTO_INCREMENT PRIMARY KEY,
  id_alumno INT NOT NULL,
  id_usuario_docente INT NOT NULL,
  periodo VARCHAR(50) NOT NULL,
  calificacion_general VARCHAR(20),
  observaciones TEXT NOT NULL,
  fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_alumno) REFERENCES alumnos(id_alumno) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario_docente) REFERENCES usuarios(id_usuario)
);

-- =====================================================================
-- Población inicial
-- =====================================================================

INSERT INTO roles (nombre_rol, descripcion) VALUES
('Directora', 'Acceso total a la gestión de la academia'),
('Coordinadora Administrativa', 'Supervisa cobranzas y tareas administrativas'),
('Coordinadora Academica', 'Supervisa docentes, planificaciones y libretas'),
('Secretaria', 'Registra cobranzas y atiende a las familias'),
('Docente', 'Carga asistencia, planificaciones y libretas');

INSERT INTO metodos_pago (nombre_metodo) VALUES
('Efectivo'),
('Transferencia'),
('Mercado Pago');

INSERT INTO estados_asistencia (nombre_estado) VALUES
('Presente'),
('Ausente'),
('Tardanza');

-- Contraseñas en texto plano a propósito: son cuentas "legacy" de Sprint 1/2.
-- En su primer login exitoso el backend las re-hashea automáticamente (Sprint 3, HT2).
INSERT INTO usuarios (nombre, apellido, email, password, id_rol) VALUES
('Ana', 'García', 'direccion@steppingstones.com', 'agarcia123', 1),
('María', 'López', 'secretaria@steppingstones.com', 'mlopez123', 4),
('Laura', 'Martínez', 'laura.docente@steppingstones.com', 'lmartinez123', 5);

INSERT INTO alumnos (nombre, apellido, dni, nombre_tutor, email_tutor, telefono_tutor) VALUES
('Lucas', 'Pérez', '45123456', 'Carlos Pérez', 'carlos.perez@email.com', '351-1234567'),
('Sofía', 'Gómez', '46789012', 'Marta Gómez', 'marta.gomez@email.com', '351-7654321');

INSERT INTO asistencia_docentes (id_usuario_docente, fecha, id_estado_asistencia) VALUES
(3, '2026-03-25', 1),
(3, '2026-03-26', 1);

INSERT INTO planificaciones (id_usuario_docente, fecha_clase, tema_clase, materiales_necesarios) VALUES
(3, '2026-04-05', 'Verbos Irregulares en Pasado', 'Proyector y parlantes para actividad con canciones'),
(3, '2026-04-10', 'Vocabulario de Comida', NULL);

INSERT INTO cobranzas (id_alumno, id_usuario_secretaria, fecha_pago, monto, mes_correspondiente, id_metodo_pago) VALUES
(1, 2, '2026-03-05 10:00:00', 25000.00, 'Marzo 2026', 1),
(2, 2, '2026-03-06 11:30:00', 25000.00, 'Marzo 2026', 2),
(1, 2, '2026-04-03 09:15:00', 25000.00, 'Abril 2026', 3);

INSERT INTO libretas (id_alumno, id_usuario_docente, periodo, calificacion_general, observaciones) VALUES
(1, 3, 'Primer Trimestre 2026', 'Excelente', 'Lucas ha demostrado un gran avance en su pronunciación oral.');
