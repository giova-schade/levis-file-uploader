-- Crear el usuario 'intanis' con la contraseña 'intanis2024'
CREATE USER intanis WITH PASSWORD 'intanis2024';

-- Crear la base de datos 'levis' propiedad de 'intanis'
CREATE DATABASE levis OWNER intanis;

-- Conectar a la base de datos 'levis'
\c levis;

-- Otorgar todos los privilegios en la base de datos 'levis' al usuario 'intanis'
GRANT ALL PRIVILEGES ON DATABASE levis TO intanis;

-- Crear el esquema 'datos' en la base de datos 'levis'
CREATE SCHEMA datos AUTHORIZATION intanis;

-- Otorgar todos los privilegios en el esquema 'datos' al usuario 'intanis'
GRANT ALL PRIVILEGES ON SCHEMA datos TO intanis;

-- Crear la secuencia para el ID secuencial
CREATE SEQUENCE datos.proyecto_validaciones_id_seq;

-- Crear la tabla 'proyecto_validaciones' en el esquema 'datos'
CREATE TABLE datos.proyecto_validaciones (
    id INTEGER DEFAULT nextval('datos.proyecto_validaciones_id_seq') PRIMARY KEY,
    nombre_proyecto VARCHAR(100) NOT NULL,
    nombre_tabla VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),
    usuario_modificacion VARCHAR(50) NOT NULL
);

-- Crear la tabla 'proyecto_esquemas' en el esquema 'datos'
CREATE TABLE datos.proyecto_esquemas (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL REFERENCES datos.proyecto_validaciones(id) ON DELETE CASCADE,
    campo_nombre VARCHAR(100) NOT NULL,
    tipo_dato VARCHAR(100) NOT NULL,
    requerido BOOLEAN DEFAULT FALSE,
    longitud_maxima INTEGER DEFAULT NULL,
    valores_permitidos JSONB DEFAULT NULL,
    es_clave_primaria BOOLEAN DEFAULT FALSE,
    es_unico BOOLEAN DEFAULT FALSE
);

-- Crear la tabla 'validaciones_definidas' en el esquema 'datos'
CREATE TABLE datos.validaciones_definidas (
    id SERIAL PRIMARY KEY,
    nombre_regla VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT NOT NULL
);

-- Crear la tabla 'validaciones_campos' en el esquema 'datos'
CREATE TABLE datos.validaciones_campos (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL REFERENCES datos.proyecto_validaciones(id) ON DELETE CASCADE,
    campo_nombre VARCHAR(100) NOT NULL,
    validacion_id INTEGER NOT NULL REFERENCES datos.validaciones_definidas(id) ON DELETE CASCADE,
    valor JSONB DEFAULT NULL,
    mensaje_error VARCHAR(255) DEFAULT 'Error en la validación'
);

-- Otorgar todos los privilegios en las tablas al usuario 'intanis'
GRANT ALL PRIVILEGES ON TABLE datos.proyecto_validaciones TO intanis;
GRANT ALL PRIVILEGES ON TABLE datos.proyecto_esquemas TO intanis;
GRANT ALL PRIVILEGES ON TABLE datos.validaciones_definidas TO intanis;
GRANT ALL PRIVILEGES ON TABLE datos.validaciones_campos TO intanis;

-- Crear el trigger para asignar un ID secuencial en la tabla 'proyecto_validaciones'
CREATE OR REPLACE FUNCTION datos.set_sequential_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.id := nextval('datos.proyecto_validaciones_id_seq');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Asignar el trigger a la tabla 'proyecto_validaciones'
CREATE TRIGGER trg_set_sequential_id
BEFORE INSERT ON datos.proyecto_validaciones
FOR EACH ROW
EXECUTE FUNCTION datos.set_sequential_id();