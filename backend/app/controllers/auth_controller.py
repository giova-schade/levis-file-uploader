# backend/app/controllers/auth_controller.py
from flask import Blueprint, request, jsonify
from flask_restx import Namespace, Resource
from app.services.auth_service import validate_token

auth_ns = Namespace('auth', description='Operaciones de autenticación')

@auth_ns.route('/validate_token')
class ValidateTokenResource(Resource):
    def post(self):
        """
        Valida un token JWT.

        **Descripción:**
        Este endpoint permite validar un token JWT proporcionado en los headers de la solicitud.

        **Parámetros de entrada:**
        - Header `Authorization`: Debe incluir el token en el formato "Bearer <token>".

        **Respuesta:**
        - 200: Si el token es válido.
        - 400: Si no se proporcionó el token.
        - 401: Si el token es inválido.

        **Ejemplo de solicitud:**

        ```bash
        curl -X POST http://localhost:5000/validate_token \
        -H "Authorization: Bearer <tu_token_jwt>"
        ```

        **Ejemplo de respuesta exitosa:**

        ```json
        {
            "message": "Token válido"
        }
        ```

        **Ejemplo de respuesta con error:**

        - Si no se proporciona el token:
        ```json
        {
            "error": "Token no proporcionado"
        }
        ```

        - Si el token es inválido:
        ```json
        {
            "error": "Token inválido"
        }
        ```

        **Método HTTP:**
        - `POST`
        """    
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "Token no proporcionado"}), 400

        token = token.split(" ")[1]  # Asumiendo que el token viene como "Bearer <token>"

        if validate_token(token):
            return jsonify({"message": "Token válido"+token}), 200
        else:
            return jsonify({"error": "Token inválido"}), 401
