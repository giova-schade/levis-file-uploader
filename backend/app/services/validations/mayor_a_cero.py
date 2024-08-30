def validate(value):
    try:
        if float(value) <= 0:
            return False, "El campo debe ser mayor a cero"
    except ValueError:
        return False, "El valor no es un número"
    return True, None
