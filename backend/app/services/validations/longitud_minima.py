def validate(value, min):
    if not isinstance(value, str):
        return False, "El valor no es una cadena de texto"
    if len(value) < min:
        return False, f"El campo debe tener al menos {min} caracteres"
    return True, None
