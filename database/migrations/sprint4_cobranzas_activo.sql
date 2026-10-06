-- =====================================================================
-- Migración Sprint 4 - HU12: Eliminación lógica de una cobranza
-- Agrega la columna "activo" a la tabla cobranzas (BOOLEAN, default 1).
-- Correr UNA sola vez sobre una base creada en sprints anteriores:
--   mysql -u root -p stepping_stones_db < database/migrations/sprint4_cobranzas_activo.sql
-- =====================================================================

USE stepping_stones_db;

ALTER TABLE cobranzas
  ADD COLUMN activo BOOLEAN NOT NULL DEFAULT 1;

-- Los registros existentes quedan activos por el DEFAULT 1.
-- A partir de ahora, DELETE /api/cobranzas/:id hace UPDATE activo = 0
-- en lugar de un DELETE físico, y GET /api/cobranzas solo lista activo = 1.
