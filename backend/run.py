from app import create_app
import os

# Cargar la configuración de la aplicación
app = create_app()

if __name__ == "__main__":
    # Puedes ajustar el host y el puerto si es necesario
    app.run(host='0.0.0.0', port=80, debug=True)
    