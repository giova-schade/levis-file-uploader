import os
import jwt
from jwt import PyJWKClient
from flask import jsonify, request, Blueprint

auth_bp = Blueprint('auth', __name__)

def get_jwks_url():
    tenant_id = os.getenv('TENANT_ID')
    return f"https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys"

def validate_token(token):
    try:
        # Obtener la URL de JWK
        jwks_url = get_jwks_url()
        jwks_client = PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        decoded_token = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=os.getenv('CLIENT_ID'),  # Valida la audiencia
            issuer=f"https://login.microsoftonline.com/{os.getenv('TENANT_ID')}/v2.0",
            options={"verify_signature": False}  
        )

        return decoded_token

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expirado"}), 401
    except jwt.InvalidAudienceError:
        return jsonify({"error": "Audiencia inválida"}), 401
    except jwt.InvalidIssuerError:
        return jsonify({"error": "Emisor inválido"}), 401
    except jwt.InvalidTokenError as e:
        return jsonify({"error": f"Token inválido: {str(e)}"}), 401

@auth_bp.route('/validate_token', methods=['POST'])
def validate_token_route():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "Token no proporcionado"}), 400

    # Extraer el token del header
    token = auth_header.split(" ")[1]  # Asume formato "Bearer <token>"

    # Validar el token
    validation_result = validate_token(token)

    if isinstance(validation_result, dict):
        # Si se validó correctamente, puedes retornar un mensaje de éxito o los datos decodificados
        return jsonify({"message": "Token válido"+token, "data": validation_result}), 200
    else:
        # Si hay un error, el resultado será un mensaje de error JSON
        return validation_result
