# backend/app/models/project.py
from app import db
from datetime import datetime

class ProyectoValidaciones(db.Model):
    __tablename__ = 'proyecto_validaciones'
    __table_args__ = {'schema': 'datos'}

    id = db.Column(db.Integer, primary_key=True)
    nombre_proyecto = db.Column(db.String(100), nullable=False)
    nombre_tabla = db.Column(db.String(100), nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    usuario_modificacion = db.Column(db.String(100), nullable=False)

    def __init__(self, nombre_proyecto, nombre_tabla, usuario_modificacion):
        self.nombre_proyecto = nombre_proyecto
        self.nombre_tabla = nombre_tabla
        self.usuario_modificacion = usuario_modificacion


class ProyectoEsquemas(db.Model):
    __tablename__ = 'proyecto_esquemas'
    __table_args__ = {'schema': 'datos'}

    id = db.Column(db.Integer, primary_key=True)
    proyecto_id = db.Column(db.Integer, db.ForeignKey('datos.proyecto_validaciones.id', ondelete='CASCADE'), nullable=False)
    campo_nombre = db.Column(db.String(100), nullable=False)
    tipo_dato = db.Column(db.String(100), nullable=False)
    requerido = db.Column(db.Boolean, default=False)
    longitud_maxima = db.Column(db.Integer, nullable=True)
    valores_permitidos = db.Column(db.JSON, nullable=True)
    es_clave_primaria = db.Column(db.Boolean, default=False)
    es_unico = db.Column(db.Boolean, default=False)

    def __init__(self, proyecto_id, campo_nombre, tipo_dato, requerido=False, longitud_maxima=None, valores_permitidos=None, es_clave_primaria=False, es_unico=False):
        self.proyecto_id = proyecto_id
        self.campo_nombre = campo_nombre
        self.tipo_dato = tipo_dato
        self.requerido = requerido
        self.longitud_maxima = longitud_maxima
        self.valores_permitidos = valores_permitidos
        self.es_clave_primaria = es_clave_primaria
        self.es_unico = es_unico


class ValidacionesCampos(db.Model):
    __tablename__ = 'validaciones_campos'
    __table_args__ = {'schema': 'datos'}

    id = db.Column(db.Integer, primary_key=True)
    proyecto_id = db.Column(db.Integer, db.ForeignKey('datos.proyecto_validaciones.id', ondelete='CASCADE'), nullable=False)
    campo_nombre = db.Column(db.String(100), nullable=False)
    validacion_id = db.Column(db.Integer, db.ForeignKey('datos.validaciones_definidas.id', ondelete='CASCADE'), nullable=False)
    valor = db.Column(db.JSON, nullable=True)
    mensaje_error = db.Column(db.String(255), nullable=False, default="Error en la validación")

    def __init__(self, proyecto_id, campo_nombre, validacion_id, valor=None, mensaje_error="Error en la validación"):
        self.proyecto_id = proyecto_id
        self.campo_nombre = campo_nombre
        self.validacion_id = validacion_id
        self.valor = valor
        self.mensaje_error = mensaje_error

class ValidacionesDefinidas(db.Model):
    __tablename__ = 'validaciones_definidas'
    __table_args__ = {'schema': 'datos'}

    id = db.Column(db.Integer, primary_key=True)
    nombre_regla = db.Column(db.String(100), nullable=False, unique=True)
    descripcion = db.Column(db.Text, nullable=False)

    def __init__(self, nombre_regla, descripcion):
        self.nombre_regla = nombre_regla
        self.descripcion = descripcion