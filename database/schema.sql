-- =====================================================================
-- PETSTYLE · ESQUEMA POSTGRESQL
-- Se ejecuta automáticamente al iniciar el backend (CREATE ... IF NOT EXISTS),
-- por lo que puede correrse varias veces sin perder datos.
-- =====================================================================

-- Usuarios. El registro público SIEMPRE crea CLIENTE; el rol ADMINISTRADOR
-- solo lo crea el responsable del sistema (npm run crear-admin / seed).
CREATE TABLE IF NOT EXISTS usuarios (
  id             SERIAL PRIMARY KEY,
  nombre         TEXT NOT NULL,
  email          TEXT NOT NULL,
  telefono       TEXT NOT NULL DEFAULT '',
  password_hash  TEXT NOT NULL,
  rol            TEXT NOT NULL DEFAULT 'CLIENTE' CHECK (rol IN ('CLIENTE', 'ADMINISTRADOR')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Correo único sin distinguir mayúsculas (equivale al COLLATE NOCASE de SQLite)
CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_email ON usuarios (lower(email));

CREATE TABLE IF NOT EXISTS mascotas (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  especie     TEXT NOT NULL CHECK (especie IN ('Perro', 'Gato')),
  raza        TEXT NOT NULL,
  edad        INTEGER CHECK (edad IS NULL OR (edad >= 0 AND edad <= 40)),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS citas (
  id                SERIAL PRIMARY KEY,
  usuario_id        INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  mascota_id        INTEGER NOT NULL REFERENCES mascotas(id) ON DELETE RESTRICT,
  servicio          TEXT NOT NULL,
  estilo_corte      TEXT,
  especificaciones  TEXT,
  requiere_ruta     BOOLEAN NOT NULL DEFAULT FALSE,
  direccion         TEXT,
  fecha_hora        TEXT NOT NULL,            -- ISO 8601, ej. 2026-11-09T09:50
  estado            TEXT NOT NULL DEFAULT 'Pendiente'
                    CHECK (estado IN ('Pendiente','Aprobada','En proceso','Rechazada','Entregada','Cancelada')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mascotas_usuario ON mascotas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_citas_usuario    ON citas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_citas_estado     ON citas(estado);
