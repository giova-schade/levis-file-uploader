def validate(value):
    try:
        if float(value) <= 0:
            return False, "El campo debe ser un número positivo"
    except ValueError:
        return False, "El valor no es un número"
    return True, None
