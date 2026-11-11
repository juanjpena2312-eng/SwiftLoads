-- Ejecuta una sola vez en la base de datos configurada para SwiftLoad.
-- Requiere las tablas existentes: restaurantes, usuarios y subcategorias.
ALTER TABLE restaurantes
  ADD COLUMN propietario_id INT NULL,
  ADD COLUMN descripcion VARCHAR(1000) NULL,
  ADD COLUMN direccion VARCHAR(255) NULL,
  ADD COLUMN telefono VARCHAR(30) NULL,
  ADD COLUMN disponible TINYINT(1) NOT NULL DEFAULT 1;

CREATE INDEX idx_restaurantes_propietario
  ON restaurantes (propietario_id);
