from datetime import datetime

def validate(value):
    try:
        fecha = datetime.strptime(value, "%Y-%m-%d")
        if fecha > datetime.now():
            return False, "La fecha no puede estar en el futuro"
    except ValueError:
        return False, "El valor no es una fecha válida"
    return True, None
