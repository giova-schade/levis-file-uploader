-- Insertar validaciones predefinidas en la tabla 'validaciones_definidas'
INSERT INTO datos.validaciones_definidas (nombre_regla, descripcion) VALUES
('no_vacio', 'El campo no puede estar vacío'),
('longitud_minima', 'El campo debe tener al menos una longitud específica'),
('positivo', 'El campo debe ser un número positivo'),
('longitud_maxima', 'El campo no debe exceder una longitud específica'),
('rango', 'El campo debe estar dentro de un rango específico'),
('mayor_a_cero', 'El campo debe ser mayor a cero'),
('no_futuro', 'La fecha no puede estar en el futuro');

-- Insertar datos de prueba en la tabla 'proyecto_validaciones'
INSERT INTO datos.proyecto_validaciones (
    nombre_proyecto, 
    nombre_tabla, 
    fecha_creacion, 
    fecha_actualizacion, 
    usuario_modificacion
) VALUES
('Proyecto Ejemplo 1', 'tabla_ejemplo_1', NOW(), NOW(), 'admin'),
('Proyecto Ejemplo 2', 'tabla_ejemplo_2', NOW(), NOW(), 'user123'),
('Proyecto Ejemplo 3', 'tabla_ejemplo_3', NOW(), NOW(), 'editor_proyecto');

-- Insertar esquemas para cada proyecto en 'proyecto_esquemas'
INSERT INTO datos.proyecto_esquemas (
    proyecto_id, 
    campo_nombre, 
    tipo_dato, 
    requerido, 
    longitud_maxima, 
    valores_permitidos, 
    es_clave_primaria, 
    es_unico
)
SELECT p.id, e.campo_nombre, e.tipo_dato, e.requerido, e.longitud_maxima, e.valores_permitidos::jsonb, e.es_clave_primaria, e.es_unico
FROM datos.proyecto_validaciones p
JOIN (
    VALUES
    -- Esquema para Proyecto Ejemplo 1
    ('Proyecto Ejemplo 1', 'id', 'INTEGER', TRUE, NULL, NULL, TRUE, TRUE),
    ('Proyecto Ejemplo 1', 'nombre', 'VARCHAR', TRUE, 100, NULL, FALSE, TRUE),

    -- Esquema para Proyecto Ejemplo 2
    ('Proyecto Ejemplo 2', 'codigo', 'VARCHAR', TRUE, 50, NULL, TRUE, TRUE), 
    ('Proyecto Ejemplo 2', 'descripcion', 'TEXT', FALSE, NULL, NULL, FALSE, FALSE),

    -- Esquema para Proyecto Ejemplo 3
    ('Proyecto Ejemplo 3', 'fecha', 'DATE', TRUE, NULL, NULL, FALSE, FALSE),
    ('Proyecto Ejemplo 3', 'monto', 'NUMERIC', TRUE, NULL, NULL, FALSE, FALSE)
) AS e(nombre_proyecto, campo_nombre, tipo_dato, requerido, longitud_maxima, valores_permitidos, es_clave_primaria, es_unico)
ON p.nombre_proyecto = e.nombre_proyecto;

-- Insertar validaciones asociadas a los campos de proyectos en 'validaciones_campos'
INSERT INTO datos.validaciones_campos (
    proyecto_id, 
    campo_nombre,   
    validacion_id, 
    valor, 
    mensaje_error
)
SELECT pv.id, v.campo_nombre, vd.id, v.valor::jsonb, v.mensaje_error
FROM datos.proyecto_validaciones pv
JOIN (
    VALUES
    -- Validaciones para Proyecto Ejemplo 1
    ('Proyecto Ejemplo 1', 'nombre', 'no_vacio', '{"valor": null}', 'El campo nombre no puede estar vacío'),  
    ('Proyecto Ejemplo 1', 'id', 'positivo', '{"valor": null}', 'El valor del ID debe ser positivo'), 

    -- Validaciones para Proyecto Ejemplo 2
    ('Proyecto Ejemplo 2', 'codigo', 'no_vacio', '{"valor": null}', 'El código no puede estar vacío'),  
    ('Proyecto Ejemplo 2', 'descripcion', 'longitud_minima', '{"min": 10}', 'La descripción debe tener al menos 10 caracteres'),  

    -- Validaciones para Proyecto Ejemplo 3
    ('Proyecto Ejemplo 3', 'monto', 'mayor_a_cero', '{"min": 0.01}', 'El monto debe ser mayor a cero'), 
    ('Proyecto Ejemplo 3', 'fecha', 'no_futuro', '{"valor": null}', 'La fecha no puede estar en el futuro')  
) AS v(nombre_proyecto, campo_nombre, regla, valor, mensaje_error)
ON pv.nombre_proyecto = v.nombre_proyecto
JOIN datos.validaciones_definidas vd ON v.regla = vd.nombre_regla;

-- Crear la tabla 'tabla_ejemplo_1'
CREATE TABLE IF NOT EXISTS datos.tabla_ejemplo_1 (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

-- Insertar datos en 'tabla_ejemplo_1'
INSERT INTO datos.tabla_ejemplo_1 (nombre) VALUES
('Producto A'),
('Producto B'),
('Producto C'),
('Producto D'),
('Producto E');

-- Crear la tabla 'tabla_ejemplo_2'
CREATE TABLE IF NOT EXISTS datos.tabla_ejemplo_2 (
    codigo VARCHAR(50) PRIMARY KEY,
    descripcion TEXT NOT NULL
);

-- Insertar datos en 'tabla_ejemplo_2'
INSERT INTO datos.tabla_ejemplo_2 (codigo, descripcion) VALUES
('COD001', 'Descripción del producto 1'),
('COD002', 'Descripción del producto 2'),
('COD003', 'Descripción del producto 3'),
('COD004', 'Descripción del producto 4'),
('COD005', 'Descripción del producto 5');

-- Crear la tabla 'tabla_ejemplo_3'
CREATE TABLE IF NOT EXISTS datos.tabla_ejemplo_3 (
    fecha DATE NOT NULL,
    monto NUMERIC NOT NULL CHECK (monto > 0)
);

-- Insertar datos en 'tabla_ejemplo_3'
INSERT INTO datos.tabla_ejemplo_3 (fecha, monto) VALUES
('2024-01-01', 100.50),
('2024-02-01', 250.75),
('2024-03-01', 300.00),
('2024-04-01', 150.25),
('2024-05-01', 500.10);

-- Verificar los datos insertados en todas las tablas
SELECT * FROM datos.proyecto_validaciones;
SELECT * FROM datos.proyecto_e  squemas;
SELECT * FROM datos.validaciones_definidas;
SELECT * FROM datos.validaciones_campos;
SELECT * FROM datos.tabla_ejemplo_1;
SELECT * FROM datos.tabla_ejemplo_2;
SELECT * FROM datos.tabla_ejemplo_3;
