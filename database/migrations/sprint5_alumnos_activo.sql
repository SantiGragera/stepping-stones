-- =====================================================================
-- Migración Sprint 5 - HU13 y HU14: Listados e Informes
-- Agrega la columna "activo" a la tabla alumnos (BOOLEAN, default 1).
-- El listado de alumnos (HU13) y el indicador "Alumnos al día" del informe
-- (HU14) solo consideran a los alumnos con activo = 1: los dados de baja no
-- cuentan en el listado ni en el denominador del porcentaje.
-- Correr UNA sola vez sobre una base creada en sprints anteriores:
--   mysql -u root -p stepping_stones_db < database/migrations/sprint5_alumnos_activo.sql
-- =====================================================================

USE stepping_stones_db;

ALTER TABLE alumnos
  ADD COLUMN activo BOOLEAN NOT NULL DEFAULT 1;

-- Los alumnos existentes quedan activos por el DEFAULT 1.

-- Índices para que el listado y el informe respondan rápido (HU13: primera
-- página en 2 segundos o menos).
CREATE INDEX idx_cobranzas_mes_activo ON cobranzas (mes_correspondiente, activo);
CREATE INDEX idx_cobranzas_fecha_activo ON cobranzas (fecha_pago, activo);
