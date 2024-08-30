# backend/init_db.py
from app import create_app, db
from app.models.project import ProyectoValidaciones
from sqlalchemy import inspect

def create_tables():
        
    app = create_app()
    with app.app_context():
        # Verificar si la tabla ya existe
        inspector = inspect(db.engine)
        if not inspector.has_table('proyecto_validaciones', schema='datos'):
            print("Creando la tabla 'proyecto_validaciones' en el esquema 'datos'...")
            db.create_all()
        else:
            print("La tabla 'proyecto_validaciones' ya existe en el esquema 'datos'.")

if __name__ == "__main__":
    create_tables()
