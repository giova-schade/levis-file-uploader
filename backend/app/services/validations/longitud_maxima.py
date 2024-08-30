def validate(value, max):
    if not isinstance(value, str):
        return False, "El valor no es una cadena de texto"
    if len(value) > max:
        return False, f"El campo no debe exceder {max} caracteres"
    return True, None
