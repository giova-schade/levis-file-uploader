# backend/app/__init__.py

from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_restx import Api
from flask_cors import CORS
from datetime import datetime, date
from json import JSONEncoder
from config import Config
import os

db = SQLAlchemy()

class CustomJSONEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.json_encoder = CustomJSONEncoder
    db.init_app(app)

    # Configurar CORS dinámicamente desde variables de entorno
    allowed_origin = os.getenv('CORS_ALLOWED_ORIGIN', 'http://localhost:4200')
    CORS(app, resources={r"/*": {"origins": allowed_origin}}, supports_credentials=True)

    api = Api(app, version='1.0', title='API de Gestión de Proyectos', description='Una API para la gestión de proyectos.')

    # Importar y registrar los namespaces
    from app.controllers.auth_controller import auth_ns
    from app.controllers.project_controller import project_ns, file_upload_ns, validations_ns

    api.add_namespace(auth_ns, path="/auth")
    api.add_namespace(project_ns, path="/projects")
    api.add_namespace(file_upload_ns, path="/upload")
    api.add_namespace(validations_ns, path='/validations')

    return app
