# backend/app/controllers/project_controller.py
import io
import pandas as pd
from flask import Blueprint, request, jsonify
from flask_restx import Namespace, Resource , fields 
from app.services.auth_service import validate_token
from werkzeug.utils import secure_filename
from app.models.project import ProyectoValidaciones, ProyectoEsquemas, ValidacionesCampos, ValidacionesDefinidas
from app import db
from sqlalchemy import text
from functools import wraps
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

project_ns = Namespace('projects', description='Operaciones relacionadas con proyectos')

file_upload_ns = Namespace('upload', description='Operaciones de carga de archivos')
validations_ns = Namespace('validations', description='Operaciones relacionadas con las validaciones definidas')



# Decorador para la validación de tokens
def require_auth(f):
    """
    Decorador que valida el token JWT antes de ejecutar la función.

    Este decorador verifica si el token JWT se envía como un parámetro en la URL o en el encabezado
    'Authorization' y lo valida. Si el token no es válido o no se proporciona, la solicitud se rechaza.

    Parámetros:
    - f: Función a decorar.

    Retorna:
    - La función decorada, o un mensaje de error si el token es inválido o falta.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Buscar el token en los parámetros de la URL
        token = request.args.get('token')
        
        # Si no se encontró en los parámetros, buscar en el encabezado
        if not token:
            auth_header = request.headers.get('Authorization')
            if auth_header:
                token = auth_header.split(" ")[1]
        
        if not token:
            return {"error": "Token no proporcionado"}, 400

        # Validar el token
        validation_result = validate_token(token)
        if not isinstance(validation_result, dict):
            return validation_result

        return f(*args, **kwargs)
    return decorated_function

@project_ns.route('/projects')
@project_ns.param('token', 'Token de autenticación', _in='query', required=False)
class ProjectListResource(Resource):
    @require_auth
    def get(self):
        """
        Obtiene una lista de todos los proyectos.

        Este endpoint devuelve todos los proyectos registrados, junto con sus esquemas y validaciones asociadas.

        Retorna:
        - 200: Lista de proyectos con sus detalles.
        - 404: Si no se encuentran proyectos.
        - 500: Si ocurre un error en el servidor.
        """
        try:
            projects = ProyectoValidaciones.query.all()
            if not projects:
                return {"message": "No se encontraron proyectos."}, 400

            projects_data = []
            for project in projects:
                esquemas = ProyectoEsquemas.query.filter_by(proyecto_id=project.id).all()
                esquemas_data = [
                    {
                        "campo_nombre": esquema.campo_nombre,
                        "tipo_dato": esquema.tipo_dato,
                        "requerido": esquema.requerido,
                        "longitud_maxima": esquema.longitud_maxima,
                        "valores_permitidos": esquema.valores_permitidos,
                        "es_clave_primaria": esquema.es_clave_primaria,
                        "es_unico": esquema.es_unico
                    }
                    for esquema in esquemas
                ]

                validaciones = ValidacionesCampos.query.filter_by(proyecto_id=project.id).all()
                validaciones_data = [
                    {
                        "campo_nombre": validacion.campo_nombre,
                        "validacion": validacion.validacion_id,
                        "valor": validacion.valor,
                        "mensaje_error": validacion.mensaje_error
                    }
                    for validacion in validaciones
                ]

                # Convertir objetos datetime a cadenas usando .isoformat()
                projects_data.append({
                    "id": project.id,
                    "nombre_proyecto": project.nombre_proyecto,
                    "nombre_tabla": project.nombre_tabla,
                    "fecha_creacion": project.fecha_creacion.isoformat() if project.fecha_creacion else None,
                    "fecha_actualizacion": project.fecha_actualizacion.isoformat() if project.fecha_actualizacion else None,
                    "creado_modificado_por": project.usuario_modificacion,
                    "esquemas": esquemas_data,
                    "validaciones": validaciones_data
                })

            return {"projects": projects_data}, 200


        except Exception as e:
            logger.error(f"Error al obtener proyectos: {str(e)}")
            return {"error": f"Error al obtener proyectos: {str(e)}"}, 500

@project_ns.route('/projectsById/<int:project_id>')
@project_ns.param('token', 'Token de autenticación', _in='query', required=False)
@project_ns.param('project_id', 'ID del proyecto a consultar')
class ProjectResource(Resource):
    @project_ns.doc('get_project')
    def get(self, project_id):
        """
        Obtiene los detalles de un proyecto específico por su ID.

        Este endpoint devuelve la información de un proyecto, junto con los datos de la tabla asociada,
        sus esquemas y las validaciones aplicadas.

        Parámetros:
        - project_id (int): ID del proyecto a consultar.

        Retorna:
        - 200: Detalles del proyecto.
        - 404: Si el proyecto no se encuentra o la tabla asociada no existe.
        - 500: Si ocurre un error en el servidor.
        """    
        try:
            project = ProyectoValidaciones.query.get(project_id)
            if not project:
                return {"error": "Proyecto no encontrado."}, 404

            table_name = project.nombre_tabla.lower()
            table_exists_query = text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'datos'
                    AND table_name = :table_name
                );
            """)
            table_exists = db.session.execute(table_exists_query, {"table_name": table_name}).scalar()

            if not table_exists:
                return {"error": f"La tabla '{table_name}' no existe en el esquema 'datos'."}, 404

            table_data_query = text(f"SELECT * FROM datos.{table_name};")
            table_data = db.session.execute(table_data_query).mappings().all()

            table_data_serialized = [dict(row) for row in table_data]

            esquemas = ProyectoEsquemas.query.filter_by(proyecto_id=project.id).all()
            esquemas_data = [
                {
                    "campo_nombre": esquema.campo_nombre.lower(), 
                    "tipo_dato": esquema.tipo_dato,
                    "requerido": esquema.requerido,
                    "longitud_maxima": esquema.longitud_maxima,
                    "valores_permitidos": esquema.valores_permitidos,
                    "es_clave_primaria": esquema.es_clave_primaria,
                    "es_unico": esquema.es_unico
                }
                for esquema in esquemas
            ]

            # Ajuste para obtener el nombre de la validación en lugar del ID
            validaciones = db.session.query(
                ValidacionesCampos.campo_nombre,
                ValidacionesCampos.valor,
                ValidacionesCampos.mensaje_error,
                ValidacionesDefinidas.nombre_regla
            ).join(
                ValidacionesDefinidas, ValidacionesCampos.validacion_id == ValidacionesDefinidas.id
            ).filter(
                ValidacionesCampos.proyecto_id == project.id
            ).all()

            validaciones_data = [
                {
                    "campo_nombre": validacion.campo_nombre.lower(),
                    "validacion": validacion.nombre_regla,  # Se obtiene el nombre de la regla
                    "valor": validacion.valor,
                    "mensaje_error": validacion.mensaje_error
                }
                for validacion in validaciones
            ]

            project_data = {
                "id": project.id,
                "nombre_proyecto": project.nombre_proyecto,
                "nombre_tabla": project.nombre_tabla.lower(), 
                "fecha_creacion": project.fecha_creacion.isoformat() if project.fecha_creacion else None,
                "fecha_actualizacion": project.fecha_actualizacion.isoformat() if project.fecha_actualizacion else None,
                "creado_modificado_por": project.usuario_modificacion,
                "esquemas": esquemas_data,
                "validaciones": validaciones_data,
                "tabla_asociada": {
                    "nombre_tabla": table_name,
                    "datos": table_data_serialized
                }
            }

            return jsonify({"project": project_data}, 200)

        except Exception as e:
            logger.error(f"Error al obtener el proyecto: {str(e)}")
            return {"error": f"Error al obtener el proyecto: {str(e)}"}, 500



project_model = project_ns.model('Project', {
    'nombre_proyecto': fields.String(required=True, description='Nombre del proyecto'),
    'nombre_tabla': fields.String(required=True, description='Nombre de la tabla asociada'),
    'esquemas': fields.List(fields.Raw, required=True, description='Lista de esquemas asociados al proyecto'),
    'validaciones': fields.List(fields.Raw, required=True, description='Lista de validaciones aplicadas a los campos'),
    'usuario_modificacion': fields.String(required=True, description='Usuario que crea el proyecto')
})
@project_ns.route('/', methods=['PUT'])
@project_ns.param('token', 'Token de autenticación', _in='query', required=False)
class CreateProjectResource(Resource):
    @require_auth
    @project_ns.expect(project_model, validate=True)
    def put(self):
        """
        Crea un nuevo proyecto.

        Este endpoint permite registrar un nuevo proyecto con sus esquemas y validaciones correspondientes.

        Parámetros:
        - JSON con los siguientes campos obligatorios:
            - nombre_proyecto: Nombre del proyecto.
            - nombre_tabla: Nombre de la tabla asociada al proyecto.
            - esquemas: Lista de esquemas asociados al proyecto.
            - validaciones: Lista de validaciones aplicadas a los campos.
            - usuario_modificacion: Usuario que crea el proyecto.

        Retorna:
        - 201: Proyecto creado exitosamente y retorna el ID del proyecto creado.
        - 400: Si falta algún campo obligatorio o si el proyecto ya existe.
        - 500: Si ocurre un error en el servidor.
        """
        if not request.is_json:
            return {"error": "El contenido debe ser JSON y tener un Content-Type adecuado."}, 400

        data = request.get_json()

        required_fields = ["nombre_proyecto", "nombre_tabla", "esquemas", "validaciones", "usuario_modificacion"]
        for field in required_fields:
            if field not in data:
                return {"error": f"El campo '{field}' es obligatorio."}, 400

        try:
            data["nombre_tabla"] = data["nombre_tabla"].lower()
            for esquema in data["esquemas"]:
                esquema["campo_nombre"] = esquema["campo_nombre"].lower()
            existing_project = ProyectoValidaciones.query.filter_by(nombre_proyecto=data["nombre_proyecto"]).first()
            if existing_project:
                return {"error": f"El proyecto con el nombre '{data['nombre_proyecto']}' ya está registrado."}, 400

            nuevo_proyecto = ProyectoValidaciones(
                nombre_proyecto=data["nombre_proyecto"],
                nombre_tabla=data["nombre_tabla"],
                usuario_modificacion=data["usuario_modificacion"]
            )
            db.session.add(nuevo_proyecto)
            db.session.commit()

            for esquema in data["esquemas"]:
                nuevo_esquema = ProyectoEsquemas(
                    proyecto_id=nuevo_proyecto.id,
                    campo_nombre=esquema["campo_nombre"],
                    tipo_dato=esquema["tipo_dato"],
                    requerido=esquema.get("requerido", False),
                    longitud_maxima=esquema.get("longitud_maxima"),
                    valores_permitidos=esquema.get("valores_permitidos"),
                    es_clave_primaria=esquema.get("es_clave_primaria", False),
                    es_unico=esquema.get("es_unico", False)
                )
                db.session.add(nuevo_esquema)

            for validacion in data["validaciones"]:
                validacion_definida = ValidacionesDefinidas.query.filter_by(nombre_regla=validacion["nombre_regla"]).first()
                if not validacion_definida:
                    return {"error": f"La regla de validación con nombre '{validacion['nombre_regla']}' no existe."}, 400

                nueva_validacion = ValidacionesCampos(
                    proyecto_id=nuevo_proyecto.id,
                    campo_nombre=validacion["campo_nombre"].lower(),
                    validacion_id=validacion_definida.id,
                    valor=validacion.get("valor"),
                    mensaje_error=validacion.get("mensaje_error", "Error en la validación.")
                )
                db.session.add(nueva_validacion)

            db.session.commit()

            # Retornar el ID del proyecto creado
            return {"message": "Proyecto creado exitosamente.", "project_id": nuevo_proyecto.id}, 201

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error al crear el proyecto: {str(e)}")
            return {"error": f"Error al crear el proyecto: {str(e)}"}, 500

@project_ns.route('/upload/<int:project_id>', methods=['POST'])
@project_ns.param('token', 'Token de autenticación', _in='query', required=False)
@project_ns.param('project_id', 'ID del proyecto asociado')
class FileUploadResource(Resource):
    @require_auth
    @project_ns.doc('upload_file', params={'project_id': 'ID del proyecto asociado'})
    def post(self, project_id):
        project = ProyectoValidaciones.query.get(project_id)
        if not project:
            return {"error": "Proyecto no encontrado."}, 404

        if 'file' not in request.files:
            return {"error": "No se ha enviado un archivo"}, 400

        file = request.files['file']
        if file.filename == '':
            return {"error": "El nombre del archivo está vacío"}, 400

        if file and allowed_file(file.filename):
            try:
                file_content = file.read().decode('utf-8')
                csv_data = io.StringIO(file_content)
                df = pd.read_csv(csv_data)

                esquemas = ProyectoEsquemas.query.filter_by(proyecto_id=project_id).all()
                nombres_campos_db = {esquema.campo_nombre for esquema in esquemas}

                nombres_campos_csv = set(df.columns)
                if nombres_campos_db != nombres_campos_csv:
                    db.session.delete(project)
                    db.session.commit()
                    return {
                        "error": "El esquema del archivo no es correcto.",
                        "campos_esperados": list(nombres_campos_db),
                        "nombre_proyecto": project.nombre_proyecto
                    }, 400

                validaciones = ValidacionesCampos.query.filter_by(proyecto_id=project_id).all()

                errores = []

                for index, row in df.iterrows():
                    for validacion in validaciones:
                        try:
                            validacion_definida = ValidacionesDefinidas.query.filter_by(id=validacion.validacion_id).first()

                            if not validacion_definida:
                                db.session.delete(project)
                                db.session.commit()
                                return {"error": f"No se encontró la validación para la regla con id {validacion.validacion_id}."}, 400

                            validation_module_path = f'app.services.validations.{validacion_definida.nombre_regla}'
                            validation_module = __import__(validation_module_path, fromlist=['validate'])

                            # Extraer los parámetros necesarios desde el valor JSON
                            parametros = validacion.valor if validacion.valor else {}

                            # Verificar si hay parámetros requeridos que faltan en el JSON
                            parametros_faltantes = [param for param in self.get_required_params(validation_module.validate) if param != "value" and param not in parametros]
                            if parametros_faltantes:
                                db.session.delete(project)
                                db.session.commit()
                                return {
                                    "error": f"Faltan parámetros requeridos para la validación '{validacion_definida.nombre_regla}'. Parámetros faltantes: {parametros_faltantes}"
                                }, 400

                            # Extraer valor de la celda que se va a validar
                            valor_celda = row[validacion.campo_nombre]

                            # Llamar a la función de validación con los parámetros correctos
                            is_valid, error_message = validation_module.validate(valor_celda, **parametros)

                            if not is_valid:
                                errores.append({
                                    "fila": index + 1,
                                    "campo": validacion.campo_nombre,
                                    "valor_incorrecto": valor_celda,
                                    "mensaje_error": error_message
                                })
                        except ModuleNotFoundError:
                            expected_modules = [f'app.services.validations.{v.nombre_regla}' for v in ValidacionesDefinidas.query.all()]
                            db.session.delete(project)
                            db.session.commit()
                            return {
                                "error": f"Módulo de validación no encontrado para la regla '{validacion_definida.nombre_regla}'.",
                                "modulos_esperados": expected_modules
                            }, 400
                        except AttributeError:
                            db.session.delete(project)
                            db.session.commit()
                            return {
                                "error": f"La función de validación no se encontró para la regla '{validacion_definida.nombre_regla}'"
                            }, 400

                if errores:
                    db.session.delete(project)
                    db.session.commit()
                    return {
                        "error": "Se encontraron errores en la validación del archivo.",
                        "errores": errores
                    }, 400

                # Validar si la tabla ya existe
                table_name = project.nombre_tabla
                table_exists_query = text(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables
                        WHERE table_schema = 'datos'
                        AND table_name = :table_name
                    );
                """)
                table_exists = db.session.execute(table_exists_query, {"table_name": table_name}).scalar()

                if table_exists:
                    db.session.delete(project)
                    db.session.commit()
                    return {"error": f"La tabla '{table_name}' ya existe en el esquema 'datos'."}, 400

                # Crear la tabla si no existe
                create_table_sql = f"CREATE TABLE datos.{table_name} (id SERIAL PRIMARY KEY, "
                column_definitions = []

                for esquema in esquemas:
                    tipo_dato_sql = self.map_tipo_dato_to_sql(esquema.tipo_dato)
                    column_definitions.append(f"{esquema.campo_nombre} {tipo_dato_sql}")

                create_table_sql += ", ".join(column_definitions) + ");"
                db.session.execute(text(create_table_sql))

                # Limpiar la tabla antes de insertar los nuevos datos
                db.session.execute(text(f"DELETE FROM datos.{table_name};"))

                for _, row in df.iterrows():
                    columns = ", ".join(row.index)
                    values = ", ".join([f"'{value}'" for value in row.values])
                    db.session.execute(text(f"INSERT INTO datos.{table_name} ({columns}) VALUES ({values});"))

                db.session.commit()

                return {"message": "Archivo procesado e insertado exitosamente"}, 200

            except Exception as e:
                db.session.rollback()
                logger.error(f"Error al procesar el archivo: {str(e)}")
                # Eliminar el proyecto en caso de cualquier error
                db.session.delete(project)
                db.session.commit()
                return {"error": f"Error al procesar el archivo y el proyecto fue eliminado: {str(e)}"}, 500

        return {"error": "Tipo de archivo no permitido"}, 400

    def get_required_params(self, func):
        """
        Extrae los nombres de los parámetros requeridos por la función de validación.

        Parámetros:
        - func: La función de validación de la que se extraerán los parámetros.

        Retorna:
        - Lista de nombres de parámetros requeridos.
        """
        from inspect import signature
        sig = signature(func)
        return [param.name for param in sig.parameters.values() if param.default == param.empty and param.name != "value"]




    def map_tipo_dato_to_sql(self, tipo_dato):
        """
        Mapea el tipo de dato del esquema al tipo de dato SQL correspondiente.
        """
        if tipo_dato == 'integer':
            return 'INTEGER'
        elif tipo_dato == 'varchar':
            return 'VARCHAR(255)'
        elif tipo_dato == 'date':
            return 'DATE'
        # Agrega más mapeos según sea necesario
        return 'TEXT'


@project_ns.route('/delete', methods=['DELETE'])
@project_ns.param('token', 'Token de autenticación', _in='query', required=False)
class DeleteMultipleProjectsResource(Resource):
    @require_auth
    def delete(self):
        """
        Elimina múltiples proyectos por sus IDs.

        Este endpoint permite eliminar varios proyectos y todas sus dependencias asociadas.

        Parámetros:
        - JSON con una lista de IDs de los proyectos a eliminar.

        Retorna:
        - 200: Proyectos eliminados exitosamente.
        - 404: Si alguno de los proyectos no se encuentra.
        - 500: Si ocurre un error en el servidor.
        """    
        if not request.is_json:
            return {"error": "El contenido debe ser JSON y tener un Content-Type adecuado."}, 400

        data = request.get_json()
        project_ids = data.get("project_ids", [])

        if not isinstance(project_ids, list) or not project_ids:
            return {"error": "Debe proporcionar una lista de IDs de proyectos."}, 400

        try:
            for project_id in project_ids:
                project = ProyectoValidaciones.query.get(project_id)
                if not project:
                    return {"error": f"Proyecto con ID {project_id} no encontrado."}, 404

                db.session.delete(project)
            
            db.session.commit()
            return {"message": "Proyectos eliminados exitosamente."}, 200

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error al eliminar los proyectos: {str(e)}")
            return {"error": f"Error al eliminar los proyectos: {str(e)}"}, 500

@project_ns.route('/<int:project_id>', methods=['PUT'])
@project_ns.param('token', 'Token de autenticación', _in='query', required=False)
@project_ns.param('project_id', 'ID del proyecto a actualizar')
class UpdateProjectResource(Resource):
    @require_auth
    @project_ns.expect(project_model, validate=True)
    def put(self, project_id):
        """
        Actualiza un proyecto por su ID.

        Este endpoint permite actualizar la información de un proyecto existente,
        incluyendo sus esquemas y validaciones.

        Parámetros:
        - project_id (int): ID del proyecto a actualizar.
        - JSON con los siguientes campos obligatorios:
            - nombre_proyecto: Nombre del proyecto.
            - esquemas: Lista de esquemas asociados al proyecto.
            - validaciones: Lista de validaciones aplicadas a los campos.
            - usuario_modificacion: Usuario que realiza la modificación.

        Retorna:
        - 200: Proyecto actualizado exitosamente.
        - 404: Si el proyecto no se encuentra.
        - 400: Si falta algún campo obligatorio.
        - 500: Si ocurre un error en el servidor.

        Ejemplo de solicitud:
        ```json
        {
            "nombre_proyecto": "Proyecto Actualizado",
            "esquemas": [...],
            "validaciones": [...],
            "usuario_modificacion": "usuario1"
        }
        ```
        """
        if not request.is_json:
            return {"error": "El contenido debe ser JSON y tener un Content-Type adecuado."}, 400

        data = request.get_json()

        required_fields = ["nombre_proyecto", "esquemas", "validaciones", "usuario_modificacion"]
        for field in required_fields:
            if field not in data:
                return {"error": f"El campo '{field}' es obligatorio."}, 400

        try:
            project = ProyectoValidaciones.query.get(project_id)
            if not project:
                return {"error": "Proyecto no encontrado."}, 404

            project.nombre_proyecto = data["nombre_proyecto"]
            project.usuario_modificacion = data["usuario_modificacion"]
            db.session.commit()

            ProyectoEsquemas.query.filter_by(proyecto_id=project.id).delete()
            for esquema in data["esquemas"]:
                nuevo_esquema = ProyectoEsquemas(
                    proyecto_id=project.id,
                    campo_nombre=esquema["campo_nombre"],
                    tipo_dato=esquema["tipo_dato"],
                    requerido=esquema.get("requerido", False),
                    longitud_maxima=esquema.get("longitud_maxima"),
                    valores_permitidos=esquema.get("valores_permitidos"),
                    es_clave_primaria=esquema.get("es_clave_primaria", False),
                    es_unico=esquema.get("es_unico", False)
                )
                db.session.add(nuevo_esquema)

            ValidacionesCampos.query.filter_by(proyecto_id=project.id).delete()
            for validacion in data["validaciones"]:
                # Buscando el ID de la validación basado en el nombre de la regla
                validacion_definida = ValidacionesDefinidas.query.filter_by(nombre_regla=validacion["nombre_regla"]).first()
                if not validacion_definida:
                    return {"error": f"La regla de validación '{validacion['nombre_regla']}' no existe en las validaciones definidas."}, 400

                nueva_validacion = ValidacionesCampos(
                    proyecto_id=project.id,
                    campo_nombre=validacion["campo_nombre"],
                    validacion_id=validacion_definida.id,
                    valor=validacion.get("valor"),
                    mensaje_error=validacion.get("mensaje_error", "Error en la validación.")
                )
                db.session.add(nueva_validacion)

            db.session.commit()

            return {"message": "Proyecto actualizado exitosamente."}, 200

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error al actualizar el proyecto: {str(e)}")
            return {"error": f"Error al actualizar el proyecto: {str(e)}"}, 500


ALLOWED_EXTENSIONS = {'csv'}
def allowed_file(filename):
    """
    Verifica si el archivo tiene una extensión permitida.

    Parámetros:
    - filename (str): Nombre del archivo.

    Retorna:
    - bool: True si el archivo tiene una extensión permitida, False de lo contrario.
    """    
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

   
@file_upload_ns.route('/<int:project_id>', methods=['POST'])
@file_upload_ns.param('token', 'Token de autenticación', _in='query', required=False)
@file_upload_ns.param('project_id', 'ID del proyecto asociado')
class FileUploadResource(Resource):
    @require_auth
    @file_upload_ns.doc('upload_file', params={'project_id': 'ID del proyecto asociado'})
    def post(self, project_id):
        project = ProyectoValidaciones.query.get(project_id)
        if not project:
            return {"error": "Proyecto no encontrado."}, 404

        if 'file' not in request.files:
            return {"error": "No se ha enviado un archivo"}, 400

        file = request.files['file']
        if file.filename == '':
            return {"error": "El nombre del archivo está vacío"}, 400

        if file and allowed_file(file.filename):
            try:
                file_content = file.read().decode('utf-8')
                csv_data = io.StringIO(file_content)
                df = pd.read_csv(csv_data)

                esquemas = ProyectoEsquemas.query.filter_by(proyecto_id=project_id).all()
                nombres_campos_db = {esquema.campo_nombre for esquema in esquemas}

                nombres_campos_csv = set(df.columns)
                if nombres_campos_db != nombres_campos_csv:
                    db.session.delete(project)
                    db.session.commit()
                    return {
                        "error": "El esquema del archivo no es correcto.",
                        "campos_esperados": list(nombres_campos_db),
                        "nombre_proyecto": project.nombre_proyecto
                    }, 400

                validaciones = ValidacionesCampos.query.filter_by(proyecto_id=project_id).all()

                errores = []

                for index, row in df.iterrows():
                    for validacion in validaciones:
                        try:
                            validacion_definida = ValidacionesDefinidas.query.filter_by(id=validacion.validacion_id).first()

                            if not validacion_definida:
                                db.session.delete(project)
                                db.session.commit()
                                return {"error": f"No se encontró la validación para la regla con id {validacion.validacion_id}."}, 400

                            validation_module_path = f'app.services.validations.{validacion_definida.nombre_regla}'
                            validation_module = __import__(validation_module_path, fromlist=['validate'])

                            # Extraer los parámetros necesarios desde el valor JSON
                            parametros = validacion.valor if validacion.valor else {}

                            # Verificar si hay parámetros requeridos que faltan en el JSON
                            parametros_faltantes = [param for param in self.get_required_params(validation_module.validate) if param != "value" and param not in parametros]
                            if parametros_faltantes:
                                db.session.delete(project)
                                db.session.commit()
                                return {
                                    "error": f"Faltan parámetros requeridos para la validación '{validacion_definida.nombre_regla}'. Parámetros faltantes: {parametros_faltantes}"
                                }, 400

                            # Extraer valor de la celda que se va a validar
                            valor_celda = row[validacion.campo_nombre]

                            # Llamar a la función de validación con los parámetros correctos
                            is_valid, error_message = validation_module.validate(valor_celda, **parametros)

                            if not is_valid:
                                errores.append({
                                    "fila": index + 1,
                                    "campo": validacion.campo_nombre,
                                    "valor_incorrecto": valor_celda,
                                    "mensaje_error": error_message
                                })
                        except ModuleNotFoundError:
                            expected_modules = [f'app.services.validations.{v.nombre_regla}' for v in ValidacionesDefinidas.query.all()]
                            db.session.delete(project)
                            db.session.commit()
                            return {
                                "error": f"Módulo de validación no encontrado para la regla '{validacion_definida.nombre_regla}'.",
                                "modulos_esperados": expected_modules
                            }, 400
                        except AttributeError:
                            db.session.delete(project)
                            db.session.commit()
                            return {
                                "error": f"La función de validación no se encontró para la regla '{validacion_definida.nombre_regla}'"
                            }, 400

                if errores:
                    db.session.delete(project)
                    db.session.commit()
                    return {
                        "error": "Se encontraron errores en la validación del archivo.",
                        "errores": errores
                    }, 400

                # Validar si la tabla ya existe
                table_name = project.nombre_tabla
                
                # Limpiar la tabla antes de insertar los nuevos datos
                db.session.execute(text(f"DELETE FROM datos.{table_name};"))

                for _, row in df.iterrows():
                    columns = ", ".join(row.index)
                    values = ", ".join([f"'{value}'" for value in row.values])
                    db.session.execute(text(f"INSERT INTO datos.{table_name} ({columns}) VALUES ({values});"))

                db.session.commit()

                return {"message": "Archivo procesado e insertado exitosamente"}, 200

            except Exception as e:
                db.session.rollback()
                logger.error(f"Error al procesar el archivo: {str(e)}")
                return {"error": f"Error al procesar el archivo y el proyecto fue eliminado: {str(e)}"}, 500

        return {"error": "Tipo de archivo no permitido"}, 400

    def get_required_params(self, func):
        """
        Extrae los nombres de los parámetros requeridos por la función de validación.

        Parámetros:
        - func: La función de validación de la que se extraerán los parámetros.

        Retorna:
        - Lista de nombres de parámetros requeridos.
        """
        from inspect import signature
        sig = signature(func)
        return [param.name for param in sig.parameters.values() if param.default == param.empty and param.name != "value"]

    def map_tipo_dato_to_sql(self, tipo_dato):
        """
        Mapea el tipo de dato del esquema al tipo de dato SQL correspondiente.
        """
        if tipo_dato == 'integer':
            return 'INTEGER'
        elif tipo_dato == 'varchar':
            return 'VARCHAR(255)'
        elif tipo_dato == 'date':
            return 'DATE'
        # Agrega más mapeos según sea necesario
        return 'TEXT'
   
@validations_ns.param('token', 'Token de autenticación', _in='query', required=False)
@validations_ns.route('/')
class ValidationsListResource(Resource):
    def get(self):
        """
        Obtiene una lista de todas las validaciones definidas.

        Este endpoint devuelve todas las validaciones registradas con su nombre y descripción.

        Retorna:
        - 200: Lista de validaciones con sus detalles.
        - 500: Si ocurre un error en el servidor.
        """
        try:
            validaciones = ValidacionesDefinidas.query.all()
            if not validaciones:
                return {"message": "No se encontraron validaciones."}, 404

            validaciones_data = [
                {
                    "id": validacion.id,
                    "nombre_regla": validacion.nombre_regla,
                    "descripcion": validacion.descripcion
                }
                for validacion in validaciones
            ]

            return {"validaciones": validaciones_data}, 200

        except Exception as e:
            logger.error(f"Error al obtener validaciones: {str(e)}")
            return {"error": f"Error al obtener validaciones: {str(e)}"}, 500